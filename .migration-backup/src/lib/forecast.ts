export type PastCredit = {
  dueDate: string | null; // ISO date; null means use 7 days from createdAt
  createdAt: string; // ISO date
  paidAt: string | null; // ISO date; null if not yet paid
};

export type OpenDue = {
  customerId: number;
  name: string;
  amountPaise: number;
  oldestDueDate: string | null; // ISO date
};

const DAY_MS = 24 * 60 * 60 * 1000;
const ON_TIME_GRACE_DAYS = 3;
const STALE_DUE_DAYS = 30;

function daysBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / DAY_MS;
}

function effectiveDueDate(credit: PastCredit): Date {
  if (credit.dueDate) return new Date(credit.dueDate);
  return new Date(new Date(credit.createdAt).getTime() + 7 * DAY_MS);
}

/** Beta(1,1) prior: a new customer starts at 0.5. "On time" = paid within 3 days of due date. */
export function likelihoodToPayBy(customerHistory: PastCredit[], byDate: Date): number {
  const resolved = customerHistory.filter((c) => c.paidAt !== null);
  const onTime = resolved.filter((c) => {
    const due = effectiveDueDate(c);
    const paid = new Date(c.paidAt as string);
    return daysBetween(due, paid) <= ON_TIME_GRACE_DAYS;
  }).length;

  let likelihood = (onTime + 1) / (resolved.length + 2);

  const openDues = customerHistory.filter((c) => c.paidAt === null);
  const oldestOpenDue = openDues.reduce<Date | null>((oldest, c) => {
    const due = effectiveDueDate(c);
    return oldest === null || due < oldest ? due : oldest;
  }, null);
  if (oldestOpenDue && daysBetween(oldestOpenDue, byDate) > STALE_DUE_DAYS) {
    likelihood *= 0.5;
  }

  return likelihood;
}

export function expectedCashIn(
  openDues: OpenDue[],
  histories: Record<number, PastCredit[]>,
  byDate: Date
): { totalPaise: number; perCustomer: { customerId: number; name: string; likelihood: number; expectedPaise: number }[] } {
  const perCustomer = openDues.map((due) => {
    const likelihood = likelihoodToPayBy(histories[due.customerId] ?? [], byDate);
    return {
      customerId: due.customerId,
      name: due.name,
      likelihood,
      expectedPaise: Math.round(due.amountPaise * likelihood),
    };
  });
  const totalPaise = perCustomer.reduce((sum, c) => sum + c.expectedPaise, 0);
  return { totalPaise, perCustomer };
}

export function cashGap(
  supplierDuesByDate: { amountPaise: number; dueDate: string }[],
  expectedIn: { totalPaise: number }
): { owedOutPaise: number; expectedInPaise: number; gapPaise: number } {
  const owedOutPaise = supplierDuesByDate.reduce((sum, d) => sum + d.amountPaise, 0);
  const expectedInPaise = expectedIn.totalPaise;
  return { owedOutPaise, expectedInPaise, gapPaise: owedOutPaise - expectedInPaise };
}

export type RawEntry = {
  customer_id: number;
  type: string;
  due_date: string | null;
  created_at: string | Date;
};

function toISO(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

// ponytail: FIFO-matches by date only, not amount, so a partial payment marks a whole credit "paid".
// Good enough for the on-time/late signal this feeds; revisit if partial payments skew likelihood badly.
/** FIFO-matches payment_received entries to earlier credit_given entries per customer, to build PastCredit[] for likelihoodToPayBy. */
export function buildHistories(entries: RawEntry[]): Record<number, PastCredit[]> {
  const byCustomer = new Map<number, { type: string; due_date: string | null; created_at: string }[]>();
  for (const e of entries) {
    const row = { type: e.type, due_date: e.due_date, created_at: toISO(e.created_at) };
    if (!byCustomer.has(e.customer_id)) byCustomer.set(e.customer_id, []);
    byCustomer.get(e.customer_id)!.push(row);
  }

  const result: Record<number, PastCredit[]> = {};
  for (const [customerId, rows] of byCustomer) {
    const sorted = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at));
    const credits = sorted.filter((r) => r.type === "credit_given");
    const payments = sorted
      .filter((r) => r.type === "payment_received")
      .map((p) => p.created_at);

    const history: PastCredit[] = credits.map((c) => {
      const paidAt = payments.find((p) => p >= c.created_at);
      if (paidAt) payments.splice(payments.indexOf(paidAt), 1);
      return { dueDate: c.due_date, createdAt: c.created_at, paidAt: paidAt ?? null };
    });
    result[customerId] = history;
  }
  return result;
}

/** Earliest supplier due within 7 days, else today + 7. */
export function forecastHorizon(supplierDues: { dueDate: string | null }[], today: Date): Date {
  const within7 = supplierDues
    .map((d) => (d.dueDate ? new Date(d.dueDate) : null))
    .filter((d): d is Date => d !== null && daysBetween(today, d) >= 0 && daysBetween(today, d) <= 7)
    .sort((a, b) => a.getTime() - b.getTime());
  if (within7[0]) return within7[0];
  return new Date(today.getTime() + 7 * DAY_MS);
}
