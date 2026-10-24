import { useState } from "react";
import { Link } from "wouter";
import { BookOpen, ChevronRight } from "lucide-react";
import { formatINR } from "@/lib/money";
import { useView, type LedgerView } from "@/lib/api";
import { Initials, Page, PageTitle, StateCard, TopBar, fmtDate } from "@/components/munim/ui";
import { ViewGate } from "@/components/munim/view-gate";
import { cn } from "@/lib/utils";

export default function Ledger() {
  const q = useView<LedgerView>("ledger");
  return <ViewGate q={q}>{(d) => <LedgerBody d={d} />}</ViewGate>;
}

function LedgerBody({ d }: { d: LedgerView }) {
  const initial = new URLSearchParams(window.location.search).get("tab") === "iowe" ? "iowe" : "owed";
  const [tab, setTab] = useState<"owed" | "iowe">(initial);
  const rows = tab === "owed" ? d.owedToMe : d.iOwe;
  const total = rows.reduce((s, r) => s + Number(r.balance_paise), 0);
  const isOwed = tab === "owed";

  return (
    <Page>
      <TopBar />
      <PageTitle title="Ledger" />

      <div role="tablist" className="grid grid-cols-2 rounded-2xl bg-secondary p-1">
        {(["owed", "iowe"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            data-testid={`tab-${t}`}
            className={cn(
              "min-h-12 rounded-xl text-[15px] font-semibold transition-colors",
              tab === t ? "bg-card text-ink shadow-sm" : "text-muted-foreground",
            )}
          >
            <span className={cn("mr-2 inline-block h-2 w-2 rounded-full", t === "owed" ? "bg-owed" : "bg-owe")} />
            {t === "owed" ? "They owe me" : "I owe"}{" "}
            <span className="font-num text-xs opacity-70">({t === "owed" ? d.owedToMe.length : d.iOwe.length})</span>
          </button>
        ))}
      </div>

      {rows.length > 0 && (
        <div className={cn("flex items-baseline justify-between rounded-2xl px-4 py-3", isOwed ? "bg-owed-soft" : "bg-owe-soft")}>
          <span className={cn("text-sm font-semibold", isOwed ? "text-owed" : "text-owe")}>{isOwed ? "Total to collect" : "Total to pay"}</span>
          <span className={cn("font-num text-2xl font-bold", isOwed ? "text-owed" : "text-owe")}>{formatINR(total)}</span>
        </div>
      )}

      {rows.length === 0 ? (
        <StateCard icon={<BookOpen className="h-6 w-6" />} title="Nothing here yet." body={isOwed ? "When someone takes on udhaar, tell Munim and they'll show up here." : "Supplier dues you tell Munim about will appear here."} />
      ) : (
        <ul key={tab} className="flex flex-col divide-y divide-border overflow-hidden rounded-[1.5rem] border border-card-border bg-card">
          {rows.map((row, i) => (
            <li key={row.customer_id} className="rise" style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }}>
              <Link href={`/app/customers/${row.customer_id}`} data-testid={`row-party-${row.customer_id}`} className="flex min-h-[68px] items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/60">
                <Initials name={row.name} tone={isOwed ? "owed" : "owe"} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px] font-semibold text-ink">{row.name}</span>
                  {row.oldest_due_date && <span className="block text-xs text-muted-foreground">since {fmtDate(row.oldest_due_date)}</span>}
                </span>
                <span className={cn("font-num text-lg font-bold", isOwed ? "text-owed" : "text-owe")}>{formatINR(Number(row.balance_paise))}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
