-- Newsletter clicks table
-- Logs every time a subscriber follows an email CTA through /api/auth/sub.
-- First-party engagement tracking: unlike Resend's pixel-based open
-- tracking, this records real clicks that mail-client privacy features
-- cannot hide.

create table if not exists newsletter_clicks (
  id              uuid          default gen_random_uuid() primary key,
  subscriber_id   uuid          references subscribers(id) on delete set null,
  issue_number    integer,               -- parsed from the redirect path, null if not an issue link
  path            text,                  -- the relative path the subscriber was sent to
  clicked_at      timestamptz   default now()
);

-- Indexes for per-issue engagement queries
create index if not exists newsletter_clicks_subscriber_id_idx on newsletter_clicks(subscriber_id);
create index if not exists newsletter_clicks_issue_number_idx  on newsletter_clicks(issue_number);
create index if not exists newsletter_clicks_clicked_at_idx    on newsletter_clicks(clicked_at desc);

-- RLS: the API route uses the service role key (bypasses RLS).
-- Enable RLS anyway so the anon key can never read this table.
alter table newsletter_clicks enable row level security;

-- Service role has full access (no policy needed, bypasses RLS automatically).
-- No public read policy means anon key users cannot read click data.
