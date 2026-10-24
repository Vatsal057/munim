import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod/v4";
import fs from "node:fs";
import path from "node:path";
import { agenticorgConfigured, aiStubbed, runAgenticorgTask } from "./agenticorgLLM.ts";

const ENTRY_TYPES = [
  "credit_given",
  "payment_received",
  "purchase",
  "supplier_due",
  "supplier_paid",
  "order",
  "skip",
  "sale",
  "wastage",
] as const;

export const Entry = z.object({
  type: z.enum(ENTRY_TYPES),
  party_name: z.string().min(1),
  party_kind: z.enum(["customer", "supplier"]),
  amount_rupees: z.number().nonnegative(),
  due_date: z.string().nullable(),
  items: z.string().nullable(),
  confidence: z.enum(["high", "medium", "low"]),
});

export const ParseResult = z.object({
  entries: z.array(Entry),
  readback: z.string(),
});

export type ParsedEntry = z.infer<typeof Entry>;
export type ParseResultT = z.infer<typeof ParseResult>;

export type ParseKind = "auto" | "khata" | "bill" | "upi" | "chat";

export type ParseInput = {
  text?: string;
  imageBase64?: string;
  imageMime?: string;
  kind: ParseKind;
};

export type ParseContext = {
  language: string;
  businessType: string;
  knownNames: string[];
};

const client = new Anthropic();

const SYSTEM_PROMPT = `You are munim, a bookkeeping assistant for small Indian shops (kirana stores, tiffin services, tailors, cart vendors, side hustles). You read what a shopkeeper tells you — typed text, a photo of a handwritten khata (ledger) page, a printed supplier bill, or a UPI payment screenshot — and turn it into structured entries.

Context: amounts are in rupees (₹). Shopkeepers mix English, Kannada, and Hindi, and use words like "udhaar" (credit/due) and "baaki" (balance/remaining). A name followed by an amount with no other context usually means credit given to that person.

Entry types:
- credit_given: a customer bought on credit, now owes the shop
- payment_received: a customer paid money to the shop
- purchase: the shop bought something on credit from a supplier
- supplier_due: the shop owes a supplier (e.g. from a bill)
- supplier_paid: the shop paid a supplier
- order: a customer placed an order (not yet fulfilled/paid)
- skip: a recurring customer skipped today (e.g. tiffin)
- sale: a cash sale, no credit involved
- wastage: goods lost/wasted, not a money transaction with a person

Rules:
- NEVER compute totals, sums, or balances. Copy each amount exactly as written or said.
- If a khata page lists several names and amounts, create one entry per line.
- Only use names you can actually read in the image or text. "Known names" are only for matching spelling; never pick a known name that is not written there.
- A line with a minus sign, "paid", "jama" or "mila" next to it is a payment_received, not credit.
- Resolve relative dates ("Friday", "next week", "tomorrow") to an ISO date (YYYY-MM-DD), using the current date in Asia/Kolkata. If no date is mentioned, use null.
- If you are not confident about an amount, name, or type, set confidence to "low". Set confidence to "high" only when the text/image is unambiguous.
- party_kind is "supplier" for purchase/supplier_due/supplier_paid entries, "customer" otherwise, unless context clearly says otherwise.
- readback is one short plain sentence summarizing what you understood, in the shopkeeper's language, suitable for reading aloud.
- Output nothing except the structured result.`;

const JSON_SHAPE_INSTRUCTIONS = `Output ONLY valid JSON (no markdown fences, no preamble, no explanation) matching exactly this shape:
{"entries":[{"type":"credit_given"|"payment_received"|"purchase"|"supplier_due"|"supplier_paid"|"order"|"skip"|"sale"|"wastage","party_name":string,"party_kind":"customer"|"supplier","amount_rupees":number,"due_date":string|null,"items":string|null,"confidence":"high"|"medium"|"low"}],"readback":string}
due_date, if present, must be an ISO date YYYY-MM-DD, resolved against today's date: ${new Date().toISOString().slice(0, 10)} (Asia/Kolkata). Never a weekday name or relative phrase.`;

function extractJson(raw: Record<string, unknown> | string): unknown {
  if (typeof raw !== "string") return raw;
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const text = fenced ? fenced[1] : raw;
  return JSON.parse(text.trim());
}

