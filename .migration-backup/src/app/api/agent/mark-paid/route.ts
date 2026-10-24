import { z } from "zod";
import { ensureSchema, query } from "@/lib/db";
import { checkAgentAuth } from "@/lib/agentAuth";
import { markReminderPaid } from "@/lib/payments";

const Body = z.object({
  reminder_id: z.number().int().positive(),
  payment_ref: z.string().min(1),
});

export async function POST(req: Request) {
  await ensureSchema();
  if (!checkAgentAuth(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const rows = await query<{ payment_ref: string | null }>(
    `select payment_ref from reminders where id = $1`,
    [parsed.data.reminder_id]
  );
  if (!rows[0]) return Response.json({ error: "Reminder not found" }, { status: 404 });
  if (rows[0].payment_ref !== parsed.data.payment_ref) {
    return Response.json({ error: "payment_ref does not match this reminder" }, { status: 400 });
  }

  const result = await markReminderPaid(parsed.data.reminder_id, parsed.data.payment_ref, "payment_link", "agent");
  return Response.json({ ok: true, already_paid: result.alreadyPaid });
}
