import crypto from "node:crypto";
import { ensureSchema, query } from "@/lib/db";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function toCsvRow(fields: (string | number)[]): string {
  return fields
    .map((f) => {
      const s = String(f);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    })
    .join(",");
}

export async function GET(req: Request) {
  await ensureSchema();
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || !key || !safeEqual(key, adminKey)) {
    return new Response("Not found", { status: 404 });
  }

  const signups = await query<{ name: string; business_name: string; created_at: string }>(
    `select name, business_name, created_at from merchants where is_demo = false order by created_at`
  );
  const events = await query<{ merchant_id: number; actor: string; action: string; created_at: string }>(
    `select e.merchant_id, e.actor, e.action, e.created_at from events e
     join merchants m on m.id = e.merchant_id
     where m.is_demo = false order by e.created_at`
  );

  const lines = [
    "section,field1,field2,field3",
    ...signups.map((s) => toCsvRow(["signup", s.name, s.business_name, new Date(s.created_at).toISOString()])),
    ...events.map((e) =>
      toCsvRow(["event", e.actor, e.action, new Date(e.created_at).toISOString()])
    ),
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=munim-export.csv",
    },
  });
}
