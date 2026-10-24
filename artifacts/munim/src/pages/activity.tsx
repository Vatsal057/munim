import { Bot, Activity as ActivityIcon, User } from "lucide-react";
import { useView, type ActivityView } from "@/lib/api";
import { Page, PageTitle, StateCard, TopBar, fmtDate } from "@/components/munim/ui";
import { ViewGate } from "@/components/munim/view-gate";
import { cn } from "@/lib/utils";

export default function Activity() {
  const q = useView<ActivityView>("activity");
  return <ViewGate q={q}>{(d) => <ActivityBody d={d} />}</ViewGate>;
}

function ActivityBody({ d }: { d: ActivityView }) {
  return (
    <Page>
      <TopBar />
      <PageTitle title="Activity" sub="Proof of life: everything Munim and you have done, newest first." />
      {d.events.length === 0 ? (
        <StateCard icon={<ActivityIcon className="h-6 w-6" />} title="No activity yet." />
      ) : (
        <ol className="flex flex-col divide-y divide-border overflow-hidden rounded-[1.5rem] border border-card-border bg-card">
          {d.events.map((e, i) => {
            const isAgent = /agent|munim|system/i.test(e.actor);
            return (
              <li key={i} className="rise flex items-start gap-3 px-4 py-3.5" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }} data-testid={`row-event-${i}`}>
                <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", isAgent ? "bg-haldi-soft text-[hsl(28_60%_22%)]" : "bg-secondary text-ink")}>
                  {isAgent ? <Bot className="h-4.5 w-4.5" /> : <User className="h-4.5 w-4.5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-[15px] font-semibold capitalize text-ink">{e.action.replace(/_/g, " ")}</span>
                    <span className="shrink-0 text-xs font-medium text-muted-foreground">{e.actor}</span>
                  </span>
                  <span className="block text-xs text-muted-foreground">{fmtDate(e.created_at, true)}</span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </Page>
  );
}
