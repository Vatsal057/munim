import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, CheckCheck, CircleCheck, Copy, ExternalLink, Inbox, Link2, MessageCircle, QrCode, Send, Sparkles, X } from "lucide-react";
import { formatINR } from "@/lib/money";
import { apiUrl, postJSON, useView, type Reminder, type RemindersView } from "@/lib/api";
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
  // While any link is out, poll so the card flips to "Paid" the moment the customer pays.
  const q = useView<RemindersView>("reminders", {
    refetchInterval: (d) => (d?.reminders.some((r) => r.status === "approved") ? 3000 : false),
  });
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
      const o = { ...r, amount_paise: Number(r.amount_paise), ...(r.status === "draft" ? overrides[r.id] : undefined) };
      return edits[r.id] !== undefined && o.status === "draft" ? { ...o, message: edits[r.id] } : o;
    });
  const pending = reminders.filter((r) => r.status === "draft").length;
  const waiting = reminders.filter((r) => r.status === "approved").length;
  const paid = reminders.filter((r) => r.status === "paid");

  // Celebrate payments that land while this screen is open.
  const seenPaid = useRef<Set<number> | null>(null);
  useEffect(() => {
    const ids = new Set(paid.map((r) => r.id));
    if (seenPaid.current) {
      for (const r of paid) {
        if (!seenPaid.current.has(r.id)) {
          toast({ title: `${formatINR(r.amount_paise)} received`, description: `${r.customer_name} paid through the Pine Labs link. Khata updated.` });
        }
      }
    }
    seenPaid.current = ids;
  }, [paid, toast]);

  function refresh() {
    void qc.invalidateQueries({ queryKey: ["view"] });
  }

  async function approve(reminder: Reminder) {
    setBusyId(reminder.id);
    setError(null);
    try {
      const res = await postJSON(`reminders/${reminder.id}/approve`, { message: reminder.message });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setBusyId(null);
        setError(body?.error || "Couldn't approve that. Try again.");
        return;
      }
      const data = await res.json();
      setOverrides((o) => ({ ...o, [reminder.id]: { status: "approved", payment_url: data.payment_url, pay_token: data.pay_token, message: data.message ?? reminder.message } }));
      setBusyId(null);
      toast({ title: "Approved", description: `Pine Labs pay link ready for ${reminder.customer_name}. Send it below.` });
      refresh();
    } catch {
      setBusyId(null);
      setError("Couldn't approve that. Try again.");
    }
  }

  function logShare(id: number) {
    void postJSON(`reminders/${id}/share`).catch(() => undefined);
  }

  function sendWhatsApp(r: Reminder) {
    window.open(buildWaMeUrl(r.customer_phone, r.message), "_blank", "noopener");
    logShare(r.id);
  }

  async function copyMessage(r: Reminder) {
    try {
      await navigator.clipboard.writeText(r.message);
      toast({ title: "Copied", description: "Message with pay link copied. Paste it in any chat." });
      logShare(r.id);
    } catch {
      setError("Couldn't copy. Select the message and copy it manually.");
    }
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
        {waiting > 0 && (
          <span className="font-num rounded-full bg-secondary px-3 py-1 text-xs font-bold text-ink">{waiting} awaiting payment</span>
        )}
        {paid.length > 0 && (
          <span className="font-num rounded-full bg-owed-soft px-3 py-1 text-xs font-bold text-owed">
            {paid.length} paid · {formatINR(paid.reduce((s, r) => s + r.amount_paise, 0))}
          </span>
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
              const isPaid = r.status === "paid";
              const locked = approved || isPaid;
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
                    isPaid ? "border-owed/40 bg-owed-soft/40" : approved ? "border-ink/20" : "border-card-border",
                  )}
                  data-testid={`card-reminder-${r.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Initials name={r.customer_name} tone={locked ? "owed" : "ink"} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[17px] font-bold text-ink">{r.customer_name}</p>
                      <p className="font-num text-xs text-muted-foreground">{r.customer_phone ? `+91 ${r.customer_phone}` : "No phone saved"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-num text-xl font-bold text-owed" data-testid={`text-amount-${r.id}`}>{formatINR(r.amount_paise)}</p>
                      <span className="text-[11px] font-semibold text-muted-foreground">{isPaid ? "received" : "owes you"}</span>
                    </div>
                  </div>


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
                      <span className="text-xs text-muted-foreground">{locked ? "Approved by you" : "Tap to edit"}</span>
                    </div>
                    <div className={cn("rounded-2xl rounded-tl-md border p-3", locked ? "border-owed/20 bg-owed-soft/50" : "border-input bg-background/60 focus-within:border-ink")}>
                      <textarea
                        value={r.message}
                        onChange={(e) => setEdits((m) => ({ ...m, [r.id]: e.target.value }))}
                        disabled={locked}
                        rows={isPaid ? 2 : 4}
                        className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-ink focus:outline-none disabled:opacity-90"
                        placeholder="Draft message..."
                        data-testid={`input-message-${r.id}`}
                      />
                      <div className="flex items-center justify-between border-t border-border pt-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Link2 className="h-3 w-3" /> {locked ? "Includes Pine Labs pay link" : "Pay link is added when you approve"}
                        </span>
                        <span className="font-num">{r.message.length}</span>
                      </div>
                    </div>
                  </div>

                  {isPaid ? (
                    <div className="flex items-center gap-2 rounded-2xl bg-owed px-4 py-3 text-background" data-testid={`status-paid-${r.id}`}>
                      <CircleCheck className="h-5 w-5 shrink-0" />
                      <p className="text-[15px] font-semibold">
                        Paid {r.paid_at ? new Date(r.paid_at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : ""} · due cleared from khata
                      </p>
                    </div>
                  ) : approved ? (
                    <SendPanel
                      r={r}
                      busy={busy}
                      onWhatsApp={() => sendWhatsApp(r)}
                      onCopy={() => copyMessage(r)}
                      onMarkPaid={() => markPaid(r)}
                    />
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="owed" className="flex-1" onClick={() => approve(r)} disabled={busy || !r.message.trim()} data-testid={`button-approve-${r.id}`}>
                        {busy ? (
                          <>
                            <Spinner /> Creating pay link…
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" /> Approve
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={() => reject(r.id)} disabled={busy} aria-label="Dismiss" data-testid={`button-reject-${r.id}`} className="px-4">
                        <X className="h-4 w-4" /> Dismiss
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

function SendPanel({
  r,
  busy,
  onWhatsApp,
  onCopy,
  onMarkPaid,
}: {
  r: Reminder;
  busy: boolean;
  onWhatsApp: () => void;
  onCopy: () => void;
  onMarkPaid: () => void;
}) {
  const [showQr, setShowQr] = useState(false);
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-input bg-background/70 p-3" data-testid={`panel-send-${r.id}`}>
      <div className="flex items-center gap-2 text-sm font-semibold text-ink">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-haldi opacity-75 motion-reduce:animate-none" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-haldi" />
        </span>
        Waiting for {r.customer_name.split(" ")[0]} to pay · updates live
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="owed" onClick={onWhatsApp} data-testid={`button-whatsapp-${r.id}`}>
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </Button>
        <Button variant="outline" onClick={onCopy} data-testid={`button-copy-${r.id}`}>
          <Copy className="h-4 w-4" /> Copy message
        </Button>
        {r.pay_token && (
          <a
            href={`${import.meta.env.BASE_URL}p/${r.pay_token}`}
            target="_blank"
            rel="noopener"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-input bg-card px-4 text-[15px] font-semibold text-ink"
            data-testid={`link-customer-view-${r.id}`}
          >
            <ExternalLink className="h-4 w-4" /> Customer's view
          </a>
        )}
        <Button variant="outline" onClick={() => setShowQr((v) => !v)} aria-expanded={showQr} data-testid={`button-qr-${r.id}`}>
          <QrCode className="h-4 w-4" /> {showQr ? "Hide QR" : "Show QR"}
        </Button>
      </div>
      {showQr && (
        <div className="flex items-center gap-4 rounded-2xl bg-card p-3">
          <img src={apiUrl(`reminders/${r.id}/qr`)} alt={`QR code to pay ${formatINR(r.amount_paise)}`} className="h-32 w-32 rounded-lg" />
          <p className="text-sm leading-snug text-muted-foreground">
            Customer at the counter? They scan this with their phone camera and pay {formatINR(r.amount_paise)} through Pine Labs.
          </p>
        </div>
      )}
      <button
        onClick={onMarkPaid}
        disabled={busy}
        className="inline-flex min-h-10 items-center justify-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-ink disabled:opacity-60"
        data-testid={`button-mark-paid-${r.id}`}
      >
        {busy ? <Spinner /> : <CheckCheck className="h-4 w-4" />} Paid in cash? Mark paid
      </button>
    </div>
  );
}
