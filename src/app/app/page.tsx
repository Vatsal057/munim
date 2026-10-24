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

  const pendingDrafts = await query<{ count: string }>(
    `select count(*) from reminders where merchant_id = $1 and status = 'draft'`,
    [merchant.id]
  );
  const draftCount = Number(pendingDrafts[0]?.count ?? 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100/70 via-slate-50 to-white text-slate-900 pb-16">
      {/* Mobile App Header */}
      <div className="w-full max-w-md mx-auto px-5 pt-6 pb-4">
        <header className="flex items-center justify-between pb-3 border-b border-slate-200/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-sm shadow-xs">
              M
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-950 leading-tight">
                {merchant.business_name || merchant.name}
              </h1>
              <p className="text-[11px] text-slate-500 font-medium capitalize">
                {merchant.business_type} · {merchant.language.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {merchant.is_demo ? (
              <Link
                href="/demo"
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300/80 hover:bg-amber-200 transition-colors flex items-center gap-1 shadow-2xs"
              >
                <span>Sample Data</span>
                <span className="text-[10px] opacity-70">⇄</span>
              </Link>
            ) : (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                Live Ledger
              </span>
            )}
          </div>
        </header>
      </div>

      <div className="w-full max-w-md mx-auto px-5 flex flex-col gap-5">
        {/* Today's Munim Briefing Card */}
        <div
          className={`rounded-2xl p-5 border shadow-sm flex flex-col gap-3 relative overflow-hidden transition-all ${
            gap.gapPaise > 0
              ? "bg-gradient-to-br from-amber-500/10 via-white to-rose-500/5 border-amber-300/80 shadow-amber-500/5"
              : "bg-white border-slate-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center text-sm shadow-2xs">
                ☀️
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Daily Munim Card
              </span>
            </div>
            {gap.gapPaise > 0 ? (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                Gap: {formatINR(gap.gapPaise)}
              </span>
            ) : (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Covered ✓
              </span>
            )}
          </div>

          <p className="text-sm text-slate-800 font-medium leading-relaxed">
            {todayCard.message}
          </p>

          {todayCard.cta === "review_reminders" && (
            <Link
              href="/app/reminders"
              className="mt-1 w-full bg-slate-950 text-white rounded-xl py-3 px-4 text-center text-sm font-bold shadow-md hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <span>Review & Send Reminders</span>
              <span className="text-amber-400">→</span>
            </Link>
          )}

          {todayCard.cta === "remind_anyway" && remindCandidates.length > 0 && (
            <Link
              href="/app/reminders"
              className="mt-1 w-full bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl py-2.5 px-4 text-center text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Remind {remindCandidates.length} Customers Anyway</span>
              <span>→</span>
            </Link>
          )}

          {todayCard.cta === "tell_me" && (
            <Link
              href="/app/tell"
              className="mt-1 w-full bg-slate-900 text-white rounded-xl py-3 px-4 text-center text-sm font-semibold shadow-xs hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <span>Snap Khata Page to Start</span>
              <span>📸</span>
            </Link>
          )}
        </div>

        {/* The Two Core Action Buttons */}
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-1">
            Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-3.5">
            <Link
              href="/app/tell"
              className="group bg-slate-950 hover:bg-slate-900 text-white rounded-2xl p-5 flex flex-col justify-between min-h-[140px] shadow-md transition-all active:scale-[0.98] border border-slate-800 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="w-11 h-11 rounded-xl bg-slate-800/90 text-amber-400 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform shadow-inner">
                  🎙️
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  Voice / Photo
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1">
                  Tell Munim <span>→</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  Speak, snap bill or khata
                </span>
              </div>
            </Link>

            <Link
              href="/app/reminders"
              className="group bg-white hover:bg-slate-50/80 text-slate-900 rounded-2xl p-5 flex flex-col justify-between min-h-[140px] border border-slate-200/90 shadow-sm transition-all active:scale-[0.98] relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="w-11 h-11 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                  💬
                </span>
                {draftCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-xs animate-pulse">
                    {draftCount} ready
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-1">
                  Reminders <span>→</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  WhatsApp drafts & QR
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Financial Balances Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Khata Balances
            </span>
            <Link
              href="/app/ledger"
              className="text-xs font-semibold text-slate-900 hover:text-slate-700 flex items-center gap-1"
            >
              Full Ledger <span>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 text-left">
            <Link
              href="/app/ledger"
              className="bg-emerald-50/60 hover:bg-emerald-50 rounded-xl p-3.5 border border-emerald-200/60 transition-colors flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800">They owe me</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                  {owedToMe.length}
                </span>
              </div>
              <p className="text-xl font-extrabold text-emerald-700 tracking-tight">
                {formatINR(totalOwedToMe)}
              </p>
            </Link>

            <Link
              href="/app/ledger"
              className="bg-rose-50/60 hover:bg-rose-50 rounded-xl p-3.5 border border-rose-200/60 transition-colors flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-800">I owe</span>
                <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-md">
                  {iOwe.length}
                </span>
              </div>
              <p className="text-xl font-extrabold text-rose-700 tracking-tight">
                {formatINR(totalIOwe)}
              </p>
            </Link>
          </div>
        </div>

        {/* Navigation Shortcuts */}
        <div className="flex items-center justify-between pt-1 px-1 text-xs">
          <Link
            href="/app/activity"
            className="text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1.5 py-2"
          >
            <span>📋</span>
            <span>Proof of Life Activity Log</span>
          </Link>
          <Link
            href="/demo"
            className="text-amber-800 font-semibold bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200/70 hover:bg-amber-100 transition-colors"
          >
            Switch Persona ⇄
          </Link>
        </div>
      </div>
    </div>
  );
}
