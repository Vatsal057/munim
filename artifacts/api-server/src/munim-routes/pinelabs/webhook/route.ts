import { ensureSchema, query } from "@/lib/db";
import { isPaymentLinkPaid, webhookPaymentLinkId } from "@/lib/pinelabs";
import { markReminderPaid } from "@/lib/payments";

export async function POST(req: Request) {
  await ensureSchema();
  // Stub mode has no Pine Labs to send or confirm webhooks; stub payments go through the
  // stub checkout link instead, so forged stub references are rejected here.
  if ((process.env.PINELABS_MODE || "stub") === "stub") {
    return Response.json({ error: "Webhooks are disabled in stub mode" }, { status: 404 });
  }
  const payload = await req.json().catch(() => null);

  const paymentRef = webhookPaymentLinkId(payload);
  if (!paymentRef) return Response.json({ error: "Missing reference" }, { status: 400 });

  const rows = await query<{ id: number }>(`select id from reminders where payment_ref = $1`, [paymentRef]);
  if (!rows[0]) return Response.json({ error: "Reminder not found" }, { status: 404 });

  // Never trust the webhook body: confirm with Pine Labs' own status API.
  if (!(await isPaymentLinkPaid(paymentRef).catch(() => false))) {
    return Response.json({ error: "Payment not confirmed by Pine Labs" }, { status: 409 });
  }

  const result = await markReminderPaid(rows[0].id, paymentRef, "payment_link", "customer");
  return Response.json({ ok: true, already_paid: result.alreadyPaid });
}
