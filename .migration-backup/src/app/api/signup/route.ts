import { z } from "zod";
import { ensureSchema, query } from "@/lib/db";
import { generateSessionToken, SESSION_COOKIE } from "@/lib/session";
import { logEvent } from "@/lib/events";

const Body = z.object({
  name: z.string().min(1),
  phone: z.string().regex(/^\d{10}$/, "Phone must be 10 digits"),
  business_name: z.string().min(1),
  business_type: z.enum(["kirana", "tiffin", "tailor", "cart", "side_hustle", "personal"]),
  language: z.enum(["en", "kn", "hi"]).default("en"),
});

export async function POST(req: Request) {
  await ensureSchema();
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, phone, business_name, business_type, language } = parsed.data;
  const token = generateSessionToken();

  const rows = await query<{ id: number }>(
    `insert into merchants (name, phone, business_name, business_type, language, session_token)
     values ($1, $2, $3, $4, $5, $6) returning id`,
    [name, phone, business_name, business_type, language, token]
  );
  const merchantId = rows[0].id;
  await logEvent(merchantId, "merchant", "signup", { name, business_type });

  const res = Response.json({ ok: true });
  res.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}`
  );
  return res;
}
