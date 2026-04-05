import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Insert subscriber
    const { data, error } = await supabase
      .from("subscribers")
      .insert({ email })
      .select("unsubscribe_token")
      .single();

    // Duplicate email — not an error, just skip welcome email
    if (error && error.code === "23505") {
      return NextResponse.json({ success: true });
    }

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
    }

    // Send welcome email
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mytampapulse.com";
    const unsubscribeUrl = `${siteUrl}/unsubscribe?token=${data.unsubscribe_token}`;

    await resend.emails.send({
      from: "Tampa Pulse <newsletter@mytampapulse.com>",
      to: email,
      subject: "You're in. Welcome to Tampa Pulse.",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="font-size: 28px; font-weight: 900; color: #1a1a1a;">tampa<span style="color: #FF5A36;">pulse</span></span>
          </div>

          <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 16px;">Welcome to the Pulse.</h1>

          <p style="font-size: 15px; line-height: 1.7; color: #444;">
            You just joined the best weekly rundown of what's actually happening in Tampa Bay. No clickbait, no politics, no filler — just the spots, events, and hidden gems worth your time.
          </p>

          <p style="font-size: 15px; line-height: 1.7; color: #444;">
            Every Thursday, you'll get a new issue in your inbox. Think of it like having a friend who knows every corner of Tampa and texts you the good stuff.
          </p>

          <div style="background: #FFF5F0; border-radius: 12px; padding: 24px; margin: 28px 0;">
            <p style="font-size: 14px; font-weight: 700; color: #FF5A36; margin: 0 0 8px;">While you wait for Thursday...</p>
            <p style="font-size: 14px; line-height: 1.6; color: #444; margin: 0;">
              Check out our latest issue to see what you've been missing:
            </p>
            <a href="${siteUrl}/newsletter" style="display: inline-block; background: #FF5A36; color: white; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 12px;">
              Read the Latest Issue
            </a>
          </div>

          <p style="font-size: 15px; line-height: 1.7; color: #444;">
            If you ever find a spot because of us, hit reply and tell me about it. I read every one.
          </p>

          <p style="font-size: 15px; line-height: 1.7; color: #444; margin-bottom: 0;">
            See you Thursday.
          </p>
          <p style="font-size: 15px; font-weight: 700; color: #1a1a1a; margin-top: 4px;">
            — Marv
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;" />
          <p style="font-size: 11px; color: #999; text-align: center;">
            <a href="${unsubscribeUrl}" style="color: #999; text-decoration: underline;">Unsubscribe</a>
            &nbsp;&middot;&nbsp; Tampa Bay, FL
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
