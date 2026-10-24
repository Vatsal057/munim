import { test } from "node:test";
import assert from "node:assert/strict";
import { applyAgentDecision, buildDecisionTask, type Candidate } from "../src/lib/agentDecision.ts";

const candidates: Candidate[] = [
  { customerId: 1, name: "Ramesh", amountPaise: 34000, likelihood: 0.3, ageDays: 20, reason: "code reason 1" },
  { customerId: 2, name: "Suresh", amountPaise: 120000, likelihood: 0.8, ageDays: 3, reason: "code reason 2" },
];

test("keeps valid picks, drops hallucinated ids and duplicates, amounts from ledger", () => {
  const result = applyAgentDecision(candidates, {
    picks: [
      { customer_id: 99, reason: "made up" },
      { customer_id: "1", reason: "Old and unlikely to pay." },
      { customer_id: 1, reason: "dup" },
    ],
    summary: "Chase Ramesh.",
  });
  assert.ok(result);
  assert.equal(result.picks.length, 1);
  assert.equal(result.picks[0].customerId, 1);
  assert.equal(result.picks[0].amountPaise, 34000);
  assert.equal(result.picks[0].agentReason, "Old and unlikely to pay.");
  assert.equal(result.summary, "Chase Ramesh.");
});

test("missing reason falls back to code reason", () => {
  const result = applyAgentDecision(candidates, { picks: [{ customer_id: 2 }] });
  assert.equal(result?.picks[0].agentReason, "code reason 2");
});

test("unusable output returns null so caller falls back", () => {
  assert.equal(applyAgentDecision(candidates, "nope"), null);
  assert.equal(applyAgentDecision(candidates, { picks: [] }), null);
  assert.equal(applyAgentDecision(candidates, { picks: [{ customer_id: 42 }] }), null);
  assert.equal(applyAgentDecision(candidates, null), null);
});

test("caps at 5 picks", () => {
  const many: Candidate[] = Array.from({ length: 8 }, (_, i) => ({ ...candidates[0], customerId: i + 1 }));
  const result = applyAgentDecision(many, { picks: many.map((c) => ({ customer_id: c.customerId, reason: "x" })) });
  assert.equal(result?.picks.length, 5);
});

test("task lists candidate ids and rupee amounts, not paise", () => {
  const task = buildDecisionTask(candidates, { businessName: "Shop", owedOutPaise: 800000, horizon: "2026-10-24" });
  assert.match(task, /"customer_id":1/);
  assert.match(task, /"owes_rupees":340/);
  assert.match(task, /₹8000/);
});
