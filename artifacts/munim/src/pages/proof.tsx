import { BadgeCheck, Bot, CreditCard, LogIn, NotebookPen, Send, Users, Zap } from "lucide-react";
import { useView } from "@/lib/api";
import { Logo, Page } from "@/components/munim/ui";
import { ViewGate } from "@/components/munim/view-gate";

type ProofView = {
  generatedAt: string;
  totals: {
    users: number;
    logins: number;
    activeToday: number;
    entries: number;
    remindersApproved: number;
    payments: number;
    agentActions: number;
  };
  users: {
    name: string;
    phone: string;
    business_type: string;
    signed_up_at: string;
    last_seen: string | null;
    entries: number;
    logins: number;
  }[];
};

const fmt = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })
    : "—";

export default function Proof() {
  const q = useView<ProofView>("proof", { publicView: true, refetchInterval: () => 15_000 });
  return <ViewGate q={q}>{(d) => <ProofBody d={d} />}</ViewGate>;
}

function ProofBody({ d }: { d: ProofView }) {
  const t = d.totals;
  const stats = [
    { icon: Users, label: "Signed-up users", value: t.users },
    { icon: LogIn, label: "Logins", value: t.logins },
    { icon: Zap, label: "Active today", value: t.activeToday },
    { icon: NotebookPen, label: "Khata entries", value: t.entries },
    { icon: Bot, label: "Agent actions", value: t.agentActions },
    { icon: Send, label: "Reminders approved", value: t.remindersApproved },
    { icon: CreditCard, label: "Payments", value: t.payments },
  ];
  return (
    <Page wide>
      <header className="flex items-center gap-3 pt-1">
        <Logo />
        <div>
          <h1 className="font-display text-[1.6rem] font-semibold leading-tight text-ink">Munim · Proof of life</h1>
          <p className="text-sm text-muted-foreground">
            Live from our database · updated {fmt(d.generatedAt)} IST · refreshes every 15 s
          </p>
        </div>
      </header>

      <p className="flex items-start gap-2 rounded-2xl border border-owed/30 bg-owed-soft px-4 py-3 text-sm text-ink">
        <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-owed" />
        Names and phone numbers are masked for privacy.
      </p>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="proof-stats">
        {stats.map(({ icon: Icon, label, value }, i) => (
          <div key={label} className={`rounded-[1.25rem] border border-card-border bg-card p-4 shadow-xs ${i === 0 ? "col-span-2 sm:col-span-1" : ""}`}>
            <Icon className="h-5 w-5 text-haldi" />
            <p className="font-num mt-2 text-3xl font-bold text-ink">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-[1.5rem] border border-card-border bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-secondary text-xs uppercase tracking-[0.1em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Signed up</th>
                <th className="px-4 py-3">Last active</th>
                <th className="px-4 py-3 text-right">Logins</th>
                <th className="px-4 py-3 text-right">Entries</th>
              </tr>
            </thead>
            <tbody>
              {d.users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No sign-ups yet.
                  </td>
                </tr>
              ) : (
                d.users.map((u, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="font-num px-4 py-3 text-muted-foreground">{d.users.length - i}</td>
                    <td className="px-4 py-3 font-semibold text-ink">{u.name}</td>
                    <td className="font-num px-4 py-3 text-muted-foreground">{u.phone}</td>
                    <td className="px-4 py-3 capitalize text-ink">{u.business_type.replace(/_/g, " ")}</td>
                    <td className="font-num px-4 py-3 text-ink">{fmt(u.signed_up_at)}</td>
                    <td className="font-num px-4 py-3 text-muted-foreground">{fmt(u.last_seen)}</td>
                    <td className="font-num px-4 py-3 text-right text-ink">{u.logins}</td>
                    <td className="font-num px-4 py-3 text-right text-ink">{u.entries}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </Page>
  );
}