function loadFixture(kind: ParseKind): ParseResultT {
  const fixturePath = path.join(process.cwd(), "src/munim/seed/parser-fixtures.json");
  const fixtures = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  const fixture = fixtures[kind] ?? fixtures.auto;
  return ParseResult.parse(fixture);
}

/** Fuzzy-matches party_name against knownNames (case-insensitive, trimmed) in code, not the LLM. */
function matchKnownName(name: string, knownNames: string[]): string {
  const normalized = name.trim().toLowerCase();
  const match = knownNames.find((known) => known.trim().toLowerCase() === normalized);
  return match ?? name.trim();
}

function buildTask(input: ParseInput, ctx: ParseContext): string {
  return [
    SYSTEM_PROMPT,
    JSON_SHAPE_INSTRUCTIONS,
    `Shop business type: ${ctx.businessType}. Preferred language: ${ctx.language}.`,
    ctx.knownNames.length ? `Known names: ${ctx.knownNames.join(", ")}.` : "",
    `Input kind: ${input.kind}.`,
    input.text ? `Shopkeeper said: "${input.text}"` : "Read the attached image.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** Gemini reads the photo (khata page, bill, UPI slip). REST, no SDK: one call, JSON out. */
async function runGemini(task: string, imageBase64: string, mime: string): Promise<string> {
  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ inline_data: { mime_type: mime, data: imageBase64 } }, { text: task }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0 },
    }),
  });
  const body = (await res.json().catch(() => ({}))) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    error?: { message?: string };
  };
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${body.error?.message ?? "request failed"}`);
  const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) throw new Error("Gemini returned no text");
  return text;
}

export class VisionUnavailableError extends Error {
  constructor() {
    super("Photo reading isn't switched on yet. Type or speak the entries instead.");
  }
}

export async function parse(input: ParseInput, ctx: ParseContext): Promise<ParseResultT> {
  if (aiStubbed()) {
    const fixture = loadFixture(input.kind);
    return {
      ...fixture,
      entries: fixture.entries.map((e) => ({
        ...e,
        party_name: matchKnownName(e.party_name, ctx.knownNames),
      })),
    };
  }

  // AgenticOrg's agent run is text-only: an image arrives as base64 text and the model invents
  // names from the known-names list. Photos go to a vision model; without one, ask for text.
  if (input.imageBase64 && !process.env.ANTHROPIC_API_KEY) {
    if (!process.env.GEMINI_API_KEY) throw new VisionUnavailableError();
    const parsed = ParseResult.parse(extractJson(await runGemini(buildTask(input, ctx), input.imageBase64, input.imageMime!)));
    return {
      ...parsed,
      entries: parsed.entries.map((e) => ({ ...e, party_name: matchKnownName(e.party_name, ctx.knownNames) })),
    };
  }

  if (!process.env.ANTHROPIC_API_KEY && agenticorgConfigured()) {
    const task = buildTask(input, ctx);

    const image =
      input.imageBase64 && input.imageMime ? { base64: input.imageBase64, mime: input.imageMime } : undefined;

    const raw = await runAgenticorgTask(task, image);
    const parsed = ParseResult.parse(extractJson(raw));
    return {
      ...parsed,
      entries: parsed.entries.map((e) => ({ ...e, party_name: matchKnownName(e.party_name, ctx.knownNames) })),
    };
  }

  const content: Anthropic.Messages.ContentBlockParam[] = [];
  if (input.imageBase64 && input.imageMime) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: input.imageMime as "image/png" | "image/jpeg", data: input.imageBase64 },
    });
  }
  content.push({
    type: "text",
    text: [
      `Shop business type: ${ctx.businessType}. Preferred language: ${ctx.language}.`,
      ctx.knownNames.length ? `Known names: ${ctx.knownNames.join(", ")}.` : "",
      `Input kind: ${input.kind}.`,
      input.text ? `Shopkeeper said: "${input.text}"` : "Read the attached image.",
    ]
      .filter(Boolean)
      .join("\n"),
  });

  const response = await client.messages.parse({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
    output_config: { format: zodOutputFormat(ParseResult) },
  });

  if (!response.parsed_output) {
    throw new Error("Couldn't read that. Try again or type it.");
  }

  return {
    ...response.parsed_output,
    entries: response.parsed_output.entries.map((e) => ({
      ...e,
      party_name: matchKnownName(e.party_name, ctx.knownNames),
    })),
  };
}
