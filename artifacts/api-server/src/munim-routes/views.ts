/**
 * Read endpoints that replace the data loading previously done inside Next.js
 * server components. Query logic is carried over unchanged from the original pages.
 */
import crypto from "node:crypto";
import { ensureSchema, query } from "@/lib/db";
import { getMerchant } from "@/lib/session";
import { getCustomerBalances, getSupplierDues, calcBalance } from "@/lib/ledger";
import { buildHistories, expectedCashIn, cashGap, forecastHorizon, type RawEntry } from "@/lib/forecast";
import { buildTodayCard } from "@/lib/today";
import { buildQrDataUrl } from "@/lib/share";
import { isPaymentLinkPaid } from "@/lib/pinelabs";
import { markReminderPaid } from "@/lib/payments";

const unauthorized = () => Response.json({ error: "Not signed in" }, { status: 401 });
const notFound = () => Response.json({ error: "Not found" }, { status: 404 });

function publicMerchant(m: NonNullable<Awaited<ReturnType<typeof getMerchant>>>) {
  return {
    id: m.id,
    name: m.name,
    phone: m.phone,
    business_name: m.business_name,
    business_type: m.business_type,
    language: m.language,
    is_demo: m.is_demo,
  };
}

export async function home() {
  await ensureSchema();
  const merchant = await getMerchant();
  if (!merchant) return unauthorized();

  const [owedToMe, iOwe, rawEntries] = await Promise.all([
    getCustomerBalances(merchant.id),
    getSupplierDues(merchant.id),
    query<RawEntry>(
      `select customer_id, type, due_date, created_at from entries
       where merchant_id = $1 and type in ('credit_given', 'payment_received')`,
      [merchant.id]
    ),
  ]);

  const totalOwedToMe = owedToMe.reduce((sum, r) => sum + Number(r.balance_paise), 0);
  const totalIOwe = iOwe.reduce((sum, r) => sum + Number(r.balance_paise), 0);

  const today = new Date();
  const horizon = forecastHorizon(
    iOwe.map((r) => ({ dueDate: r.oldest_due_date })),
    today
  );
  const histories = buildHistories(rawEntries);
  const openDues = owedToMe.map((r) => ({
    customerId: r.customer_id,
    name: r.name,
    amountPaise: Number(r.balance_paise),
    oldestDueDate: r.oldest_due_date,
  }));
  const expectedIn = expectedCashIn(openDues, histories, horizon);
  const duesByHorizon = iOwe.filter((r) => !r.oldest_due_date || new Date(r.oldest_due_date) <= horizon);
  const gap = cashGap(
    duesByHorizon.map((r) => ({ amountPaise: Number(r.balance_paise), dueDate: r.oldest_due_date ?? "" })),
    expectedIn
  );

  const horizonLabel = horizon.toLocaleDateString("en-IN", { weekday: "long" });
  const remindCandidates = expectedIn.perCustomer
    .filter((c) => c.likelihood < 1)
    .sort((a, b) => b.expectedPaise - a.expectedPaise)
    .slice(0, 5);

  const todayCard = buildTodayCard({
    language: (merchant.language as "en" | "kn" | "hi") ?? "en",
    hasData: owedToMe.length > 0 || iOwe.length > 0,
    gapPaise: gap.gapPaise,
    supplierName: iOwe[0]?.name ?? null,
    supplierAmountPaise: duesByHorizon.reduce((sum, r) => sum + Number(r.balance_paise), 0),
    horizonLabel,
    expectedInPaise: expectedIn.totalPaise,
    remindCount: remindCandidates.length,
    totalOwedToMePaise: totalOwedToMe,
  });

  const pendingDrafts = await query<{ count: string }>(
    `select count(*) from reminders where merchant_id = $1 and status = 'draft'`,
    [merchant.id]
  );

  return Response.json({
    merchant: publicMerchant(merchant),
    totalOwedToMe,
    totalIOwe,
    owedToMeCount: owedToMe.length,
    iOweCount: iOwe.length,
    gapPaise: gap.gapPaise,
    todayCard,
    remindCount: remindCandidates.length,
    draftCount: Number(pendingDrafts[0]?.count ?? 0),
  });
}

function serializeParties(rows: Awaited<ReturnType<typeof getCustomerBalances>>) {
  return rows.map((r) => ({ ...r, balance_paise: Number(r.balance_paise) }));
}

export async function ledger() {
  await ensureSchema();
  const merchant = await getMerchant();
  if (!merchant) return unauthorized();

  const [owedToMe, iOwe] = await Promise.all([
    getCustomerBalances(merchant.id),
    getSupplierDues(merchant.id),
  ]);
  return Response.json({ owedToMe: serializeParties(owedToMe), iOwe: serializeParties(iOwe) });
}

