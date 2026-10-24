import { ensureSchema, query } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/session";
import { demoSessionToken, PERSONA_PHONES, PERSONA_SLUGS } from "@/lib/seed/demoToken";

export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  await ensureSchema();
  const { slug } = await params;
  if (!PERSONA_SLUGS.includes(slug as (typeof PERSONA_SLUGS)[number])) {
    return Response.json({ error: "Unknown persona" }, { status: 404 });
  }

  const token = demoSessionToken(slug);
  let rows = await query<{ id: number }>(`select id from merchants where session_token = $1`, [token]);
  if (!rows[0]) {
    // Self-heal: an older login build overwrote demo tokens. Restore it on the seeded demo shop.
    rows = await query<{ id: number }>(
      `update merchants set session_token = $1
       where id = (select id from merchants where is_demo and phone = $2 order by created_at desc limit 1)
       returning id`,
      [token, PERSONA_PHONES[slug as (typeof PERSONA_SLUGS)[number]]]
    );
  }
  if (!rows[0]) {
    return Response.json({ error: "Demo data not seeded yet. Run `npm run seed`." }, { status: 404 });
  }

  const res = Response.json({ ok: true });
  res.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}`
  );
  return res;
}
