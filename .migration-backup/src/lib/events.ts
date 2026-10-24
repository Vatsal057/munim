import { query } from "./db";

export type Actor = "merchant" | "agent" | "system" | "customer";

export async function logEvent(
  merchantId: number | null,
  actor: Actor,
  action: string,
  payload: Record<string, unknown> = {}
) {
  await query(
    `insert into events (merchant_id, actor, action, payload) values ($1, $2, $3, $4)`,
    [merchantId, actor, action, JSON.stringify(payload)]
  );
}
