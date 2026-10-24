import { cookies } from "next/headers";
import crypto from "node:crypto";
import { query } from "./db";

export const SESSION_COOKIE = "munim_session";

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
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
