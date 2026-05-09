-- Add signup source tracking to subscribers
-- Stores where the subscriber came from: 'black-mask', 'R&B Night', 'Latina Night', 'join', etc.
ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS source text;

-- Index for filtering/grouping by source in the admin dashboard
CREATE INDEX IF NOT EXISTS subscribers_source_idx ON subscribers(source);
