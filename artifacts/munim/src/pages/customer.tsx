import { useParams } from "wouter";
import { CalendarClock, FileText } from "lucide-react";
import { formatINR } from "@/lib/money";
import { useView, type CustomerView } from "@/lib/api";
import { Initials, Page, StateCard, TopBar, fmtDate } from "@/components/munim/ui";
import { ViewGate } from "@/components/munim/view-gate";
import { cn } from "@/lib/utils";

const MONEY_IN = new Set(["payment_received", "sale", "supplier_paid"]);

export default function Customer() {
  const { id } = useParams<{ id: string }>();
  const q = useView<CustomerView>(`customers/${id}`);
  return <ViewGate q={q}>{(d) => <CustomerBody d={d} />}</ViewGate>;
}

function CustomerBody({ d }: { d: CustomerView }) {
  const isSupplier = d.customer.kind === "supplier";
  const bal = Number(d.balance);
  // For customers a positive balance is owed to me; for suppliers it's what I owe.
  const owedToMe = isSupplier ? bal < 0 : bal > 0;
  const settled = bal === 0;

  return (
    <Page>
      <TopBar back="/app/ledger" backLabel="Ledger" />
      <section className="rise flex flex-col items-center gap-3 rounded-[1.75rem] border border-card-border bg-card px-5 py-7 text-center shadow-sm">
        <Initials name={d.customer.name} tone={settled ? "ink" : owedToMe ? "owed" : "owe"} className="h-16 w-16 text-lg" />
        <div>
          <h1 className="font-display text-[1.75rem] font-semibold leading-tight text-ink" data-testid="text-party-name">{d.customer.name}</h1>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{isSupplier ? "Supplier" : "Customer"}</p>
        </div>
        <p className={cn("font-num text-4xl font-bold", settled ? "text-ink" : owedToMe ? "text-owed" : "text-owe")} data-testid="text-balance">
          {formatINR(Math.abs(bal))}
        </p>
        <span className={cn("rounded-full px-3 py-1 text-sm font-semibold", settled ? "bg-secondary text-ink" : owedToMe ? "bg-owed-soft text-owed" : "bg-owe-soft text-owe")}>
          {settled ? "All settled" : owedToMe ? "Owes you" : "You owe"}
        </span>
      </section>

      <h2 className="px-1 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">History</h2>
      {d.entries.length === 0 ? (
        <StateCard icon={<FileText className="h-6 w-6" />} title="No entries yet." />
      ) : (
        <ol className="relative flex flex-col gap-2 border-l-2 border-dashed border-border pl-4">
          {d.entries.map((e, i) => {
            const incoming = MONEY_IN.has(e.type);
            return (
              <li key={e.id} className="rise relative rounded-2xl border border-card-border bg-card px-4 py-3" style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }} data-testid={`row-entry-${e.id}`}>
                <span className={cn("absolute -left-[23px] top-5 h-3 w-3 rounded-full ring-4 ring-background", incoming ? "bg-owed" : "bg-haldi")} />
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[15px] font-semibold capitalize text-ink">{e.type.replace(/_/g, " ")}</span>
                  <span className="font-num text-lg font-bold text-ink">{formatINR(Number(e.amount_paise))}</span>
                </div>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                  {fmtDate(e.created_at)}
                  {e.due_date && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="h-3 w-3" /> due {fmtDate(e.due_date)}
                    </span>
                  )}
                </p>
                {e.note && <p className="mt-1 text-sm text-muted-foreground">{e.note}</p>}
              </li>
            );
          })}
        </ol>
      )}
    </Page>
  );
}
