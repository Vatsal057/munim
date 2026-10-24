import { redirect } from "next/navigation";
import { ensureSchema, query } from "@/lib/db";
import { getMerchant } from "@/lib/session";
import RemindersClient from "./RemindersClient";
import AskMunimButton from "./AskMunimButton";

export type ReminderRow = {
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
};

export default async function RemindersPage() {
  await ensureSchema();
  const merchant = await getMerchant();
  if (!merchant) redirect("/signup");

  const reminders = await query<ReminderRow>(
    `select r.id, r.customer_id, c.name as customer_name, c.phone as customer_phone,
            r.amount_paise, r.reason, r.message, r.status, r.pay_token, r.payment_url
     from reminders r join customers c on c.id = r.customer_id
     where r.merchant_id = $1 and r.status in ('draft', 'approved')
     order by r.created_at desc`,
    [merchant.id]
  );

  return (
    <div className="min-h-screen max-w-sm mx-auto p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Reminders</h1>
        <AskMunimButton />
      </div>
      <RemindersClient
        initialReminders={reminders.map((r) => ({ ...r, amount_paise: Number(r.amount_paise) }))}
      />
    </div>
  );
}
