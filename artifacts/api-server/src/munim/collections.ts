import Anthropic from "@anthropic-ai/sdk";
import { query } from "./db";
import { getCustomerBalances, getSupplierDues } from "./ledger";
import { buildHistories, likelihoodToPayBy, forecastHorizon, type RawEntry } from "./forecast";
import { formatINR } from "./money";
import { logEvent } from "./events";
import { agenticorgConfigured, aiStubbed, runAgenticorgTask } from "./agenticorgLLM";
import { applyAgentDecision, buildDecisionTask } from "./agentDecision";

export type Pick = {
  customerId: number;
  name: string;
  amountPaise: number;
  likelihood: number;
  reason: string;
};

function ageWeight(oldestDueDate: string | Date | null, today: Date): number {
  if (!oldestDueDate) return 1;
  const due = oldestDueDate instanceof Date ? oldestDueDate : new Date(oldestDueDate);
  const ageDays = (today.getTime() - due.getTime()) / (24 * 60 * 60 * 1000);
  return 1 + Math.max(0, ageDays) / 30; // older dues weigh more
}

function buildReason(balancePaise: number, ageDays: number, likelihood: number): string {
  const amount = formatINR(balancePaise);
  const age = ageDays < 1 ? "today" : ageDays < 7 ? `${Math.round(ageDays)} days` : `${Math.round(ageDays / 7)} weeks`;
  const habit = likelihood >= 0.7 ? "usually pays on time" : likelihood >= 0.4 ? "pays sometimes late" : "usually pays late";
  return `Owes ${amount} for ${age}; ${habit}.`;
}

/** All open dues, ranked by amount × (1 - likelihood) × ageWeight, plus what the merchant owes suppliers and by when. */
async function rankCandidates(merchantId: number) {
  const [balances, supplierDues, rawEntries] = await Promise.all([
    getCustomerBalances(merchantId),
    getSupplierDues(merchantId),
    query<RawEntry>(
      `select customer_id, type, due_date, created_at from entries
       where merchant_id = $1 and type in ('credit_given', 'payment_received')`,
      [merchantId]
    ),
  ]);

  const today = new Date();
  const horizon = forecastHorizon(
    supplierDues.map((r) => ({ dueDate: r.oldest_due_date })),
    today
  );
  const histories = buildHistories(rawEntries);
  const owedOutPaise = supplierDues.reduce((sum, r) => sum + Number(r.balance_paise), 0);

  const ranked = balances
    .map((b) => {
      const likelihood = likelihoodToPayBy(histories[b.customer_id] ?? [], horizon);
      const ageDays = b.oldest_due_date
        ? (today.getTime() - new Date(b.oldest_due_date).getTime()) / (24 * 60 * 60 * 1000)
        : 0;
      const score = Number(b.balance_paise) * (1 - likelihood) * ageWeight(b.oldest_due_date, today);
      return {
        customerId: b.customer_id,
        name: b.name,
        amountPaise: Number(b.balance_paise),
        likelihood,
        ageDays,
        score,
        reason: buildReason(Number(b.balance_paise), ageDays, likelihood),
      };
    })
    .sort((a, b) => b.score - a.score);

  return { ranked, owedOutPaise, horizon };
}

/** Built-in heuristic: takes ranked customers until expected recovery covers the supplier gap, max 5. */
export async function pickCustomers(merchantId: number): Promise<Pick[]> {
  const { ranked, owedOutPaise } = await rankCandidates(merchantId);
  return heuristicPicks(ranked, owedOutPaise);
}

function heuristicPicks(ranked: Pick[], owedOutPaise: number): Pick[] {
  const picks: Pick[] = [];
  let recoveredPaise = 0;
  for (const candidate of ranked) {
    if (picks.length >= 5) break;
    if (recoveredPaise >= owedOutPaise && owedOutPaise > 0) break;
    picks.push(candidate);
    recoveredPaise += Math.round(candidate.amountPaise * candidate.likelihood);
  }
  return picks;
}

const client = new Anthropic();

