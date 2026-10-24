import { Link, useLocation, useSearch } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ArrowLeftRight, BellRing, Camera, CheckCircle2, ChevronRight, History, Mic, ShieldCheck, Sun } from "lucide-react";
import { formatINR } from "@/lib/money";
import { postJSON, useView, type HomeView, type RecentEntry } from "@/lib/api";
import { Logo, Page } from "@/components/munim/ui";
import { ViewGate } from "@/components/munim/view-gate";
import { cn } from "@/lib/utils";

export default function Home() {
  const q = useView<HomeView>("home");
  return <ViewGate q={q}>{(d) => <HomeBody d={d} />}</ViewGate>;
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

const ENTRY_WORDS: Record<string, { label: string; sign: "+" | "-" | ""; tone: string }> = {
  credit_given: { label: "took on credit", sign: "+", tone: "text-owed" },
  payment_received: { label: "paid you", sign: "-", tone: "text-ink" },
  purchase: { label: "bill on credit", sign: "+", tone: "text-owe" },
  supplier_due: { label: "you owe", sign: "+", tone: "text-owe" },
  supplier_paid: { label: "you paid", sign: "-", tone: "text-ink" },
  order: { label: "new order", sign: "", tone: "text-ink" },
  skip: { label: "skipped", sign: "", tone: "text-muted-foreground" },
  sale: { label: "cash sale", sign: "", tone: "text-owed" },
  wastage: { label: "wastage", sign: "", tone: "text-muted-foreground" },
};

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return hrs < 24 ? `${hrs} h ago` : new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function RecentList({ recent, highlight }: { recent: RecentEntry[]; highlight: number }) {
  if (recent.length === 0) return null;
  return (
    <section className="rise rounded-[1.5rem] border border-card-border bg-card p-2 shadow-xs" data-testid="section-recent">
      <div className="flex items-center justify-between px-3 pb-1 pt-2">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Just added</span>
        <Link href="/app/activity" className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-ink">
          All activity <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <ul>
        {recent.map((e, i) => {
          const w = ENTRY_WORDS[e.type] ?? { label: e.type.replace(/_/g, " "), sign: "", tone: "text-ink" };
          return (
            <li key={e.id}>
              <Link
                href={`/app/customers/${e.customer_id}`}
                className={cn(
                  "flex min-h-14 items-center justify-between gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-secondary",
                  i < highlight && "bg-owed-soft/70",
                )}
                data-testid={`row-recent-${e.id}`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold text-ink">
                    {e.party_name} <span className="font-normal text-muted-foreground">{w.label}</span>
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {timeAgo(e.created_at)} · {e.source.replace(/_/g, " ")}
                  </span>
                </span>
                <span className={cn("font-num shrink-0 text-lg font-bold", w.tone)}>
                  {w.sign}
                  {formatINR(e.amount_paise)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function LogoutButton() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  return (
    <button
      onClick={async () => {
        await postJSON("logout").catch(() => undefined);
        qc.removeQueries({ queryKey: ["view"] });
        navigate("/login");
      }}
      data-testid="button-logout"
      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-input bg-card px-3.5 font-semibold text-ink"
    >
      Log out
    </button>
  );
}

function HomeBody({ d }: { d: HomeView }) {
  const { merchant, todayCard } = d;
  const added = Number(new URLSearchParams(useSearch()).get("added")) || 0;
  const gap = d.gapPaise ?? todayCard.gapPaise ?? 0;
  const short = gap > 0;

  return (
    <Page>
      <header className="flex items-center justify-between gap-3 pt-1">
        <div className="flex min-w-0 items-center gap-3">
          <Logo />
          <div className="min-w-0">
            <p className="truncate text-[17px] font-bold leading-tight text-ink" data-testid="text-business-name">
              {merchant.business_name || merchant.name}
            </p>
            <p className="text-xs font-medium capitalize text-muted-foreground">
              {merchant.business_type.replace(/_/g, " ")} · {merchant.language.toUpperCase()}
            </p>
          </div>
        </div>
        {merchant.is_demo ? (
          <Link
            href="/demo"
            data-testid="link-switch-persona-top"
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-haldi/50 bg-haldi-soft px-3 text-xs font-bold text-[hsl(28_60%_20%)]"
          >
            Sample data <ArrowLeftRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-owed-soft px-3 py-1.5 text-xs font-bold text-owed">
            <ShieldCheck className="h-3.5 w-3.5" /> Live ledger
          </span>
        )}
      </header>

      {added > 0 && (
        <div className="rise flex items-center gap-3 rounded-2xl border border-owed/30 bg-owed-soft px-4 py-3" role="status" data-testid="banner-added">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-owed" />
          <p className="text-[15px] font-semibold text-ink">
            Saved {added} {added === 1 ? "entry" : "entries"} to your khata. Balances and today's plan are updated.
          </p>
        </div>
      )}

      {/* Daily Munim card */}
      <section
        data-testid="card-today"
        className={cn(
          "rise margin-rule relative overflow-hidden rounded-[1.75rem] border p-5 shadow-md",
          short ? "border-owe/20 bg-card" : "border-card-border bg-card",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
            <Sun className="h-4 w-4 text-haldi" /> {greeting()}
          </span>
          {short ? (
            <span className="font-num rounded-full bg-owe-soft px-2.5 py-1 text-xs font-bold text-owe" data-testid="text-gap">
              Likely short {formatINR(Math.round(gap / 100) * 100)}
            </span>
          ) : (
            <span className="rounded-full bg-owed-soft px-2.5 py-1 text-xs font-bold text-owed">Covered this week</span>
          )}
        </div>

        <p className="mt-4 font-display text-[1.3rem] leading-snug text-ink" data-testid="text-today-message">
          {todayCard.message}
        </p>

        {todayCard.cta === "review_reminders" && (
          <Link
            href="/app/reminders"
            data-testid="link-cta-review"
            className="mt-5 flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-ink px-5 text-[17px] font-semibold text-background shadow-md transition-transform active:scale-[0.98]"
          >
            Review & send reminders <ArrowRight className="h-5 w-5 text-haldi" />
          </Link>
        )}
        {todayCard.cta === "remind_anyway" && d.remindCount > 0 && (
          <Link
            href="/app/reminders"
            data-testid="link-cta-remind-anyway"
            className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-input bg-secondary px-5 text-[15px] font-semibold text-ink"
          >
            Remind {d.remindCount} {d.remindCount === 1 ? "customer" : "customers"} anyway <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        {todayCard.cta === "tell_me" && (
          <Link
            href="/app/tell"
            data-testid="link-cta-tell"
            className="mt-5 flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-ink px-5 text-[17px] font-semibold text-background shadow-md"
          >
            <Camera className="h-5 w-5 text-haldi" /> Snap khata page to start
          </Link>
        )}
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-2 gap-3">
        <Link
          href="/app/tell"
          data-testid="link-tell"
          className="rise group relative flex min-h-[148px] flex-col justify-between overflow-hidden rounded-[1.5rem] bg-ink p-4 text-background shadow-lg transition-transform active:scale-[0.98]"
          style={{ animationDelay: "60ms" }}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background/10 text-haldi transition-transform group-hover:scale-105">
            <Mic className="h-6 w-6" />
          </span>
          <span>
            <span className="block text-lg font-bold leading-tight">Tell Munim</span>
            <span className="block text-[13px] text-background/70">Speak, snap bill or khata</span>
          </span>
        </Link>
        <Link
          href="/app/reminders"
          data-testid="link-reminders"
          className="rise group relative flex min-h-[148px] flex-col justify-between rounded-[1.5rem] border border-card-border bg-card p-4 shadow-sm transition-transform active:scale-[0.98]"
          style={{ animationDelay: "110ms" }}
        >
          <span className="flex items-start justify-between">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-haldi-soft text-[hsl(28_60%_22%)] transition-transform group-hover:scale-105">
              <BellRing className="h-6 w-6" />
            </span>
            {d.draftCount > 0 && (
              <span className="font-num rounded-full bg-haldi px-2.5 py-1 text-xs font-bold text-[hsl(28_60%_14%)]" data-testid="text-draft-count">
                {d.draftCount} ready
              </span>
            )}
          </span>
          <span>
            <span className="block text-lg font-bold leading-tight text-ink">Reminders</span>
            <span className="block text-[13px] text-muted-foreground">WhatsApp drafts & QR</span>
          </span>
        </Link>
      </section>

      {/* Balances */}
      <section className="rise rounded-[1.5rem] border border-card-border bg-card p-2 shadow-xs" style={{ animationDelay: "160ms" }}>
        <div className="flex items-center justify-between px-3 pb-1 pt-2">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Khata balances</span>
          <Link href="/app/ledger" data-testid="link-ledger" className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-ink">
            Full ledger <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <Link href="/app/ledger" data-testid="link-owed-to-me" className="flex min-h-16 items-center justify-between rounded-2xl px-3 py-3 transition-colors hover:bg-owed-soft/60">
          <span className="flex items-center gap-3">
            <span className="h-9 w-1.5 rounded-full bg-owed" />
            <span>
              <span className="block text-[15px] font-semibold text-ink">They owe me</span>
              <span className="block text-xs text-muted-foreground">{d.owedToMeCount} {d.owedToMeCount === 1 ? "person" : "people"}</span>
            </span>
          </span>
          <span className="font-num text-2xl font-bold text-owed" data-testid="text-total-owed">{formatINR(d.totalOwedToMe)}</span>
        </Link>
        <div className="mx-3 border-t border-dashed border-border" />
        <Link href="/app/ledger?tab=iowe" data-testid="link-i-owe" className="flex min-h-16 items-center justify-between rounded-2xl px-3 py-3 transition-colors hover:bg-owe-soft/60">
          <span className="flex items-center gap-3">
            <span className="h-9 w-1.5 rounded-full bg-owe" />
            <span>
              <span className="block text-[15px] font-semibold text-ink">I owe</span>
              <span className="block text-xs text-muted-foreground">{d.iOweCount} {d.iOweCount === 1 ? "supplier" : "suppliers"}</span>
            </span>
          </span>
          <span className="font-num text-2xl font-bold text-owe" data-testid="text-total-owe">{formatINR(d.totalIOwe)}</span>
        </Link>
      </section>

      <RecentList recent={d.recent ?? []} highlight={added} />

      <nav className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <Link href="/app/activity" data-testid="link-activity" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 font-semibold text-muted-foreground hover:text-ink">
          <History className="h-4 w-4" /> Activity log
        </Link>
        {merchant.is_demo ? (
          <Link href="/demo" data-testid="link-switch-persona" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-input bg-card px-3.5 font-semibold text-ink">
            <ArrowLeftRight className="h-4 w-4" /> Switch persona
          </Link>
        ) : (
          <LogoutButton />
        )}
      </nav>
    </Page>
  );
}
