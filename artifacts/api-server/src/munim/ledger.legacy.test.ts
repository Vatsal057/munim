import { test } from "node:test";
import assert from "node:assert/strict";
import { calcBalance } from "./balance.ts";

test("customer balance: credit_given minus payment_received", () => {
  const balance = calcBalance(
    [
      { type: "credit_given", amount_paise: 34000 },
      { type: "payment_received", amount_paise: 10000 },
    ],
    "customer"
  );
  assert.equal(balance, 24000);
});

test("customer balance ignores supplier-only types", () => {
  const balance = calcBalance(
    [
      { type: "credit_given", amount_paise: 1000 },
      { type: "supplier_paid", amount_paise: 500 },
    ],
    "customer"
  );
  assert.equal(balance, 1000);
});

test("supplier balance: supplier_due + purchase minus supplier_paid", () => {
  const balance = calcBalance(
    [
      { type: "supplier_due", amount_paise: 800000 },
      { type: "purchase", amount_paise: 20000 },
      { type: "supplier_paid", amount_paise: 300000 },
    ],
    "supplier"
  );
  assert.equal(balance, 520000);
});

test("balance is zero with no entries", () => {
  assert.equal(calcBalance([], "customer"), 0);
});
