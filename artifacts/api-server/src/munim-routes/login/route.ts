import { z } from "zod";
import { ensureSchema, query } from "@/lib/db";
import { generateSessionToken, sessionCookie, verifyPin } from "@/lib/session";
import { logEvent } from "@/lib/events";
import { rateLimited } from "@/lib/rateLimit";
import { demoSessionToken, PERSONA_PHONES } from "@/lib/seed/demoToken";

const Body = z.object({
  phone: z.string().regex(/^\d{10}$/),
  pin: z.string().regex(/^\d{4}$/),
});

// Judges' test login opens a sample shop. Sample shops are never counted as users.
const DEMO_PIN = process.env.DEMO_PIN || "1234";

export async function POST(req: Request) {
  await ensureSchema();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter your 10-digit phone and 4-digit PIN." }, { status: 400 });
  const { phone, pin } = parsed.data;

  if (rateLimited(`login:${phone}`, 5)) {
    return Response.json({ error: "Too many tries. Wait a minute and try again." }, { status: 429 });
  }

  const rows = await query<{ id: number; is_demo: boolean; pin_hash: string | null }>(
    `select id, is_demo, pin_hash from merchants where phone = $1 order by is_demo asc, created_at desc limit 1`,
    [phone]
  );
  const m = rows[0];
  const ok = m && (m.is_demo ? pin === DEMO_PIN : m.pin_hash !== null && verifyPin(pin, m.pin_hash));
  if (!m || !ok) return Response.json({ error: "Phone number or PIN doesn't match." }, { status: 401 });

  // Demo shops share one fixed token with the "Try a demo shop" button; never rotate it.
  const slug = m.is_demo ? Object.entries(PERSONA_PHONES).find(([, p]) => p === phone)?.[0] : undefined;
  const token = slug ? demoSessionToken(slug) : generateSessionToken();
  await query(`update merchants set session_token = $2 where id = $1`, [m.id, token]);
  await logEvent(m.id, "merchant", "login", {});

  const res = Response.json({ ok: true, is_demo: m.is_demo });
  res.headers.append("Set-Cookie", sessionCookie(token));
  return res;
}
