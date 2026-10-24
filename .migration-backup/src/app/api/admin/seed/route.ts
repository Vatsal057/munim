import crypto from "node:crypto";
import { seedAllPersonas } from "@/lib/seed/runSeed.ts";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || !key || !safeEqual(key, adminKey)) {
    return new Response("Not found", { status: 404 });
  }

  const results = await seedAllPersonas();
  return Response.json({ ok: true, seeded: results });
}
