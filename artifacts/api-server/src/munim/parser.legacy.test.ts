process.env.AI_STUB = "1";

import { test } from "node:test";
import assert from "node:assert/strict";
import { parse, ParseResult } from "./parser.ts";
import { rupeesToPaise } from "./money.ts";

test("AI_STUB fixture parses, validates against zod schema", async () => {
  const result = await parse(
    { text: "Ramesh owes 340 for rice", kind: "khata" },
    { language: "en", businessType: "kirana", knownNames: [] }
  );
  const parsed = ParseResult.parse(result);
  assert.ok(parsed.entries.length > 0);
  assert.equal(parsed.entries[0].party_name, "Ramesh");
});

test("amounts convert from rupees to paise correctly", async () => {
  const result = await parse(
    { text: "rice bill", kind: "khata" },
    { language: "en", businessType: "kirana", knownNames: [] }
  );
  const entry = result.entries[0];
  assert.equal(rupeesToPaise(entry.amount_rupees), 34000);
});

test("party_name fuzzy-matches known names case-insensitively", async () => {
  const result = await parse(
    { text: "ramesh owes 340", kind: "khata" },
    { language: "en", businessType: "kirana", knownNames: ["Ramesh Kumar", "ramesh"] }
  );
  assert.equal(result.entries[0].party_name, "ramesh");
});

test("unknown party_name is kept as written, trimmed", async () => {
  const result = await parse(
    { text: "upi payment", kind: "upi" },
    { language: "en", businessType: "kirana", knownNames: ["Suresh"] }
  );
  assert.equal(result.entries[0].party_name, "Meena");
});
