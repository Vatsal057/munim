import crypto from "node:crypto";
import { ensureSchema, query } from "@/lib/db";
import { getMerchant } from "@/lib/session";
import { createPaymentLink } from "@/lib/pinelabs";
import { logEvent } from "@/lib/events";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const merchant = await getMerchant();
  if (!merchant) return Response.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const reminderId = Number(id);

  const body = await req.json().catch(() => ({}));
  const editedMessage: string | undefined = body?.message;

  const rows = await query<{
    id: number;
    customer_id: number;
    amount_paise: number;
    status: string;
    message: string;
    customer_name: string;
  }>(
    `select r.id, r.customer_id, r.amount_paise, r.status, r.message, c.name as customer_name
     from reminders r join customers c on c.id = r.customer_id
     where r.id = $1 and r.merchant_id = $2`,
    [reminderId, merchant.id]
  );
  const reminder = rows[0];
  if (!reminder) return Response.json({ error: "Not found" }, { status: 404 });
  if (reminder.status !== "draft") {
    return Response.json({ error: "Reminder already processed" }, { status: 400 });
  }

  const payToken = crypto.randomBytes(16).toString("hex");

  let paymentUrl: string;
  let paymentRef: string;
  try {
    const link = await createPaymentLink(
      {
        amountPaise: reminder.amount_paise,
        reference: String(reminder.id),
        customerName: reminder.customer_name,
        merchantName: merchant.business_name,
      },
      payToken
    );
    paymentUrl = link.paymentUrl;
    paymentRef = link.paymentRef;
  } catch (err) {
    console.error(err);
    return Response.json(
      { error: "Couldn't create the payment link. Try again." },
      { status: 502 }
    );
  }

  const finalMessage = (editedMessage ?? reminder.message).includes("{PAY_LINK}")
    ? (editedMessage ?? reminder.message).replace("{PAY_LINK}", paymentUrl)
    : `${editedMessage ?? reminder.message} ${paymentUrl}`;

  await query(
    `update reminders
     set status = 'approved', message = $2, pay_token = $3, payment_url = $4, payment_ref = $5, approved_at = now()
     where id = $1`,
    [reminderId, finalMessage, payToken, paymentUrl, paymentRef]
  );

  await logEvent(merchant.id, "merchant", "reminder_approved", {
    reminder_id: reminderId,
    amount_paise: reminder.amount_paise,
  });

  return Response.json({ ok: true, pay_token: payToken, payment_url: paymentUrl, message: finalMessage });
}
