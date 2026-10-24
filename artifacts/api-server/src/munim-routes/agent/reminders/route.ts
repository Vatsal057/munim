import { z } from "zod";
import { ensureSchema, query } from "@/lib/db";
import { checkAgentAuth } from "@/lib/agentAuth";
import { calcBalance } from "@/lib/balance";
import { logEvent } from "@/lib/events";

const Body = z.object({
  merchant_id: z.number().int().positive(),
  customer_id: z.number().int().positive(),
  amount_paise: z.number().int().positive(),
  reason: z.string().min(1),
  message: z.string().min(1),
});

export async function POST(req: Request) {
  await ensureSchema();
  if (!checkAgentAuth(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  const { merchant_id, customer_id, amount_paise, reason, message } = parsed.data;

  const customer = await query<{ id: number }>(
    `select id from customers where id = $1 and merchant_id = $2 and kind = 'customer'`,
    [customer_id, merchant_id]
  );
  if (!customer[0]) return Response.json({ error: "Customer not found" }, { status: 404 });

  const entries = await query<{ type: string; amount_paise: number }>(
    `select type, amount_paise from entries where customer_id = $1 and merchant_id = $2`,
    [customer_id, merchant_id]
  );
  const balance = calcBalance(
    entries.map((e) => ({ type: e.type, amount_paise: Number(e.amount_paise) })),
    "customer"
  );
  if (amount_paise > balance) {
    return Response.json({ error: "Amount exceeds customer's balance" }, { status: 400 });
  }

  const rows = await query<{ id: number }>(
    `insert into reminders (merchant_id, customer_id, amount_paise, reason, message, created_by)
     values ($1, $2, $3, $4, $5, 'agent') returning id`,
    [merchant_id, customer_id, amount_paise, reason, message]
  );
  const reminderId = rows[0].id;
  await logEvent(merchant_id, "agent", "reminder_drafted", {
    reminder_id: reminderId,
    customer_id,
    amount_paise,
    reason,
  });

  return Response.json({ ok: true, reminder_id: reminderId });
}
