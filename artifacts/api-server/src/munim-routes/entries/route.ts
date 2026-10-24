import { z } from "zod";
import { ensureSchema, query } from "@/lib/db";
import { getMerchant } from "@/lib/session";
import { findOrCreateCustomer } from "@/lib/ledger";
import { logEvent } from "@/lib/events";
import { rupeesToPaise } from "@/lib/money";

const ENTRY_TYPES = [
  "credit_given",
  "payment_received",
  "purchase",
  "supplier_due",
  "supplier_paid",
  "order",
  "skip",
  "sale",
  "wastage",
] as const;

const EntryInput = z.object({
  type: z.enum(ENTRY_TYPES),
  party_name: z.string().min(1),
  party_kind: z.enum(["customer", "supplier"]).default("customer"),
  amount_rupees: z.number().nonnegative(),
  due_date: z.string().nullable().optional(),
  items: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  source: z
    .enum(["text", "voice", "khata_photo", "bill_photo", "upi_screenshot", "payment_link", "manual"])
    .default("manual"),
});

const Body = z.object({ entries: z.array(EntryInput).min(1) });

export async function POST(req: Request) {
  await ensureSchema();
  const merchant = await getMerchant();
  if (!merchant) return Response.json({ error: "Not signed in" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const saved = [];
  for (const entry of parsed.data.entries) {
    const customerId = await findOrCreateCustomer(merchant.id, entry.party_kind, entry.party_name);
    const amountPaise = rupeesToPaise(entry.amount_rupees);
    const rows = await query<{ id: number }>(
      `insert into entries (merchant_id, customer_id, type, amount_paise, due_date, items, note, source)
       values ($1, $2, $3, $4, $5, $6, $7, $8) returning id`,
      [
        merchant.id,
        customerId,
        entry.type,
        amountPaise,
        entry.due_date ?? null,
        entry.items ?? null,
        entry.note ?? null,
        entry.source,
      ]
    );
    const entryId = rows[0].id;
    await logEvent(merchant.id, "merchant", "entry_created", {
      entry_id: entryId,
      type: entry.type,
      amount_paise: amountPaise,
      party_name: entry.party_name,
      source: entry.source,
    });
    saved.push({ id: entryId, customer_id: customerId });
  }

  return Response.json({ ok: true, saved });
}
