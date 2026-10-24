import { test } from "node:test";
import assert from "node:assert/strict";
import { likelihoodToPayBy, expectedCashIn, cashGap, forecastHorizon } from "./forecast.ts";

const BY_DATE = new Date("2026-10-30");

test("new customer with no history starts at 0.5 (Beta(1,1) prior)", () => {
  assert.equal(likelihoodToPayBy([], BY_DATE), 0.5);
});

test("always-on-time customer scores high", () => {
  const history = Array.from({ length: 5 }, (_, i) => ({
    dueDate: `2026-10-0${i + 1}`,
    createdAt: `2026-09-2${i + 1}`,
    paidAt: `2026-10-0${i + 1}`,
  }));
  const likelihood = likelihoodToPayBy(history, BY_DATE);
  assert.ok(likelihood > 0.7, `expected > 0.7, got ${likelihood}`);
});

test("always-late customer scores low", () => {
  const history = Array.from({ length: 5 }, (_, i) => ({
    dueDate: `2026-10-0${i + 1}`,
    createdAt: `2026-09-2${i + 1}`,
    paidAt: `2026-10-1${i + 1}`, // paid 10 days after due, well past the 3-day grace
  }));
  const likelihood = likelihoodToPayBy(history, BY_DATE);
  assert.ok(likelihood < 0.3, `expected < 0.3, got ${likelihood}`);
});

test("stale open due (>30 days old) halves the likelihood", () => {
  const fresh = likelihoodToPayBy([{ dueDate: "2026-10-25", createdAt: "2026-10-18", paidAt: null }], BY_DATE);
  const stale = likelihoodToPayBy([{ dueDate: "2026-09-10", createdAt: "2026-09-03", paidAt: null }], BY_DATE);
  assert.ok(stale < fresh, `expected stale (${stale}) < fresh (${fresh})`);
  assert.ok(Math.abs(stale - fresh / 2) < 0.01, `expected stale to be ~half of fresh`);
});

test("cashGap computes owed out, expected in, and the gap", () => {
  const expectedIn = expectedCashIn(
    [{ customerId: 1, name: "Ramesh", amountPaise: 100000, oldestDueDate: null }],
    { 1: [] }, // new customer: likelihood 0.5
    BY_DATE
  );
  assert.equal(expectedIn.totalPaise, 50000);

  const gap = cashGap([{ amountPaise: 800000, dueDate: "2026-11-01" }], expectedIn);
  assert.equal(gap.owedOutPaise, 800000);
  assert.equal(gap.expectedInPaise, 50000);
  assert.equal(gap.gapPaise, 750000);
});

test("empty state: no supplier dues, no open dues", () => {
  const expectedIn = expectedCashIn([], {}, BY_DATE);
  assert.equal(expectedIn.totalPaise, 0);
  const gap = cashGap([], expectedIn);
  assert.equal(gap.gapPaise, 0);

  const horizon = forecastHorizon([], BY_DATE);
  assert.equal(horizon.getTime(), BY_DATE.getTime() + 7 * 24 * 60 * 60 * 1000);
});

test("forecastHorizon picks the earliest supplier due within 7 days", () => {
  const horizon = forecastHorizon(
    [{ dueDate: "2026-11-05" }, { dueDate: "2026-11-02" }, { dueDate: "2026-12-01" }],
    BY_DATE
  );
  assert.equal(horizon.toISOString().slice(0, 10), "2026-11-02");
});
