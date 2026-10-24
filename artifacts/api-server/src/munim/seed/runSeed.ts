import fs from "node:fs";
import path from "node:path";
import { query, ensureSchema } from "../db.ts";
import { demoSessionToken } from "./demoToken.ts";

type SeedEntry = {
  customer: string;
  type: string;
  amount_rupees: number;
  created_offset_days: number;
  due_offset_days?: number;
  due_next_weekday?: number; // 0=Sunday..6=Saturday, next occurrence on/after today
  paid_offset_days?: number;
  note?: string;
};

type SeedPersona = {
  slug: string;
  name: string;
  phone: string;
  business_name: string;
  business_type: string;
  language: string;
  customers: { name: string; kind: "customer" | "supplier" }[];
  entries: SeedEntry[];
};

function offsetDate(days: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

function nextWeekday(targetDow: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  const diff = (targetDow - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + (diff === 0 ? 7 : diff));
  return d;
}

async function seedPersona(persona: SeedPersona): Promise<number> {
  const sessionToken = demoSessionToken(persona.slug);

  await query(`delete from merchants where session_token = $1`, [sessionToken]);

  const merchantRows = await query<{ id: number }>(
    `insert into merchants (name, phone, business_name, business_type, language, is_demo, session_token)
     values ($1, $2, $3, $4, $5, true, $6) returning id`,
    [persona.name, persona.phone, persona.business_name, persona.business_type, persona.language, sessionToken]
  );
  const merchantId = merchantRows[0].id;

  const customerIds = new Map<string, number>();
  for (const c of persona.customers) {
    const rows = await query<{ id: number }>(
      `insert into customers (merchant_id, kind, name) values ($1, $2, $3) returning id`,
      [merchantId, c.kind, c.name]
    );
    customerIds.set(c.name, rows[0].id);
  }

  for (const e of persona.entries) {
    const customerId = customerIds.get(e.customer);
    if (!customerId) throw new Error(`Unknown customer "${e.customer}" in persona ${persona.slug}`);

    const createdAt = offsetDate(e.created_offset_days);
    const dueDate =
      e.due_next_weekday !== undefined
        ? nextWeekday(e.due_next_weekday)
        : e.due_offset_days !== undefined
        ? offsetDate(e.due_offset_days)
        : null;

    await query(
      `insert into entries (merchant_id, customer_id, type, amount_paise, due_date, note, source, created_at)
       values ($1, $2, $3, $4, $5, $6, 'manual', $7)`,
      [merchantId, customerId, e.type, Math.round(e.amount_rupees * 100), dueDate, e.note ?? null, createdAt]
    );

    if (e.paid_offset_days !== undefined) {
      const paidAt = offsetDate(e.paid_offset_days);
      await query(
        `insert into entries (merchant_id, customer_id, type, amount_paise, source, created_at)
         values ($1, $2, 'payment_received', $3, 'manual', $4)`,
        [merchantId, customerId, Math.round(e.amount_rupees * 100), paidAt]
      );
    }
  }

  return merchantId;
}

export async function seedAllPersonas(): Promise<{ slug: string; merchantId: number }[]> {
  await ensureSchema();
  const dir = path.join(process.cwd(), "src/munim/seed/personas");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const results: { slug: string; merchantId: number }[] = [];
  for (const file of files) {
    const persona: SeedPersona = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    const merchantId = await seedPersona(persona);
    results.push({ slug: persona.slug, merchantId });
  }
  return results;
}
