import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, CheckCheck, CircleCheck, Inbox, Link2, MessageCircle, Send, Share2, Sparkles, X } from "lucide-react";
import { formatINR } from "@/lib/money";
import { apiFetch, postJSON, useView, viewKey, type Reminder, type RemindersView } from "@/lib/api";
import { Button, Initials, Notice, Page, PageTitle, Spinner, StateCard, TopBar } from "@/components/munim/ui";
import { ViewGate } from "@/components/munim/view-gate";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

function buildWaMeUrl(phone: string | null, text: string): string {
  const encoded = encodeURIComponent(text);
  if (phone) {
    const digits = phone.replace(/\D/g, "");
    const withCountryCode = digits.length === 10 ? `91${digits}` : digits;
    return `https://wa.me/${withCountryCode}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

export default function Reminders() {
  const q = useView<RemindersView>("reminders");
  return <ViewGate q={q}>{(d) => <RemindersBody d={d} />}</ViewGate>;
}

function AskMunimButton() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    try {
      await postJSON("agent/run");
    } catch {
      // refetch below regardless
    } finally {
      await qc.invalidateQueries({ queryKey: ["view"] });
      setBusy(false);
    }
  }
  return (
    <button
      onClick={run}
      disabled={busy}
      data-testid="button-ask-munim"
      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-background shadow-sm transition-transform active:scale-95 disabled:opacity-70"
    >
      {busy ? <Spinner className="text-haldi" /> : <Sparkles className="h-4 w-4 text-haldi" />}
      {busy ? "Munim is drafting…" : "Ask Munim"}
    </button>
  );
}

function RemindersBody({ d }: { d: RemindersView }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [overrides, setOverrides] = useState<Record<number, Partial<Reminder>>>({});
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reminders = d.reminders
    .filter((r) => !removed.has(r.id))
    .map((r) => {
      const o = { ...r, amount_paise: Number(r.amount_paise), ...overrides[r.id] };
      return edits[r.id] !== undefined && o.status === "draft" ? { ...o, message: edits[r.id] } : o;
    });
  const pending = reminders.filter((r) => r.status === "draft").length;

  function refresh() {
    void qc.invalidateQueries({ queryKey: ["view"] });
  }

  async function approveAndSend(reminder: Reminder) {
    setBusyId(reminder.id);
    setError(null);
    try {
      const res = await postJSON(`reminders/${reminder.id}/approve`, { message: reminder.message });
      if (!res.ok) {
        setBusyId(null);
        setError("Couldn't approve that. Try again.");
        return;
      }
      const data = await res.json();
      const approved: Reminder = { ...reminder, status: "approved", payment_url: data.payment_url, pay_token: data.pay_token, message: data.message ?? reminder.message };
      setOverrides((o) => ({ ...o, [reminder.id]: { status: "approved", payment_url: approved.payment_url, pay_token: approved.pay_token, message: approved.message } }));
      setBusyId(null);
      toast({ title: "Approved", description: `Pay link ready for ${reminder.customer_name}.` });
      await share(approved);
      void qc.invalidateQueries({ queryKey: viewKey("home") });
    } catch {
      setBusyId(null);
      setError("Couldn't approve that. Try again.");
    }
  }

  async function share(reminder: Reminder) {
    if (!reminder.payment_url) return;
    try {
      if (navigator.canShare) {
        const qrRes = await apiFetch(`reminders/${reminder.id}/qr`);
        if (qrRes.ok) {
          const blob = await qrRes.blob();
          const file = new File([blob], "pay-qr.png", { type: "image/png" });
          if (navigator.canShare({ files: [file], text: reminder.message })) {
            await navigator.share({ files: [file], text: reminder.message });
            await postJSON(`reminders/${reminder.id}/share`).catch(() => undefined);
            return;
          }
        }
      }
    } catch {
      // user cancelled or share failed — fall through to wa.me
    }
    window.open(buildWaMeUrl(reminder.customer_phone, reminder.message), "_blank");
    await postJSON(`reminders/${reminder.id}/share`).catch(() => undefined);
  }

  async function reject(id: number) {
    setBusyId(id);
    setError(null);
    try {
      const res = await postJSON(`reminders/${id}/reject`);
      setBusyId(null);
      if (res.ok) {
        setRemoved((s) => new Set(s).add(id));
        refresh();
      } else setError("Couldn't dismiss that. Try again.");
    } catch {
      setBusyId(null);
      setError("Couldn't dismiss that. Try again.");
    }
  }

  async function markPaid(r: Reminder) {
    setBusyId(r.id);
    setError(null);
    try {
      const res = await postJSON(`reminders/${r.id}/mark-paid`);
      setBusyId(null);
      if (res.ok) {
        setRemoved((s) => new Set(s).add(r.id));
        toast({ title: "Marked paid", description: `${formatINR(r.amount_paise)} from ${r.customer_name} cleared.` });
        refresh();
      } else setError("Couldn't mark that as paid. Try again.");
    } catch {
      setBusyId(null);
      setError("Couldn't mark that as paid. Try again.");
    }
  }

  return (
    <Page>
      <TopBar right={<AskMunimButton />} />
      <div className="flex items-end justify-between gap-3">
        <PageTitle title="Collections" sub="Every reminder waits for your tap before it goes on WhatsApp. You are always in control." />
      </div>
      <div className="flex items-center gap-2">
        <span className="font-num rounded-full bg-haldi-soft px-3 py-1 text-xs font-bold text-[hsl(28_60%_20%)]" data-testid="text-pending-count">
          {pending || d.draftCount} pending
        </span>
        {reminders.length - pending > 0 && (
          <span className="font-num rounded-full bg-owed-soft px-3 py-1 text-xs font-bold text-owed">{reminders.length - pending} sent</span>
        )}
      </div>

      {error && <Notice>{error}</Notice>}

      {reminders.length === 0 ? (
        <StateCard
          icon={<Inbox className="h-6 w-6" />}
          title="Queue is clear"
          body={'No reminders waiting. Tap "Ask Munim" above and it will look through your khata and draft polite reminders for customers who owe you.'}
        />
      ) : (
        <ul className="flex flex-col gap-4">
          <AnimatePresence initial={false}>
            {reminders.map((r, i) => {
              const approved = r.status === "approved";
              const busy = busyId === r.id;
              return (
                <motion.li
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 6) * 0.05 } }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.22 } }}
                  className={cn(
                    "relative flex flex-col gap-4 overflow-hidden rounded-[1.75rem] border bg-card p-4 shadow-sm",
                    approved ? "border-owed/30" : "border-card-border",
                  )}
                  data-testid={`card-reminder-${r.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Initials name={r.customer_name} tone={approved ? "owed" : "ink"} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[17px] font-bold text-ink">{r.customer_name}</p>
                      <p className="font-num text-xs text-muted-foreground">{r.customer_phone ? `+91 ${r.customer_phone}` : "No phone saved"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-num text-xl font-bold text-owed" data-testid={`text-amount-${r.id}`}>{formatINR(r.amount_paise)}</p>
                      <span className="text-[11px] font-semibold text-muted-foreground">owes you</span>
                    </div>
                  </div>

                  {approved && (
                    <span className="stamp absolute right-4 top-16 rounded-md border-2 border-owed px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-owed">
                      Approved
                    </span>
                  )}

                  <div className="flex items-start gap-2.5 rounded-2xl bg-haldi-soft/60 px-3.5 py-3">
                    <Bot className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(28_60%_30%)]" />
                    <p className="text-sm leading-snug text-ink">
                      <strong className="font-semibold">Why remind: </strong>
                      {r.reason}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between px-1">
                      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp message
                      </span>
                      <span className="text-xs text-muted-foreground">{approved ? "Locked" : "Tap to edit"}</span>
                    </div>
                    <div className={cn("rounded-2xl rounded-tl-md border p-3", approved ? "border-owed/20 bg-owed-soft/50" : "border-input bg-background/60 focus-within:border-ink")}>
                      <textarea
                        value={r.message}
                        onChange={(e) => setEdits((m) => ({ ...m, [r.id]: e.target.value }))}
                        disabled={approved}
                        rows={4}
                        className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-ink focus:outline-none disabled:opacity-90"
                        placeholder="Draft message..."
                        data-testid={`input-message-${r.id}`}
                      />
                      <div className="flex items-center justify-between border-t border-border pt-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Link2 className="h-3 w-3" /> Carries payment link & UPI QR
                        </span>
                        <span className="font-num">{r.message.length}</span>
                      </div>
                    </div>
                  </div>

                  {!approved ? (
                    <div className="flex gap-2">
                      <Button variant="owed" className="flex-1" onClick={() => approveAndSend(r)} disabled={busy || !r.message.trim()} data-testid={`button-approve-${r.id}`}>
                        {busy ? (
                          <>
                            <Spinner /> Preparing…
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" /> Approve & send
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={() => reject(r.id)} disabled={busy} aria-label="Dismiss" data-testid={`button-reject-${r.id}`} className="px-4">
                        <X className="h-4 w-4" /> Dismiss
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="ink" onClick={() => share(r)} data-testid={`button-share-${r.id}`}>
                        <Share2 className="h-4 w-4" /> Share again
                      </Button>
                      <Button variant="outline" onClick={() => markPaid(r)} disabled={busy} className="border-owed/40 text-owed hover:bg-owed-soft" data-testid={`button-mark-paid-${r.id}`}>
                        {busy ? <Spinner /> : <CheckCheck className="h-4 w-4" />} Mark paid
                      </Button>
                    </div>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      <p className="flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
        <CircleCheck className="h-4 w-4 text-owed" /> Munim never sends anything without you.
      </p>
    </Page>
  );
}
