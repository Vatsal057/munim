import { ensureSchema, query } from "@/lib/db";
import { getMerchant } from "@/lib/session";
import { logEvent } from "@/lib/events";

/** Removes a mistaken entry. The events log keeps a record of what was deleted. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const merchant = await getMerchant();
  if (!merchant) return Response.json({ error: "Not signed in" }, { status: 401 });

  const id = Number((await params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "Not found" }, { status: 404 });

  const rows = await query<{ id: number; type: string; amount_paise: string; customer_id: number }>(
    `delete from entries where id = $1 and merchant_id = $2 returning id, type, amount_paise, customer_id`,
    [id, merchant.id]
  );
  if (!rows[0]) return Response.json({ error: "Not found" }, { status: 404 });

  await logEvent(merchant.id, "merchant", "entry_deleted", {
    entry_id: id,
    type: rows[0].type,
    amount_paise: Number(rows[0].amount_paise),
    customer_id: rows[0].customer_id,
  });
  return Response.json({ ok: true });
}
