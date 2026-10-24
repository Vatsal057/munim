// Pure helpers for letting the AgenticOrg agent decide who to remind.
// The agent only chooses customers and explains why; amounts always come from our ledger.

export type Candidate = {
  customerId: number;
  name: string;
  amountPaise: number;
  likelihood: number;
  ageDays: number;
  reason: string;
};

export type AgentPick = Candidate & { agentReason: string };

export const MAX_PICKS = 5;

function rupees(paise: number): number {
  return Math.round(paise / 100);
}

export function buildDecisionTask(
  candidates: Candidate[],
  ctx: { businessName: string; owedOutPaise: number; horizon: string }
): string {
  const rows = candidates.map((c) => ({
    customer_id: c.customerId,
    name: c.name,
    owes_rupees: rupees(c.amountPaise),
    days_since_due: Math.max(0, Math.round(c.ageDays)),
    chance_pays_by_supplier_date_pct: Math.round(c.likelihood * 100),
  }));
  return `You are the collections clerk for "${ctx.businessName}", a small Indian shop. The shop owes suppliers ₹${rupees(ctx.owedOutPaise)} by ${ctx.horizon}. Decide which customers to send a polite payment reminder to today, so the shop can pay its suppliers without borrowing.

Think like a careful munim: chase the dues that are big, old, and unlikely to arrive on their own; leave alone people who will pay anyway or owe tiny amounts; never pick more than ${MAX_PICKS}. The shop owner will review and approve every reminder before anything is sent.

Customers with open dues (JSON): ${JSON.stringify(rows)}

Output ONLY valid JSON (no markdown fences, no preamble) in exactly this shape:
{"picks":[{"customer_id":number,"reason":string}],"summary":string}
- customer_id must be one of the ids above.
- reason: one short plain sentence for the shop owner explaining why this customer, today.
- summary: one short sentence on your overall plan.`;
}

/**
 * Validates the agent's decision against the candidates we sent. Hallucinated ids are dropped,
 * duplicates removed, capped at MAX_PICKS. Returns null when nothing usable came back, so the
 * caller falls back to the built-in ranking.
 */
export function applyAgentDecision(
  candidates: Candidate[],
  decision: unknown
): { picks: AgentPick[]; summary: string } | null {
  if (!decision || typeof decision !== "object") return null;
  const { picks, summary } = decision as { picks?: unknown; summary?: unknown };
  if (!Array.isArray(picks)) return null;

  const byId = new Map(candidates.map((c) => [c.customerId, c]));
  const chosen: AgentPick[] = [];
  for (const p of picks) {
    if (chosen.length >= MAX_PICKS) break;
    if (!p || typeof p !== "object") continue;
    const id = Number((p as { customer_id?: unknown }).customer_id);
    const candidate = byId.get(id);
    if (!candidate || chosen.some((c) => c.customerId === id)) continue;
    const raw = (p as { reason?: unknown }).reason;
    const agentReason = typeof raw === "string" && raw.trim() ? raw.trim().slice(0, 240) : candidate.reason;
    chosen.push({ ...candidate, agentReason });
  }
  if (chosen.length === 0) return null;
  return { picks: chosen, summary: typeof summary === "string" ? summary.trim().slice(0, 300) : "" };
}
