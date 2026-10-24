export type LedgerEntry = { type: string; amount_paise: number };

/** Pure balance rule: customer = credit_given - payment_received; supplier = (supplier_due + purchase) - supplier_paid. */
export function calcBalance(entries: LedgerEntry[], kind: "customer" | "supplier"): number {
  if (kind === "customer") {
    return entries.reduce((sum, e) => {
      if (e.type === "credit_given") return sum + e.amount_paise;
      if (e.type === "payment_received") return sum - e.amount_paise;
      return sum;
    }, 0);
  }
  return entries.reduce((sum, e) => {
    if (e.type === "supplier_due" || e.type === "purchase") return sum + e.amount_paise;
    if (e.type === "supplier_paid") return sum - e.amount_paise;
    return sum;
  }, 0);
}
