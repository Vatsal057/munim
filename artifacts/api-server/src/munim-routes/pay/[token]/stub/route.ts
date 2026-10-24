import { ensureSchema, query } from "@/lib/db";
import { markReminderPaid } from "@/lib/payments";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  await ensureSchema();
  // The stub checkout exists only for test payments; it must never clear a debt in test/live mode.
  if ((process.env.PINELABS_MODE || "stub") !== "stub") {
    return new Response("Not found", { status: 404 });
  }
  const { token } = await params;

  const rows = await query<{ id: number; payment_ref: string | null }>(
    `select id, payment_ref from reminders where pay_token = $1`,
    [token]
  );
  if (!rows[0]) return new Response("Payment link not found", { status: 404 });

  await markReminderPaid(rows[0].id, rows[0].payment_ref, "payment_link", "customer");

  return new Response(
    `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Paid</title>
      <style>body{font-family:system-ui;text-align:center;padding:4rem 1.5rem}h1{font-size:2rem}p{color:#666}</style>
      </head><body><h1>Paid ✓ (test)</h1><p>This was a test payment. No real money moved.</p></body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