/** Polite, warm reminder text in the merchant's language. Falls back to a template if the LLM is unavailable. */
export async function draftMessage(
  merchant: { business_name: string; language: string },
  customer: { name: string },
  amountPaise: number,
  reason: string
): Promise<string> {
  const amount = formatINR(amountPaise);
  const fallback = `Hi ${customer.name}, this is ${merchant.business_name}. A gentle reminder that ${amount} is due. Pay here: {PAY_LINK}. Thank you!`;

  if (aiStubbed()) return fallback;

  if (!process.env.ANTHROPIC_API_KEY && agenticorgConfigured()) {
    try {
      const task = `You write short, polite, warm payment reminder texts for small Indian shopkeepers to send their customers over WhatsApp. Never shame or threaten. Include the shop name and the amount. Always include the literal placeholder {PAY_LINK} exactly once, where the payment link should go. Keep it under 300 characters. Output only the message text, in the requested language, no quotes or preamble.

Shop: ${merchant.business_name}. Customer: ${customer.name}. Amount due: ${amount}. Why: ${reason}. Language: ${merchant.language}.`;
      const raw = await runAgenticorgTask(task);
      const text = typeof raw === "string" ? raw.trim() : JSON.stringify(raw);
      return text.includes("{PAY_LINK}") ? text : fallback;
    } catch {
      return fallback;
    }
  }

  try {
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
      max_tokens: 300,
      system:
        "You write short, polite, warm payment reminder texts for small Indian shopkeepers to send their customers over WhatsApp. Never shame or threaten. Include the shop name and the amount. Always include the literal placeholder {PAY_LINK} exactly once, where the payment link should go. Keep it under 300 characters. Output only the message text, in the requested language, no quotes or preamble.",
      messages: [
        {
          role: "user",
          content: `Shop: ${merchant.business_name}. Customer: ${customer.name}. Amount due: ${amount}. Why: ${reason}. Language: ${merchant.language}.`,
        },
      ],
    });
    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
    const text = textBlock?.text.trim();
    return text && text.includes("{PAY_LINK}") ? text : fallback;
  } catch {
    return fallback;
  }
}

export async function createDrafts(
  merchantId: number,
  createdBy: "agent" | "builtin"
): Promise<number[]> {
  const merchantRows = await query<{ business_name: string; language: string }>(
    `select business_name, language from merchants where id = $1`,
    [merchantId]
  );
  const merchant = merchantRows[0];
  if (!merchant) return [];

  const { picks, decidedBy } = await choosePicks(merchantId, merchant.business_name);
  const createdIds: number[] = [];

  for (const pick of picks) {
    const message = await draftMessage(merchant, { name: pick.name }, pick.amountPaise, pick.reason);
    const rows = await query<{ id: number }>(
      `insert into reminders (merchant_id, customer_id, amount_paise, reason, message, created_by)
       values ($1, $2, $3, $4, $5, $6) returning id`,
      [merchantId, pick.customerId, pick.amountPaise, pick.reason, message, createdBy]
    );
    const reminderId = rows[0].id;
    createdIds.push(reminderId);
    await logEvent(merchantId, createdBy === "agent" || decidedBy === "agenticorg" ? "agent" : "system", "reminder_drafted", {
      reminder_id: reminderId,
      customer_id: pick.customerId,
      amount_paise: pick.amountPaise,
      reason: pick.reason,
      decided_by: decidedBy,
    });
  }

  return createdIds;
}

/**
 * The AgenticOrg agent decides who to remind and why, from our real ledger data.
 * Amounts stay ledger-computed; anything unusable falls back to the built-in ranking.
 */
async function choosePicks(
  merchantId: number,
  businessName: string
): Promise<{ picks: Pick[]; decidedBy: "agenticorg" | "builtin" }> {
  const { ranked, owedOutPaise, horizon } = await rankCandidates(merchantId);
  const builtin = () => ({ picks: heuristicPicks(ranked, owedOutPaise), decidedBy: "builtin" as const });

  if (ranked.length === 0 || aiStubbed() || !agenticorgConfigured()) return builtin();

  try {
    const candidates = ranked.slice(0, 15); // ponytail: top 15 keeps the prompt small; raise if merchants have long tails
    const task = buildDecisionTask(candidates, {
      businessName,
      owedOutPaise,
      horizon: horizon.toISOString().slice(0, 10),
    });
    const decision = applyAgentDecision(candidates, extractJson(await runAgenticorgTask(task)));
    if (!decision) throw new Error("agent returned no usable picks");

    await logEvent(merchantId, "agent", "agent_decided", {
      agent_id: process.env.AGENTICORG_AGENT_ID,
      summary: decision.summary,
      considered: candidates.length,
      picks: decision.picks.map((p) => ({ customer_id: p.customerId, name: p.name, reason: p.agentReason })),
    });
    return {
      picks: decision.picks.map((p) => ({ ...p, reason: `🤖 ${p.agentReason}` })),
      decidedBy: "agenticorg",
    };
  } catch (err) {
    await logEvent(merchantId, "system", "agent_fallback", { error: String(err).slice(0, 300) });
    return builtin();
  }
}

function extractJson(raw: Record<string, unknown> | string): unknown {
  if (typeof raw !== "string") return raw;
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  try {
    return JSON.parse((fenced ? fenced[1] : raw).trim());
  } catch {
    return null;
  }
}
