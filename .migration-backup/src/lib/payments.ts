import { query } from "./db";
import { logEvent, type Actor } from "./events";

export type Reminder = {
  id: number;
  merchant_id: number;
  customer_id: number;
  amount_paise: number;
  status: string;
  payment_ref: string | null;
};

/** Idempotent: a second call for an already-paid reminder is a no-op. */
export async function markReminderPaid(
  reminderId: number,
  paymentRef: string | null,
  source: "payment_link" | "manual",
  actor: Actor
): Promise<{ alreadyPaid: boolean }> {
  const rows = await query<Reminder>(`select * from reminders where id = $1`, [reminderId]);
  const reminder = rows[0];
  if (!reminder) throw new Error("Reminder not found");
  if (reminder.status === "paid") return { alreadyPaid: true };

  await query(
    `update reminders set status = 'paid', paid_at = now(), payment_ref = coalesce($2, payment_ref)
     where id = $1`,
    [reminderId, paymentRef]
  );

  await query(
    `insert into entries (merchant_id, customer_id, type, amount_paise, source)
     values ($1, $2, 'payment_received', $3, $4)`,
    [reminder.merchant_id, reminder.customer_id, reminder.amount_paise, source]
  );

  await logEvent(reminder.merchant_id, actor, "payment_received", {
    reminder_id: reminderId,
    amount_paise: reminder.amount_paise,
    payment_ref: paymentRef,
    source,
  });

  return { alreadyPaid: false };
}
