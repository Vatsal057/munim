import { ensureSchema, query } from "@/lib/db";
import { markReminderPaid } from "@/lib/payments";
import { formatINR } from "@/lib/money";
import { publicAppUrl } from "@/lib/pinelabs";

type Row = { id: number; payment_ref: string | null; amount_paise: number; status: string; business_name: string; customer_name: string };

async function load(token: string): Promise<Row | undefined> {
  await ensureSchema();
  const rows = await query<Row>(
    `select r.id, r.payment_ref, r.amount_paise, r.status, m.business_name, c.name as customer_name
     from reminders r join merchants m on m.id = r.merchant_id join customers c on c.id = r.customer_id
     where r.pay_token = $1`,
    [token]
  );
  return rows[0];
}

// The stub checkout exists only for test payments; it must never clear a debt in test/live mode.
const stubOnly = () => (process.env.PINELABS_MODE || "stub") !== "stub";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * GET only renders the test checkout. Paying needs an explicit POST, because WhatsApp link
 * previews and QR-scanner prefetches GET the URL and used to mark dues paid on their own.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  if (stubOnly()) return new Response("Not found", { status: 404 });
  const { token } = await params;
  const r = await load(token);
  if (!r) return new Response("Payment link not found", { status: 404 });
  if (r.status === "paid") return Response.redirect(`${publicAppUrl()}/p/${token}`, 303);

  const amount = formatINR(Number(r.amount_paise));
  return new Response(
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Pay ${esc(amount)} · Pine Labs test checkout</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,sans-serif;background:#f3f4f8;color:#111827;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px}
.card{background:#fff;border-radius:20px;box-shadow:0 10px 40px rgba(17,24,39,.08);max-width:380px;width:100%;overflow:hidden}
.top{background:#0b2a6b;color:#fff;padding:18px 22px;display:flex;justify-content:space-between;align-items:center;font-weight:600}
.badge{background:#fbbf24;color:#3b2a00;font-size:11px;font-weight:700;padding:3px 8px;border-radius:999px;letter-spacing:.04em}
.body{padding:24px 22px}.to{color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:.08em}
.biz{font-size:18px;font-weight:600;margin:4px 0 18px}.amt{font-size:44px;font-weight:700;letter-spacing:-.02em}
.for{color:#6b7280;font-size:14px;margin:4px 0 24px}.opt{display:flex;gap:10px;align-items:center;border:2px solid #0b2a6b;border-radius:14px;padding:14px;margin-bottom:18px;font-weight:600}
button{width:100%;min-height:52px;border:0;border-radius:14px;background:#0b2a6b;color:#fff;font-size:17px;font-weight:600;cursor:pointer}
.note{color:#6b7280;font-size:12px;text-align:center;margin-top:14px}
</style></head><body><main class="card">
<div class="top"><span>Pine Labs · Checkout</span><span class="badge">TEST MODE</span></div>
<div class="body"><div class="to">Paying</div><div class="biz">${esc(r.business_name)}</div>
<div class="amt">${esc(amount)}</div><div class="for">Khata balance for ${esc(r.customer_name)}</div>
<div class="opt">⚡ UPI · any app</div>
<form method="post"><button type="submit">Pay ${esc(amount)}</button></form>
<p class="note">Test payment, no real money moves.</p></div></main></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }
  );
}

export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  if (stubOnly()) return new Response("Not found", { status: 404 });
  const { token } = await params;
  const r = await load(token);
  if (!r) return new Response("Payment link not found", { status: 404 });
  await markReminderPaid(r.id, r.payment_ref, "payment_link", "customer");
  return Response.redirect(`${publicAppUrl()}/p/${token}`, 303);
}
