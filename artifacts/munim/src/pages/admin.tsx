import type { ReactNode } from "react";
import { Download } from "lucide-react";
import { apiUrl, useView, type AdminView } from "@/lib/api";
import { Page, PageTitle, fmtDate } from "@/components/munim/ui";
import { ViewGate } from "@/components/munim/view-gate";

export default function Admin() {
  const key = new URLSearchParams(window.location.search).get("key") ?? "";
  const q = useView<AdminView>(`admin?key=${encodeURIComponent(key)}`, { publicView: true });
  return <ViewGate q={q}>{(d) => <AdminBody d={d} adminKey={key} />}</ViewGate>;
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-card-border bg-card p-4">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <div className="font-num mt-1 text-2xl font-bold text-ink">{value}</div>
    </div>
  );
}

function AdminBody({ d, adminKey }: { d: AdminView; adminKey: string }) {
  return (
    <Page wide>
      <div className="flex items-end justify-between gap-3 pt-2">
        <PageTitle eyebrow="Internal" title="Admin" />
        <a
          href={apiUrl(`admin/export?key=${encodeURIComponent(adminKey)}`)}
          data-testid="link-export"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-background"
        >
          <Download className="h-4 w-4" /> Export CSV
        </a>
      </div>
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Real merchants" value={d.merchants.length} />
        <Stat label="Payments received" value={d.paymentsCount ?? 0} />
        <Stat label="Agent events" value={d.agentEventsCount ?? 0} />
        <Stat
          label="Reminders"
          value={<span className="text-sm font-semibold">{d.reminderCounts.map((r) => `${r.status}: ${r.count}`).join(" · ") || "none"}</span>}
        />
      </section>
      <section className="rounded-2xl border border-card-border bg-card p-4">
        <h2 className="mb-2 font-semibold text-ink">Entries by source</h2>
        <table className="w-full text-sm">
          <tbody>
            {d.entriesBySource.map((r) => (
              <tr key={r.source} className="border-b border-border last:border-0">
                <td className="py-2">{r.source}</td>
                <td className="font-num py-2 text-right">{r.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="overflow-x-auto rounded-2xl border border-card-border bg-card p-4">
        <h2 className="mb-2 font-semibold text-ink">Merchants</h2>
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="py-2 font-semibold">Name</th>
              <th className="py-2 font-semibold">Business</th>
              <th className="py-2 font-semibold">Signed up</th>
            </tr>
          </thead>
          <tbody>
            {d.merchants.map((m) => (
              <tr key={m.id} className="border-t border-border">
                <td className="py-2">{m.name}</td>
                <td className="py-2">{m.business_name}</td>
                <td className="py-2">{fmtDate(m.created_at, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </Page>
  );
}
