import { redirect } from "next/navigation";
import { ensureSchema, query } from "@/lib/db";
import { getMerchant } from "@/lib/session";

type EventRow = { action: string; actor: string; payload: Record<string, unknown>; created_at: string };

export default async function ActivityPage() {
  await ensureSchema();
  const merchant = await getMerchant();
  if (!merchant) redirect("/signup");

  const events = await query<EventRow>(
    `select action, actor, payload, created_at from events
     where merchant_id = $1 order by created_at desc limit 100`,
    [merchant.id]
  );

  return (
    <div className="min-h-screen max-w-sm mx-auto p-6 flex flex-col gap-4">
      <h1 className="text-xl font-bold">Activity</h1>
      <ul className="flex flex-col gap-2">
        {events.map((e, i) => (
          <li key={i} className="border rounded-xl px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">{e.action.replace(/_/g, " ")}</span>
              <span className="text-gray-400">{e.actor}</span>
            </div>
            <p className="text-xs text-gray-500">
              {new Date(e.created_at).toLocaleString("en-IN")}
            </p>
          </li>
        ))}
        {events.length === 0 && <p className="text-sm text-gray-500 text-center py-8">No activity yet.</p>}
      </ul>
    </div>
  );
}
