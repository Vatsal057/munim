import { ensureSchema } from "@/lib/db";
import { getMerchant } from "@/lib/session";
import { createDrafts } from "@/lib/collections";

export async function POST() {
  await ensureSchema();
  const merchant = await getMerchant();
  if (!merchant) return Response.json({ error: "Not signed in" }, { status: 401 });

  const ids = await createDrafts(merchant.id, "builtin");
  return Response.json({ ok: true, created: ids.length, reminder_ids: ids });
}
