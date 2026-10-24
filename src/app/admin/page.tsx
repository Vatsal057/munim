import crypto from "node:crypto";
import { notFound } from "next/navigation";
import { ensureSchema, query } from "@/lib/db";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  await ensureSchema();
  const { key } = await searchParams;
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || !key || !safeEqual(key, adminKey)) notFound();

  const [merchants, entriesBySource, reminderCounts, payments, agentEvents] = await Promise.all([
    query<{ id: number; name: string; business_name: string; created_at: string }>(
      `select id, name, business_name, created_at from merchants where is_demo = false order by created_at desc`
    ),
    query<{ source: string; count: string }>(
      `select e.source, count(*) from entries e
       join merchants m on m.id = e.merchant_id
       where m.is_demo = false group by e.source order by count desc`
    ),
    query<{ status: string; count: string }>(
      `select r.status, count(*) from reminders r
       join merchants m on m.id = r.merchant_id
       where m.is_demo = false group by r.status`
    ),
    query<{ count: string }>(
      `select count(*) from entries e
       join merchants m on m.id = e.merchant_id
       where m.is_demo = false and e.type = 'payment_received'`
    ),
    query<{ count: string }>(
      `select count(*) from events e
       join merchants m on m.id = e.merchant_id
       where m.is_demo = false and e.actor = 'agent'`
    ),
  ]);

  return (
    <div className="min-h-screen max-w-2xl mx-auto p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Admin</h1>
        <a href={`/api/admin/export?key=${encodeURIComponent(key)}`} className="text-sm underline">
          Export CSV
        </a>
      </div>

      <section className="grid grid-cols-2 gap-4">
        <div className="border rounded-xl p-4">
          <p className="text-xs text-gray-500">Real merchants</p>
          <p className="text-2xl font-bold">{merchants.length}</p>
        </div>
        <div className="border rounded-xl p-4">
          <p className="text-xs text-gray-500">Payments received</p>
          <p className="text-2xl font-bold">{payments[0]?.count ?? 0}</p>
        </div>
        <div className="border rounded-xl p-4">
          <p className="text-xs text-gray-500">Agent events</p>
          <p className="text-2xl font-bold">{agentEvents[0]?.count ?? 0}</p>
        </div>
        <div className="border rounded-xl p-4">
          <p className="text-xs text-gray-500">Reminders</p>
          <p className="text-sm">
            {reminderCounts.map((r) => `${r.status}: ${r.count}`).join(" · ") || "none"}
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Entries by source</h2>
        <table className="w-full text-sm">
          <tbody>
            {entriesBySource.map((r) => (
              <tr key={r.source} className="border-b">
                <td className="py-1">{r.source}</td>
                <td className="py-1 text-right">{r.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Merchants</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-1">Name</th>
              <th className="py-1">Business</th>
              <th className="py-1">Signed up</th>
            </tr>
          </thead>
          <tbody>
            {merchants.map((m) => (
              <tr key={m.id} className="border-b">
                <td className="py-1">{m.name}</td>
                <td className="py-1">{m.business_name}</td>
                <td className="py-1">{new Date(m.created_at).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
