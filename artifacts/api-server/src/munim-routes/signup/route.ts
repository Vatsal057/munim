import { z } from "zod";
import { ensureSchema, query } from "@/lib/db";
import { generateSessionToken, hashPin, sessionCookie } from "@/lib/session";
import { logEvent } from "@/lib/events";

const Body = z.object({
  name: z.string().min(1),
  phone: z.string().regex(/^\d{10}$/, "Phone must be 10 digits"),
  business_name: z.string().min(1),
  business_type: z.enum(["kirana", "tiffin", "tailor", "cart", "side_hustle", "personal"]),
  language: z.enum(["en", "kn", "hi"]).default("en"),
  pin: z.string().regex(/^\d{4}$/, "PIN must be 4 digits"),
});

export async function POST(req: Request) {
  await ensureSchema();
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, phone, business_name, business_type, language, pin } = parsed.data;

  const existing = await query<{ id: number }>(`select id from merchants where phone = $1 and is_demo = false limit 1`, [phone]);
  if (existing[0]) {
    return Response.json({ error: { fieldErrors: { phone: ["This number already has an account. Log in instead."] } } }, { status: 409 });
  }

  const token = generateSessionToken();
  const rows = await query<{ id: number }>(
    `insert into merchants (name, phone, business_name, business_type, language, session_token, pin_hash)
     values ($1, $2, $3, $4, $5, $6, $7) returning id`,
    [name, phone, business_name, business_type, language, token, hashPin(pin)]
  );
  const merchantId = rows[0].id;
  await logEvent(merchantId, "merchant", "signup", { name, business_type });

  const res = Response.json({ ok: true });
  res.headers.append("Set-Cookie", sessionCookie(token));
  return res;
}
