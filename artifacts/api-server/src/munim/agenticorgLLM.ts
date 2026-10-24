import { AgenticOrg } from "agenticorg-sdk";

let client: AgenticOrg | null = null;

function getClient(): AgenticOrg {
  if (!client) {
    client = new AgenticOrg({
      apiKey: process.env.AGENTICORG_API_KEY,
      baseUrl: process.env.AGENTICORG_BASE_URL || "https://agenticorg.hackathon.pinelabs.com",
    });
  }
  return client;
}

export function agenticorgConfigured(): boolean {
  return Boolean(process.env.AGENTICORG_API_KEY && process.env.AGENTICORG_AGENT_ID);
}

/**
 * Canned AI answers, for tests and keyless local dev only. A leftover AI_STUB=1 on a deploy that
 * has real AI configured used to answer every Tell with "Suresh owes you ₹500".
 */
export function aiStubbed(): boolean {
  return process.env.AI_STUB === "1" && !process.env.ANTHROPIC_API_KEY && !agenticorgConfigured();
}

/**
 * Runs a text (optionally + image) task through the tenant's configured LLM via the
 * AgenticOrg agent, bypassing their own HITL/confidence gating (that's their dashboard's
 * concern, not ours — we have our own merchant-approval gate downstream).
 * Returns either a parsed JSON object (if the model's output was valid JSON) or the raw text.
 */
export async function runAgenticorgTask(
  task: string,
  image?: { base64: string; mime: string }
): Promise<Record<string, unknown> | string> {
  const agentId = process.env.AGENTICORG_AGENT_ID!;
  const inputs: Record<string, unknown> = { task };
  if (image) {
    inputs.image_base64 = image.base64;
    inputs.image = `data:${image.mime};base64,${image.base64}`;
  }

  const result = await getClient().agents.run(agentId, { action: "process", inputs, context: {} });

  if (result.error) throw new Error(result.error);

  const output = result.output;
  if (output && typeof output === "object" && "raw_output" in output && typeof output.raw_output === "string") {
    return output.raw_output;
  }
  return output;
}
