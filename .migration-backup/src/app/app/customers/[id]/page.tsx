import { redirect, notFound } from "next/navigation";
import { ensureSchema, query } from "@/lib/db";
import { getMerchant } from "@/lib/session";
import { calcBalance } from "@/lib/ledger";
import { formatINR } from "@/lib/money";

type EntryRow = {
  id: number;
  type: string;
  amount_paise: number;
  due_date: string | null;
  note: string | null;
  created_at: string;
};

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const merchant = await getMerchant();
  if (!merchant) redirect("/signup");

  const { id } = await params;
  const customerId = Number(id);

  const customers = await query<{ id: number; name: string; kind: "customer" | "supplier" }>(
    `select id, name, kind from customers where id = $1 and merchant_id = $2`,
    [customerId, merchant.id]
  );
  if (!customers[0]) notFound();

  const entries = await query<EntryRow>(
    `select id, type, amount_paise, due_date, note, created_at from entries
     where customer_id = $1 and merchant_id = $2 order by created_at desc`,
    [customerId, merchant.id]
  );

  const balance = calcBalance(
    entries.map((e) => ({ type: e.type, amount_paise: Number(e.amount_paise) })),
    customers[0].kind
  );

  return (
    <div className="min-h-screen max-w-sm mx-auto p-6 flex flex-col gap-4">
      <h1 className="text-xl font-bold">{customers[0].name}</h1>
      <p className="text-2xl font-semibold">{formatINR(balance)}</p>

      <ul className="flex flex-col gap-2">
        {entries.map((e) => (
          <li key={e.id} className="border rounded-xl px-4 py-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium">{e.type.replace(/_/g, " ")}</span>
              <span className="font-semibold">{formatINR(Number(e.amount_paise))}</span>
            </div>
            <p className="text-xs text-gray-500">
              {new Date(e.created_at).toLocaleDateString("en-IN")}
              {e.due_date && ` · due ${new Date(e.due_date).toLocaleDateString("en-IN")}`}
            </p>
            {e.note && <p className="text-xs text-gray-500">{e.note}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
