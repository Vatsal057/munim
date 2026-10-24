import { redirect } from "next/navigation";
import Link from "next/link";
import { ensureSchema, query } from "@/lib/db";
import { getMerchant } from "@/lib/session";
import { getCustomerBalances, getSupplierDues } from "@/lib/ledger";
import { formatINR } from "@/lib/money";
import { buildHistories, expectedCashIn, cashGap, forecastHorizon, type RawEntry } from "@/lib/forecast";
import { buildTodayCard } from "@/lib/today";

export default async function AppHome() {
  await ensureSchema();
  const merchant = await getMerchant();
  if (!merchant) redirect("/signup");

  const [owedToMe, iOwe, rawEntries] = await Promise.all([
    getCustomerBalances(merchant.id),
    getSupplierDues(merchant.id),
    query<RawEntry>(
      `select customer_id, type, due_date, created_at from entries
       where merchant_id = $1 and type in ('credit_given', 'payment_received')`,
      [merchant.id]
    ),
  ]);

  const totalOwedToMe = owedToMe.reduce((sum, r) => sum + Number(r.balance_paise), 0);
  const totalIOwe = iOwe.reduce((sum, r) => sum + Number(r.balance_paise), 0);

  const today = new Date();
  const horizon = forecastHorizon(
    iOwe.map((r) => ({ dueDate: r.oldest_due_date })),
    today
  );
  const histories = buildHistories(rawEntries);
  const openDues = owedToMe.map((r) => ({
    customerId: r.customer_id,
    name: r.name,
    amountPaise: Number(r.balance_paise),
    oldestDueDate: r.oldest_due_date,
  }));
  const expectedIn = expectedCashIn(openDues, histories, horizon);
  const duesByHorizon = iOwe.filter((r) => !r.oldest_due_date || new Date(r.oldest_due_date) <= horizon);
  const gap = cashGap(
    duesByHorizon.map((r) => ({ amountPaise: Number(r.balance_paise), dueDate: r.oldest_due_date ?? "" })),
    expectedIn
  );

  const horizonLabel = horizon.toLocaleDateString("en-IN", { weekday: "long" });
  const remindCandidates = expectedIn.perCustomer
    .filter((c) => c.likelihood < 1)
    .sort((a, b) => b.expectedPaise - a.expectedPaise)
    .slice(0, 5);

  const todayCard = buildTodayCard({
    language: (merchant.language as "en" | "kn" | "hi") ?? "en",
    hasData: owedToMe.length > 0 || iOwe.length > 0,
    gapPaise: gap.gapPaise,
    supplierName: iOwe[0]?.name ?? null,
    supplierAmountPaise: duesByHorizon.reduce((sum, r) => sum + Number(r.balance_paise), 0),
    horizonLabel,
    expectedInPaise: expectedIn.totalPaise,
    remindCount: remindCandidates.length,
    totalOwedToMePaise: totalOwedToMe,
  });

  return (
    <div className="min-h-screen max-w-sm mx-auto p-6 flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{merchant.business_name}</h1>
        {merchant.is_demo && (
          <span className="text-xs bg-yellow-200 text-yellow-900 px-2 py-1 rounded-full">
            Sample data
          </span>
        )}
      </header>

      <div className="bg-gray-100 rounded-2xl p-5 flex flex-col gap-3">
        <p className="text-sm text-gray-700">{todayCard.message}</p>
        {todayCard.cta === "review_reminders" && (
          <Link href="/app/reminders" className="bg-black text-white rounded-lg py-2 text-center text-sm font-semibold">
            Review reminders
          </Link>
        )}
        {todayCard.cta === "remind_anyway" && remindCandidates.length > 0 && (
          <Link href="/app/reminders" className="bg-gray-300 rounded-lg py-2 text-center text-sm font-semibold">
            Remind anyway
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/app/tell"
          className="bg-black text-white rounded-2xl py-8 flex flex-col items-center justify-center gap-2 text-lg font-semibold"
        >
          <span className="text-3xl">🎙️</span>
          Tell
        </Link>
        <Link
          href="/app"
          className="bg-gray-200 rounded-2xl py-8 flex flex-col items-center justify-center gap-2 text-lg font-semibold"
        >
          <span className="text-3xl">☀️</span>
          Today
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-xs text-gray-500">They owe me</p>
          <p className="text-xl font-bold text-green-700">{formatINR(totalOwedToMe)}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <p className="text-xs text-gray-500">I owe</p>
          <p className="text-xl font-bold text-red-700">{formatINR(totalIOwe)}</p>
        </div>
      </div>

      <Link href="/app/ledger" className="text-center underline text-sm">
        View ledger →
      </Link>
      <Link href="/app/activity" className="text-center underline text-sm text-gray-500">
        Activity log
      </Link>
    </div>
  );
}
