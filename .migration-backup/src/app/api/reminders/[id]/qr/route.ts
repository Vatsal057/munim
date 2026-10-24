import QRCode from "qrcode";
import { ensureSchema, query } from "@/lib/db";
import { getMerchant } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const merchant = await getMerchant();
  if (!merchant) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const rows = await query<{ payment_url: string | null }>(
    `select payment_url from reminders where id = $1 and merchant_id = $2`,
    [Number(id), merchant.id]
  );
  if (!rows[0]?.payment_url) return new Response("Not found", { status: 404 });

  const png = await QRCode.toBuffer(rows[0].payment_url, { margin: 1, width: 400 });
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
}
