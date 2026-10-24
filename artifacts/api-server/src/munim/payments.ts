import pool, { query } from "./db";
import { type Actor } from "./events";

export type Reminder = {
  id: number;
  merchant_id: number;
  customer_id: number;
  amount_paise: number;
  status: string;
  payment_ref: string | null;
};

/**
 * Idempotent and race-safe: the status transition, ledger entry and event are written in
 * one transaction, and only the request that actually flips the reminder to 'paid' records
 * the payment. Concurrent or repeated calls return { alreadyPaid: true }.
 */
export async function markReminderPaid(
  reminderId: number,
  paymentRef: string | null,
  source: "payment_link" | "manual",
  actor: Actor
): Promise<{ alreadyPaid: boolean }> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const updated = await client.query<Reminder>(
      `update reminders set status = 'paid', paid_at = now(), payment_ref = coalesce($2, payment_ref)
       where id = $1 and status <> 'paid'
       returning id, merchant_id, customer_id, amount_paise, status, payment_ref`,
      [reminderId, paymentRef]
    );
    const reminder = updated.rows[0];
    if (!reminder) {
      await client.query("rollback");
      const exists = await query<{ id: number }>(`select id from reminders where id = $1`, [reminderId]);
      if (!exists[0]) throw new Error("Reminder not found");
      return { alreadyPaid: true };
    }

    await client.query(
      `insert into entries (merchant_id, customer_id, type, amount_paise, source)
       values ($1, $2, 'payment_received', $3, $4)`,
      [reminder.merchant_id, reminder.customer_id, reminder.amount_paise, source]
    );
    await client.query(
      `insert into events (merchant_id, actor, action, payload) values ($1, $2, $3, $4)`,
      [
        reminder.merchant_id,
        actor,
        "payment_received",
        JSON.stringify({ reminder_id: reminderId, amount_paise: reminder.amount_paise, payment_ref: paymentRef, source }),
      ]
    );
    await client.query("commit");
    return { alreadyPaid: false };
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
