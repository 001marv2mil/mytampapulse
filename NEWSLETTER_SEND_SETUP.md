# Automated Newsletter Send Setup

The weekly Thursday newsletter send infrastructure is now in place. Follow these steps to complete the setup.

## 1. Supabase Migration

Run this SQL in your Supabase editor to create the `newsletter_sends` table:

```sql
-- Newsletter sends tracking table
CREATE TABLE IF NOT EXISTS newsletter_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_number integer NOT NULL,
  subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  sent_at timestamp WITH TIME ZONE DEFAULT NOW(),
  email_address text NOT NULL,
  UNIQUE(issue_number, subscriber_id)
);

-- Index for querying sends by issue
CREATE INDEX IF NOT EXISTS idx_newsletter_sends_issue ON newsletter_sends(issue_number);

-- Index for querying sends by subscriber
CREATE INDEX IF NOT EXISTS idx_newsletter_sends_subscriber ON newsletter_sends(subscriber_id);
```

## 2. Vercel Environment Variables

Add these to Vercel (Project Settings → Environment Variables → All Environments):

- **CRON_SECRET**: `47aac8abb439997997c728e364fd6a8047e4db06d81cfbcc`
  - Protects the cron endpoint from unauthorized access
- **NEXT_PUBLIC_SITE_URL**: `https://mytampapulse.com`
  - Used for generating unsubscribe links in emails

## 3. How It Works

**Schedule**: Every Thursday at 8 AM UTC (via Vercel Cron)

**Process**:
1. Fetches the latest newsletter issue from `content/newsletters/`
2. Parses it using the newsletter parser
3. Renders it as HTML using the email template
4. Gets all subscribers with `status = 'active'` who haven't received this issue yet
5. Sends to each via Resend with unique unsubscribe link
6. Records each send in `newsletter_sends` to prevent duplicates

**Endpoint**: `POST /api/send-newsletter`
- Optional query param: `?issue=13` to send a specific issue number
- Requires `Authorization: Bearer {CRON_SECRET}` header
- Returns: `{ success: true, issueNumber, sent: X, total: Y }`

## 4. Manual Testing

To test the send locally before production:

```bash
# From site/ directory, start dev server
npm run dev

# In another terminal, test the endpoint with your cron secret
curl -X POST \
  -H "Authorization: Bearer 47aac8abb439997997c728e364fd6a8047e4db06d81cfbcc" \
  -H "Content-Type: application/json" \
  "http://localhost:3000/api/send-newsletter?issue=13"
```

Expected response:
```json
{
  "success": true,
  "issueNumber": 13,
  "sent": 5,
  "total": 5
}
```

Then check:
- ✓ Supabase `newsletter_sends` table has new records
- ✓ Your test email received the newsletter
- ✓ Unsubscribe link in email works and uses the correct token

## 5. Monitoring

After Thursday's first automated send, check:

1. **Supabase Dashboard**: `newsletter_sends` table should have rows for issue #14 (or whatever the latest is)
2. **Vercel Logs**: Check function logs under Deployments > Functions
3. **Resend Dashboard**: Verify emails were sent and any bounces/complaints

## 6. Handling Duplicate Issues

If the cron accidentally runs twice, the `UNIQUE(issue_number, subscriber_id)` constraint prevents duplicate sends to the same subscriber.

If you need to resend issue #13 to everyone (including those who already got it):
- Run the endpoint with manual auth header
- Or delete records from `newsletter_sends` WHERE `issue_number = 13` first

## Notes

- The cron uses your Vercel project's built-in cron service (free tier gets 1 cron per month)
- Vercel cron calls are made from `*.vercel.app` IPs — the CRON_SECRET header prevents abuse
- All email sends go through Resend (current quota allows this volume)
- Subscriber unsubscribe tokens are UUIDs generated when they sign up
- The `status` column defaults to `'active'` — update to `'unsubscribed'` when someone clicks the unsubscribe link