export async function customer(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const merchant = await getMerchant();
  if (!merchant) return unauthorized();

  const { id } = await params;
  const customerId = Number(id);
  if (!Number.isInteger(customerId)) return notFound();

  const customers = await query<{ id: number; name: string; kind: "customer" | "supplier" }>(
    `select id, name, kind from customers where id = $1 and merchant_id = $2`,
    [customerId, merchant.id]
  );
  if (!customers[0]) return notFound();

  const entries = await query<{
    id: number;
    type: string;
    amount_paise: number;
    due_date: string | null;
    note: string | null;
    created_at: string;
  }>(
    `select id, type, amount_paise, due_date, note, created_at from entries
     where customer_id = $1 and merchant_id = $2 order by created_at desc`,
    [customerId, merchant.id]
  );

  const balance = calcBalance(
    entries.map((e) => ({ type: e.type, amount_paise: Number(e.amount_paise) })),
    customers[0].kind
  );

  return Response.json({
    customer: customers[0],
    balance,
    entries: entries.map((e) => ({ ...e, amount_paise: Number(e.amount_paise) })),
  });
}

export async function activity() {
  await ensureSchema();
  const merchant = await getMerchant();
  if (!merchant) return unauthorized();

  const events = await query<{ action: string; actor: string; payload: Record<string, unknown>; created_at: string }>(
    `select action, actor, payload, created_at from events
     where merchant_id = $1 order by created_at desc limit 100`,
    [merchant.id]
  );
  return Response.json({ events });
}

export async function reminders() {
  await ensureSchema();
  const merchant = await getMerchant();
  if (!merchant) return unauthorized();

  const rows = await query<{
    id: number;
    customer_id: number;
    customer_name: string;
    customer_phone: string | null;
    amount_paise: number;
    reason: string;
    message: string;
    status: string;
    pay_token: string | null;
    payment_url: string | null;
  }>(
    `select r.id, r.customer_id, c.name as customer_name, c.phone as customer_phone,
            r.amount_paise, r.reason, r.message, r.status, r.pay_token, r.payment_url
     from reminders r join customers c on c.id = r.customer_id
     where r.merchant_id = $1 and r.status in ('draft', 'approved')
     order by r.created_at desc`,
    [merchant.id]
  );

  return Response.json({
    reminders: rows.map((r) => ({ ...r, amount_paise: Number(r.amount_paise) })),
    draftCount: rows.filter((r) => r.status === "draft").length,
  });
}

export async function pay(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  await ensureSchema();
  const { token } = await params;

  const rows = await query<{
    id: number;
    payment_ref: string | null;
    amount_paise: number;
    status: string;
    payment_url: string | null;
    business_name: string;
    customer_name: string;
  }>(
    `select r.id, r.payment_ref, r.amount_paise, r.status, r.payment_url, m.business_name, c.name as customer_name
     from reminders r
     join merchants m on m.id = r.merchant_id
     join customers c on c.id = r.customer_id
     where r.pay_token = $1`,
    [token]
  );
  const reminder = rows[0];
  if (!reminder) return notFound();

  // Customer lands back here from Pine Labs checkout: confirm with Pine Labs, no webhook needed.
  const pineLabsLive = (process.env.PINELABS_MODE || "stub") !== "stub";
  if (pineLabsLive && reminder.status !== "paid" && reminder.payment_ref) {
    if (await isPaymentLinkPaid(reminder.payment_ref).catch(() => false)) {
      await markReminderPaid(reminder.id, reminder.payment_ref, "payment_link", "customer");
      reminder.status = "paid";
    }
  }

  const isTest = (process.env.PINELABS_MODE || "stub") !== "live";
  const firstName = reminder.customer_name.split(" ")[0];
  const qrDataUrl = reminder.payment_url ? await buildQrDataUrl(reminder.payment_url) : null;

  return Response.json({
    business_name: reminder.business_name,
    customer_name: reminder.customer_name,
    firstName,
    amount_paise: Number(reminder.amount_paise),
    status: reminder.status,
    payment_url: reminder.payment_url,
    isTest,
    qrDataUrl,
  });
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function admin(req: Request) {
  await ensureSchema();
  const key = new URL(req.url).searchParams.get("key");
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || !key || !safeEqual(key, adminKey)) return notFound();

  const [merchants, entriesBySource, reminderCounts, payments, agentEvents] = await Promise.all([
    query<{ id: number; name: string; business_name: string; created_at: string }>(
      `select id, name, business_name, created_at from merchants where is_demo = false order by created_at desc`
    ),
    query<{ source: string; count: string }>(
      `select e.source, count(*) from entries e
       join merchants m on m.id = e.merchant_id
       where m.is_demo = false group by e.source order by count desc`
    ),
    query<{ status: string; count: string }>(
      `select r.status, count(*) from reminders r
       join merchants m on m.id = r.merchant_id
       where m.is_demo = false group by r.status`
    ),
    query<{ count: string }>(
      `select count(*) from entries e
       join merchants m on m.id = e.merchant_id
       where m.is_demo = false and e.type = 'payment_received'`
    ),
    query<{ count: string }>(
      `select count(*) from events e
       join merchants m on m.id = e.merchant_id
       where m.is_demo = false and e.actor = 'agent'`
    ),
  ]);

  return Response.json({
    merchants,
    entriesBySource: entriesBySource.map((r) => ({ source: r.source, count: Number(r.count) })),
    reminderCounts: reminderCounts.map((r) => ({ status: r.status, count: Number(r.count) })),
    paymentsCount: Number(payments[0]?.count ?? 0),
    agentEventsCount: Number(agentEvents[0]?.count ?? 0),
  });
}
