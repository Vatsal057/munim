import { cookies } from "./requestContext";
import crypto from "node:crypto";
import { query } from "./db";

export const SESSION_COOKIE = "munim_session";

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function sessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}`;
}

export function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  return `${salt}:${crypto.scryptSync(pin, salt, 32).toString("hex")}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const a = crypto.scryptSync(pin, salt, 32);
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export type Merchant = {
  id: number;
  name: string;
  phone: string;
  business_name: string;
  business_type: string;
  language: string;
  is_demo: boolean;
  session_token: string | null;
  created_at: string;
};

export async function getMerchant(): Promise<Merchant | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await query<Merchant>(
    `select * from merchants where session_token = $1`,
    [token]
  );
  return rows[0] ?? null;
}
