import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { parseNewsletter, getLatestIssueNumber } from "@/lib/newsletter-parser";
import { getMarvSignoff } from "@/lib/marv-signoffs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

function renderNewsletterHTML(
  parsed: ReturnType<typeof parseNewsletter>,
  unsubscribeUrl: string
): string {
  const renderBullets = (items: string[]) =>
    items.map((item) => `<li>${item}</li>`).join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${parsed?.title || "Tampa Pulse"}</title>
  <style>
    body {
      background: #F7F8FA;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
      color: #222;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #fff;
      border-radius: 18px;
      box-shadow: 0 4px 24px rgba(26,34,51,0.07);
      overflow: hidden;
      padding: 0 0 32px 0;
    }
    .header {
      background: #FF5A36;
      color: #fff;
      padding: 32px 24px 24px 24px;
      text-align: center;
    }
    .header h1 {
      font-size: 2.1em;
      margin: 0 0 4px 0;
      letter-spacing: -1px;
      font-weight: 900;
    }
    .header-sub {
      font-size: 0.95em;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.95);
    }
    .section {
      margin: 28px 0 0 0;
      padding: 0 24px;
    }
    .section-title {
      font-size: 1.2em;
      color: #FF5A36;
      margin-bottom: 16px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    li {
      background: #F7F8FA;
      border-radius: 12px;
      margin-bottom: 12px;
      padding: 14px 16px;
      font-size: 0.95em;
      line-height: 1.5;
    }
    .greeting {
      font-size: 1em;
      line-height: 1.7;
      color: #444;
      margin-bottom: 0;
    }
    .signoff {
      font-size: 0.95em;
      line-height: 1.7;
      color: #444;
      white-space: pre-line;
      margin-top: 24px;
    }
    .footer {
      margin: 28px 0 0 0;
      text-align: center;
      color: #999;
      font-size: 0.85em;
      padding: 24px;
      border-top: 1px solid #eee;
    }
    .footer a {
      color: #FF5A36;
      text-decoration: underline;
    }
    @media (max-width: 650px) {
      .container { max-width: 98vw; }
      .section { padding: 0 16px; }
      .header { padding: 28px 16px 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Tampa Pulse</h1>
      <div class="header-sub">Issue #${parsed?.issueNumber} · ${parsed?.dateRange || new Date().toLocaleDateString()}</div>
    </div>

    <div class="section">
      <p class="greeting">${parsed?.greeting || ""}</p>
    </div>

    ${
      parsed?.weekAtAGlance && parsed.weekAtAGlance.length > 0
        ? `
    <div class="section">
      <div class="section-title">This Week at a Glance</div>
      <ul>
        ${renderBullets(parsed.weekAtAGlance)}
      </ul>
    </div>
    `
        : ""
    }

    ${
      parsed?.digest && parsed.digest.length > 0
        ? `
    <div class="section">
      <div class="section-title">Digest</div>
      <ul>
        ${renderBullets(parsed.digest)}
      </ul>
    </div>
    `
        : ""
    }

    ${
      parsed?.hiddenGems && parsed.hiddenGems.length > 0
        ? `
    <div class="section">
      <div class="section-title">Hidden Gems</div>
      <ul>
        ${renderBullets(parsed.hiddenGems)}
      </ul>
    </div>
    `
        : ""
    }

    ${
      parsed?.eventRoundup && parsed.eventRoundup.length > 0
        ? `
    <div class="section">
      <div class="section-title">Happenings</div>
      <ul>
        ${renderBullets(parsed.eventRoundup)}
      </ul>
    </div>
    `
        : ""
    }

    ${
      parsed?.communityPickBody && parsed.communityPickBody.length > 0
        ? `
    <div class="section">
      <div class="section-title">Community Pick</div>
      <p style="font-size: 0.95em; line-height: 1.7; color: #444;">${parsed.communityPickBody[0]}</p>
    </div>
    `
        : ""
    }

    <div class="section">
      <p class="signoff">${parsed?.signoff || ""}</p>
    </div>

    <div class="footer">
      <p style="margin: 0 0 12px 0;">Tampa Pulse — The weekly rundown of what's actually happening in Tampa Bay.</p>
      <p style="margin: 0;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://mytampapulse.com"}">Website</a>
        &nbsp;&middot;&nbsp;
        <a href="${unsubscribeUrl}">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export async function POST(req: NextRequest) {
  // Verify this is a cron request (from Vercel or manual trigger with auth)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Get issue number from query or use latest
    const url = new URL(req.url);
    const issueParam = url.searchParams.get("issue");
    const issueNumber = issueParam ? parseInt(issueParam) : getLatestIssueNumber();

    if (!issueNumber) {
      return NextResponse.json(
        { error: "No newsletter issues found" },
        { status: 404 }
      );
    }

    // Parse the newsletter
    const parsed = parseNewsletter(issueNumber);
    if (!parsed) {
      return NextResponse.json(
        { error: `Issue #${issueNumber} not found` },
        { status: 404 }
      );
    }

    // Get all active subscribers who haven't received this issue yet
    const { data: subscribers, error: fetchError } = await supabase
      .from("subscribers")
      .select("id, email, unsubscribe_token")
      .eq("status", "active")
      .not("id", "in", `(SELECT subscriber_id FROM newsletter_sends WHERE issue_number = ${issueNumber})`);

    if (fetchError) {
      console.error("Fetch subscribers error:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch subscribers" },
        { status: 500 }
      );
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        message: "No new subscribers to send to",
      });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mytampapulse.com";
    let sentCount = 0;
    const errors: string[] = [];

    // Send to each subscriber
    for (const subscriber of subscribers) {
      try {
        const unsubscribeUrl = `${siteUrl}/unsubscribe?token=${subscriber.unsubscribe_token}`;
        const html = renderNewsletterHTML(parsed, unsubscribeUrl);

        await resend.emails.send({
          from: "Tampa Pulse <newsletter@mytampapulse.com>",
          to: subscriber.email,
          subject: `Tampa Pulse #${issueNumber} · ${parsed.title}`,
          html,
        });

        // Record the send
        await supabase.from("newsletter_sends").insert({
          issue_number: issueNumber,
          subscriber_id: subscriber.id,
          email_address: subscriber.email,
        });

        sentCount++;
      } catch (err) {
        console.error(`Error sending to ${subscriber.email}:`, err);
        errors.push(`${subscriber.email}: ${String(err)}`);
      }
    }

    return NextResponse.json({
      success: true,
      issueNumber,
      sent: sentCount,
      total: subscribers.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("Send newsletter error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
