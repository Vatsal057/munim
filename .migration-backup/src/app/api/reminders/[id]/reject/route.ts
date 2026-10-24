import { ensureSchema, query } from "@/lib/db";
import { getMerchant } from "@/lib/session";
import { logEvent } from "@/lib/events";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const merchant = await getMerchant();
  if (!merchant) return Response.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const reminderId = Number(id);

  const rows = await query<{ id: number; status: string }>(
    `update reminders set status = 'rejected' where id = $1 and merchant_id = $2 and status = 'draft' returning id, status`,
    [reminderId, merchant.id]
  );
  if (!rows[0]) return Response.json({ error: "Not found or already processed" }, { status: 404 });

  await logEvent(merchant.id, "merchant", "reminder_rejected", { reminder_id: reminderId });
  return Response.json({ ok: true });
}
