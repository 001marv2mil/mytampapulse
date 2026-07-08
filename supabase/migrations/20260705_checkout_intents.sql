-- Started-checkout capture: whoever taps Pay gets logged before the Stripe
-- redirect, so abandoned checkouts can be followed up with.
create table if not exists awp_checkout_intents (
  id uuid primary key default gen_random_uuid(),
  email text,
  name text,
  items text,
  created_at timestamptz not null default now()
);

create index if not exists awp_checkout_intents_email_idx on awp_checkout_intents (email);

alter table awp_checkout_intents enable row level security;
