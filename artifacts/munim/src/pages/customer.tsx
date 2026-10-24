import { useState } from "react";
import { useParams } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CheckCheck, FileText, Smartphone, Trash2 } from "lucide-react";
import { formatINR } from "@/lib/money";
import { postJSON, useView, type CustomerView } from "@/lib/api";
import { Button, Initials, Notice, Page, Spinner, StateCard, TopBar, fmtDate } from "@/components/munim/ui";
import { useToast } from "@/hooks/use-toast";
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

      {!settled && <SettlePanel d={d} youOwe={!owedToMe} amountPaise={Math.abs(bal)} />}

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
                  <span className="flex items-center gap-1">
                    <span className="font-num text-lg font-bold text-ink">{formatINR(Number(e.amount_paise))}</span>
                    <DeleteEntry id={e.id} />
                  </span>
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

/**
 * Settle a balance by hand. Suppliers: open a UPI app (phones) and/or record the payment.
 * Customers: record cash collected at the counter. Always an explicit tap; nothing pays itself.
 */
function SettlePanel({ d, youOwe, amountPaise }: { d: CustomerView; youOwe: boolean; amountPaise: number }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [rupees, setRupees] = useState(String(amountPaise / 100));
  const [upiId, setUpiId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amount = Number(rupees);
  const valid = Number.isFinite(amount) && amount > 0;
  const upiValid = /^[\w.-]+@[\w.-]+$/.test(upiId.trim());

  const upiHref = `upi://pay?${new URLSearchParams({
    pa: upiId.trim(),
    pn: d.customer.name,
    am: valid ? amount.toFixed(2) : "",
    cu: "INR",
    tn: "Payment via Munim",
  }).toString()}`;

  async function record() {
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      const res = await postJSON("entries", {
        entries: [
          {
            type: youOwe ? "supplier_paid" : "payment_received",
            party_name: d.customer.name,
            party_kind: d.customer.kind,
            amount_rupees: amount,
            due_date: null,
            items: null,
            note: youOwe && upiValid ? `Paid by UPI to ${upiId.trim()}` : youOwe ? "Paid (recorded by you)" : "Collected (recorded by you)",
            source: "manual",
          },
        ],
      });
      setBusy(false);
      if (!res.ok) return setError("Couldn't save that. Try again.");
      toast({
        title: youOwe ? "Payment recorded" : "Collection recorded",
        description: `${formatINR(Math.round(amount * 100))} ${youOwe ? "to" : "from"} ${d.customer.name}. Balances updated.`,
      });
      await qc.invalidateQueries({ queryKey: ["view"] });
    } catch {
      setBusy(false);
      setError("Couldn't save that. Try again.");
    }
  }

  const inputCls =
    "min-h-12 w-full rounded-2xl border border-input bg-background/60 px-4 text-[17px] text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15";

  return (
    <section className="rise flex flex-col gap-3 rounded-[1.5rem] border border-card-border bg-card p-4 shadow-xs" data-testid="panel-settle">
      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {youOwe ? `Pay ${d.customer.name}` : `Collected from ${d.customer.name}?`}
      </h2>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-ink">Amount</span>
        <div className="relative">
          <span className="font-num pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
          <input
            inputMode="decimal"
            value={rupees}
            onChange={(e) => setRupees(e.target.value.replace(/[^\d.]/g, ""))}
            className={cn(inputCls, "font-num pl-9")}
            data-testid="input-settle-amount"
          />
        </div>
      </label>

      {youOwe && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink">
            Supplier's UPI ID <span className="font-normal text-muted-foreground">(optional)</span>
          </span>
          <input
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            className={inputCls}
            placeholder="shreewholesale@okaxis"
            autoCapitalize="none"
            autoCorrect="off"
            data-testid="input-upi-id"
          />
        </label>
      )}

      {error && <Notice>{error}</Notice>}

      <div className={cn("grid gap-2", youOwe && "sm:grid-cols-2")}>
        {youOwe && (
          <a
            href={upiValid && valid ? upiHref : undefined}
            aria-disabled={!upiValid || !valid}
            className={cn(
              "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ink px-4 text-[15px] font-semibold text-background",
              (!upiValid || !valid) && "pointer-events-none opacity-50",
            )}
            data-testid="link-pay-upi"
          >
            <Smartphone className="h-4 w-4 text-haldi" /> Pay in UPI app
          </a>
        )}
        <Button variant="owed" onClick={record} disabled={busy || !valid} data-testid="button-record-settle">
          {busy ? <Spinner /> : <CheckCheck className="h-4 w-4" />} {youOwe ? "Record as paid" : "Record payment received"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {youOwe
          ? "Pay in any UPI app (on your phone), or in cash or by bank, then tap Record as paid so Munim updates what you owe."
          : "For cash or UPI paid straight to you. Pine Labs link payments are recorded automatically."}
      </p>
    </section>
  );
}

/** Two taps, no browser dialog: first tap arms, second deletes. Disarms itself after 4 s. */
function DeleteEntry({ id }: { id: number }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (!armed) {
      setArmed(true);
      setTimeout(() => setArmed(false), 4000);
      return;
    }
    setBusy(true);
    const res = await postJSON(`entries/${id}/delete`).catch(() => null);
    setBusy(false);
    setArmed(false);
    if (!res?.ok) {
      toast({ title: "Couldn't delete", description: "Try again." });
      return;
    }
    toast({ title: "Entry deleted", description: "Balances updated." });
    await qc.invalidateQueries({ queryKey: ["view"] });
  }

  return (
    <button
      onClick={onClick}
      disabled={busy}
      aria-label={armed ? "Tap again to delete this entry" : "Delete entry"}
      className={cn(
        "inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold transition-colors",
        armed ? "bg-owe text-background" : "text-muted-foreground hover:bg-owe-soft hover:text-owe",
      )}
      data-testid={`button-delete-entry-${id}`}
    >
      {busy ? <Spinner /> : <Trash2 className="h-4 w-4" />}
      {armed && "Delete?"}
    </button>
  );
}
