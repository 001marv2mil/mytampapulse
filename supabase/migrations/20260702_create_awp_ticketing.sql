-- All White R&B Rooftop ticketing: orders + individual e-tickets
create table if not exists awp_orders (
  session_id text primary key,
  email text,
  name text,
  phone text,
  amount_total integer,
  created_at timestamptz not null default now()
);

create table if not exists awp_tickets (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  session_id text not null references awp_orders(session_id),
  tier text not null,
  buyer_email text,
  status text not null default 'valid' check (status in ('valid', 'used')),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists awp_tickets_tier_idx on awp_tickets (tier);
create index if not exists awp_tickets_session_idx on awp_tickets (session_id);

-- Only the service role touches these tables; block anon/authenticated access.
alter table awp_orders enable row level security;
alter table awp_tickets enable row level security;
