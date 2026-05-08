-- Share events table
-- Logs every time a subscriber (or visitor) clicks a share button.
-- Used by the admin dashboard at /admin to show which sharing methods
-- and motivators are actually driving referrals.

create table if not exists share_events (
  id              uuid          default gen_random_uuid() primary key,
  subscriber_id   uuid          references subscribers(id) on delete set null,
  issue_number    integer,
  share_method    text          not null, -- copy_link | twitter | sms | native | email
  share_cta       text,                   -- referral_section | header | email_cta
  referral_url    text,
  created_at      timestamptz   default now()
);

-- Indexes for the admin dashboard queries
create index if not exists share_events_subscriber_id_idx on share_events(subscriber_id);
create index if not exists share_events_issue_number_idx  on share_events(issue_number);
create index if not exists share_events_created_at_idx    on share_events(created_at desc);
create index if not exists share_events_method_idx        on share_events(share_method);

-- RLS: the API route uses the service role key (bypasses RLS).
-- Enable RLS anyway so the anon key can never read this table.
alter table share_events enable row level security;

-- Service role has full access (no policy needed, bypasses RLS automatically).
-- No public read policy means anon key users cannot read share data.
