-- Tampa Pulse Dinner Club
-- Readers sign up, answer a few matching questions, and get seated with five
-- locals they have not met. The restaurant is revealed the morning of.
-- One row per signup per dinner date.

create table if not exists dinner_club_signups (
  id                uuid          default gen_random_uuid() primary key,
  email             text          not null,
  first_name        text,
  dinner_date       date          not null,
  -- matching inputs
  neighborhood      text,                  -- south tampa | seminole heights | ybor | downtown | st pete | other
  dining_style      text,                  -- adventurous | comfort | somewhere new
  dietary           text,                  -- none | vegetarian | vegan | gluten free | allergy note
  age_range         text,                  -- 21-29 | 30-39 | 40-49 | 50+
  notes             text,
  -- lifecycle
  status            text          not null default 'pending',  -- pending | matched | confirmed | cancelled
  table_number      integer,
  subscriber_id     uuid          references subscribers(id) on delete set null,
  created_at        timestamptz   default now(),
  unique (email, dinner_date)
);

create index if not exists dinner_club_dinner_date_idx on dinner_club_signups(dinner_date);
create index if not exists dinner_club_status_idx      on dinner_club_signups(status);
create index if not exists dinner_club_created_at_idx  on dinner_club_signups(created_at desc);

-- RLS on: the API route uses the service role key and bypasses it. No public
-- policy means the anon key can never read signups (they contain emails).
alter table dinner_club_signups enable row level security;
