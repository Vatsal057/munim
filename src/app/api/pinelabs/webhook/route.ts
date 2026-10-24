import { ensureSchema, query } from "@/lib/db";
import { verifyWebhook } from "@/lib/pinelabs";
import { markReminderPaid } from "@/lib/payments";

export async function POST(req: Request) {
  await ensureSchema();
  const signature = req.headers.get("x-pinelabs-signature");
  const payload = await req.json().catch(() => null);

  if (!verifyWebhook(payload, signature)) {
    return Response.json({ error: "Invalid webhook" }, { status: 401 });
  }

  // TODO(event): extract the real reference + payment id shape from the Pine Labs webhook payload.
  const paymentRef: string | undefined = payload?.payment_ref ?? payload?.reference;
  if (!paymentRef) return Response.json({ error: "Missing reference" }, { status: 400 });

  const rows = await query<{ id: number }>(`select id from reminders where payment_ref = $1`, [paymentRef]);
  if (!rows[0]) return Response.json({ error: "Reminder not found" }, { status: 404 });

  const result = await markReminderPaid(rows[0].id, paymentRef, "payment_link", "customer");
  return Response.json({ ok: true, already_paid: result.alreadyPaid });
}
