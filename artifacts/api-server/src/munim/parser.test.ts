import assert from "node:assert/strict";
import test from "node:test";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ParseResult } from "./parser";

test("bookkeeping schema works with the Anthropic structured-output helper", () => {
  // Creating this format used to throw before the AI request was sent.
  const format = zodOutputFormat(ParseResult);
  assert.equal(format.type, "json_schema");
  const result = {
    entries: [{
      type: "credit_given",
      party_name: "Suresh",
      party_kind: "customer",
      amount_rupees: 500,
      due_date: null,
      items: null,
      confidence: "high",
    }],
    readback: "Suresh owes you ₹500.",
  };
  assert.deepEqual(format.parse(JSON.stringify(result)), result);
});

test("structured output still rejects invalid bookkeeping amounts and types", () => {
  const format = zodOutputFormat(ParseResult);
  for (const entry of [
    { type: "credit_given", amount_rupees: -500 },
    { type: "unknown", amount_rupees: 500 },
  ]) {
    assert.throws(() => format.parse(JSON.stringify({
      entries: [{
        party_name: "Suresh",
        party_kind: "customer",
        due_date: null,
        items: null,
        confidence: "high",
        ...entry,
      }],
      readback: "Invalid entry.",
    })));
  }
});
