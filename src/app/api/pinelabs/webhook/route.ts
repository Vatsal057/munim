import { ensureSchema, query } from "@/lib/db";
import { isPaymentLinkPaid, webhookPaymentLinkId } from "@/lib/pinelabs";
import { markReminderPaid } from "@/lib/payments";

export async function POST(req: Request) {
  await ensureSchema();
  const payload = await req.json().catch(() => null);

  const paymentRef = webhookPaymentLinkId(payload);
  if (!paymentRef) return Response.json({ error: "Missing reference" }, { status: 400 });

  const rows = await query<{ id: number }>(`select id from reminders where payment_ref = $1`, [paymentRef]);
  if (!rows[0]) return Response.json({ error: "Reminder not found" }, { status: 404 });

  // Never trust the webhook body: in test/live, confirm with Pine Labs' own status API.
  // Stub mode has no Pine Labs to ask, so a known stub reference is trusted.
  const stub = (process.env.PINELABS_MODE || "stub") === "stub";
  if (!stub && !(await isPaymentLinkPaid(paymentRef).catch(() => false))) {
    return Response.json({ error: "Payment not confirmed by Pine Labs" }, { status: 409 });
  }

  const result = await markReminderPaid(rows[0].id, paymentRef, "payment_link", "customer");
  return Response.json({ ok: true, already_paid: result.alreadyPaid });
}
