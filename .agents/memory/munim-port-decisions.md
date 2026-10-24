---
name: Munim payment-safety rules
description: Rules any change to Munim payment recording or stub checkout must keep.
---

- Payment recording must stay a single transaction with a conditional `status <> 'paid'` transition; only the request that flips the status writes the ledger entry and event.
  **Why:** webhook, pay-page return check, stub checkout and manual mark-paid can fire concurrently; a completion review rejected the port for double-recording risk.
- Stub-only payment paths (stub checkout link) work only when PINELABS_MODE is stub; the webhook is disabled in stub mode.
  **Why:** stub references are predictable (`stub_<id>`), so trusting them lets anyone clear a debt without paying.
  **How to apply:** any new payment entry point must verify with Pine Labs outside stub mode and go through the shared mark-paid function.
