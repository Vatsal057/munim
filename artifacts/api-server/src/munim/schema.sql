create table if not exists merchants (
  id            serial primary key,
  name          text not null,
  phone         text not null,
  business_name text not null default '',
  business_type text not null default 'kirana',   -- kirana | tiffin | tailor | cart | side_hustle | personal
  language      text not null default 'en',       -- en | kn | hi
  is_demo       boolean not null default false,
  session_token text unique,
  created_at    timestamptz not null default now()
);

create table if not exists customers (           -- people who owe the merchant, or suppliers the merchant owes
  id          serial primary key,
  merchant_id int not null references merchants(id) on delete cascade,
  name        text not null,
  phone       text,
  kind        text not null default 'customer',   -- customer | supplier
  created_at  timestamptz not null default now(),
  unique (merchant_id, kind, name)
);

create table if not exists entries (
  id           serial primary key,
  merchant_id  int not null references merchants(id) on delete cascade,
  customer_id  int references customers(id),
  type         text not null,  -- credit_given | payment_received | purchase | supplier_due | supplier_paid | order | skip | sale | wastage
  amount_paise bigint not null default 0 check (amount_paise >= 0),
  due_date     date,
  items        text,
  note         text,
  source       text not null default 'text',  -- text | voice | khata_photo | bill_photo | upi_screenshot | payment_link | manual
  created_at   timestamptz not null default now()
);

create table if not exists reminders (
  id            serial primary key,
  merchant_id   int not null references merchants(id) on delete cascade,
  customer_id   int not null references customers(id),
  amount_paise  bigint not null check (amount_paise > 0),
  reason        text not null,          -- why the agent picked this customer
  message       text not null,          -- draft text, editable by the merchant
  status        text not null default 'draft',  -- draft | approved | rejected | paid
  pay_token     text unique,            -- public token for /p/[token]
  payment_ref   text,                   -- Pine Labs link/order id
  payment_url   text,
  created_by    text not null default 'agent',  -- agent | builtin | merchant
  created_at    timestamptz not null default now(),
  approved_at   timestamptz,
  paid_at       timestamptz
);

create table if not exists events (       -- proof log: never delete rows
  id          bigserial primary key,
  merchant_id int references merchants(id) on delete set null,
  actor       text not null,    -- merchant | agent | system | customer
  action      text not null,    -- signup | entry_created | reminder_drafted | reminder_approved | reminder_shared | payment_received | ...
  payload     jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create index if not exists entries_merchant_idx on entries(merchant_id, created_at);
create index if not exists events_merchant_idx on events(merchant_id, created_at);
