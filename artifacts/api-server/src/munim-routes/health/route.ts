import { ensureSchema, query } from "@/lib/db";

export async function GET() {
  await ensureSchema();
  const rows = await query<{ result: number }>("select 1 as result");
  return Response.json({ ok: true, db: rows[0]?.result === 1 });
}
