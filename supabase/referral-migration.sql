-- Add referral tracking to subscribers
ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS referral_count integer DEFAULT 0;

-- Referrals log table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  referred_email text NOT NULL,
  created_at timestamp WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referred_id) -- each signup can only be credited to one referrer
);

-- Index for looking up referrals by referrer
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
