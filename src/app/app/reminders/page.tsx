import { redirect } from "next/navigation";
import Link from "next/link";
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

  const draftCount = reminders.filter((r) => r.status === "draft").length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <div className="max-w-md mx-auto px-5 pt-6 flex flex-col gap-5">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
          <Link
            href="/app"
            className="text-xs font-semibold text-slate-600 hover:text-slate-950 flex items-center gap-1.5 py-1.5"
          >
            <span>←</span>
            <span>Home</span>
          </Link>
          <AskMunimButton />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">
              Collections Queue
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800">
              {draftCount} pending
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Every reminder requires your tap before sending via WhatsApp. You are always in control.
          </p>
        </div>

        <RemindersClient
          initialReminders={reminders.map((r) => ({ ...r, amount_paise: Number(r.amount_paise) }))}
        />
      </div>
    </div>
  );
}
