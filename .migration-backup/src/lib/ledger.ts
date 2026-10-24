import { query } from "./db";
export { calcBalance, type LedgerEntry } from "./balance";

export type LedgerRow = {
  customer_id: number;
  name: string;
  balance_paise: number;
  oldest_due_date: string | null;
};

export async function getCustomerBalances(merchantId: number): Promise<LedgerRow[]> {
  const rows = await query<LedgerRow>(
    `select
       c.id as customer_id,
       c.name,
       coalesce(sum(case when e.type = 'credit_given' then e.amount_paise else 0 end), 0)
         - coalesce(sum(case when e.type = 'payment_received' then e.amount_paise else 0 end), 0)
         as balance_paise,
       min(e.due_date) filter (where e.type = 'credit_given') as oldest_due_date
     from customers c
     left join entries e on e.customer_id = c.id
     where c.merchant_id = $1 and c.kind = 'customer'
     group by c.id, c.name
     having coalesce(sum(case when e.type = 'credit_given' then e.amount_paise else 0 end), 0)
         - coalesce(sum(case when e.type = 'payment_received' then e.amount_paise else 0 end), 0) > 0
     order by balance_paise desc`,
    [merchantId]
  );
  return rows;
}

export async function getSupplierDues(merchantId: number): Promise<LedgerRow[]> {
  const rows = await query<LedgerRow>(
    `select
       c.id as customer_id,
       c.name,
       coalesce(sum(case when e.type in ('supplier_due', 'purchase') then e.amount_paise else 0 end), 0)
         - coalesce(sum(case when e.type = 'supplier_paid' then e.amount_paise else 0 end), 0)
         as balance_paise,
       min(e.due_date) filter (where e.type in ('supplier_due', 'purchase')) as oldest_due_date
     from customers c
     left join entries e on e.customer_id = c.id
     where c.merchant_id = $1 and c.kind = 'supplier'
     group by c.id, c.name
     having coalesce(sum(case when e.type in ('supplier_due', 'purchase') then e.amount_paise else 0 end), 0)
         - coalesce(sum(case when e.type = 'supplier_paid' then e.amount_paise else 0 end), 0) > 0
     order by balance_paise desc`,
    [merchantId]
  );
  return rows;
}

export async function findOrCreateCustomer(
  merchantId: number,
  kind: "customer" | "supplier",
  name: string
): Promise<number> {
  const trimmed = name.trim();
  const existing = await query<{ id: number }>(
    `select id from customers where merchant_id = $1 and kind = $2 and lower(name) = lower($3)`,
    [merchantId, kind, trimmed]
  );
  if (existing[0]) return existing[0].id;
  const created = await query<{ id: number }>(
    `insert into customers (merchant_id, kind, name) values ($1, $2, $3) returning id`,
    [merchantId, kind, trimmed]
  );
  return created[0].id;
}
