import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getLatestIssueNumber } from "@/lib/newsletter-parser";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

const resend = new Resend(process.env.RESEND_API_KEY);

// POST /api/send-magic-link  { email }
// Looks up the subscriber by email, sends them a one-click access link.
// Works from any device, any country — no password ever needed.
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const { data: subscriber } = await supabase
      .from("subscribers")
      .select("id, email, unsubscribe_token")
      .eq("email", email.toLowerCase().trim())
      .eq("status", "active")
      .maybeSingle();

    // Always return success — never reveal whether an email exists
    if (!subscriber) {
      return NextResponse.json({ success: true });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mytampapulse.com";
    const latestIssue = getLatestIssueNumber();
    const magicLink = `${siteUrl}/api/auth/sub?token=${subscriber.unsubscribe_token}&to=/newsletter/${latestIssue}`;

    await resend.emails.send({
      from: "Tampa Pulse <newsletter@mytampapulse.com>",
      to: subscriber.email,
      subject: "Your Tampa Pulse access link",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="font-size: 26px; font-weight: 900;">tampa<span style="color: #FF5A36;">pulse</span></span>
          </div>

          <h1 style="font-size: 22px; font-weight: 800; margin-bottom: 12px;">Here's your access link.</h1>

          <p style="font-size: 15px; line-height: 1.7; color: #555; margin-bottom: 28px;">
            Click the button below to unlock the full Tampa Pulse archive — on whatever device or browser you're on right now. Works from your phone, iPad, friend's computer, anywhere.
          </p>

          <div style="background: #FFF5F0; border-radius: 16px; padding: 28px; text-align: center; margin-bottom: 28px;">
            <p style="font-size: 14px; color: #666; margin: 0 0 20px; line-height: 1.5;">
              Tap this on the device you want to use — it'll unlock 30 days of full access on that browser.
            </p>
            <a href="${magicLink}" style="display: inline-block; background: #FF5A36; color: white; font-weight: 800; font-size: 16px; padding: 16px 36px; border-radius: 12px; text-decoration: none; letter-spacing: -0.01em;">
              Open Tampa Pulse →
            </a>
            <p style="font-size: 12px; color: #bbb; margin: 16px 0 0;">Link works once per device. Need access somewhere else? Just request another one.</p>
          </div>

          <p style="font-size: 13px; color: #aaa; text-align: center; margin-bottom: 0;">
            Didn't request this? Ignore it — nothing will change on your account.
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;" />
          <p style="font-size: 11px; color: #bbb; text-align: center;">Tampa Pulse &middot; Tampa Bay, FL</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Magic link error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
