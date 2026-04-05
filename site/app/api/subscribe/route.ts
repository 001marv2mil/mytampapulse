import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

const LEAD_MAGNET_URL = "https://airtable.com/appcopVasMCFEy9tc/shrLEgV1I5DFXLwMD";

export async function POST(req: NextRequest) {
  try {
    const { email, ref } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Insert subscriber
    const { data, error } = await supabase
      .from("subscribers")
      .insert({ email })
      .select("id, unsubscribe_token")
      .single();

    // Duplicate email — still check if they used a referral code
    if (error && error.code === "23505") {
      return NextResponse.json({ success: true });
    }

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mytampapulse.com";
    const unsubscribeUrl = `${siteUrl}/unsubscribe?token=${data.unsubscribe_token}`;
    const referralLink = `${siteUrl}?ref=${data.id}`;

    // If signed up via referral, credit the referrer
    if (ref && typeof ref === "string") {
      const { data: referrer } = await supabase
        .from("subscribers")
        .select("id, email, referral_count")
        .eq("id", ref)
        .eq("status", "active")
        .single();

      if (referrer) {
        // Increment referral count
        await supabase
          .from("subscribers")
          .update({ referral_count: (referrer.referral_count || 0) + 1 })
          .eq("id", referrer.id);

        // Log the referral
        await supabase.from("referrals").insert({
          referrer_id: referrer.id,
          referred_id: data.id,
          referred_email: email,
        });

        // Send lead magnet to referrer
        await resend.emails.send({
          from: "Tampa Pulse <newsletter@mytampapulse.com>",
          to: referrer.email,
          subject: "Someone signed up with your link 🎉 Here's your reward",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
              <div style="text-align: center; margin-bottom: 32px;">
                <span style="font-size: 28px; font-weight: 900;">tampa<span style="color: #FF5A36;">pulse</span></span>
              </div>

              <h1 style="font-size: 22px; font-weight: 800; margin-bottom: 12px;">You got a referral. 🙌</h1>

              <p style="font-size: 15px; line-height: 1.7; color: #444;">
                Someone just signed up using your link. You now have <strong>${(referrer.referral_count || 0) + 1} referral${(referrer.referral_count || 0) + 1 !== 1 ? "s" : ""}</strong>.
              </p>

              <p style="font-size: 15px; line-height: 1.7; color: #444;">
                As promised — here's your reward: instant access to the <strong>Complete Tampa Hidden Gems Database</strong>.
                50+ spots locals actually go to, organized by neighborhood, vibe, and price.
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${LEAD_MAGNET_URL}" style="display: inline-block; background: #FF5A36; color: white; font-weight: 800; font-size: 15px; padding: 14px 32px; border-radius: 10px; text-decoration: none;">
                  Open the Hidden Gems Database →
                </a>
              </div>

              <p style="font-size: 14px; line-height: 1.7; color: #666;">
                Keep sharing your link to keep earning rewards. We rotate the prize every few weeks.
              </p>

              <p style="font-size: 14px; color: #999; margin-top: 8px;">Your referral link: <a href="${referralLink}" style="color: #FF5A36;">${referralLink}</a></p>

              <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;" />
              <p style="font-size: 11px; color: #999; text-align: center;">
                <a href="${unsubscribeUrl}" style="color: #999; text-decoration: underline;">Unsubscribe</a>
                &nbsp;&middot;&nbsp; Tampa Bay, FL
              </p>
            </div>
          `,
        });
      }
    }

    // Send welcome email to new subscriber (with their referral link)
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
            Every Thursday — Tampa's best events, food drops, hidden gems, and weekend plans. Free, direct to your inbox.
          </p>

          <div style="background: #FFF5F0; border-radius: 12px; padding: 24px; margin: 28px 0;">
            <p style="font-size: 14px; font-weight: 700; color: #FF5A36; margin: 0 0 8px;">While you wait for Thursday...</p>
            <a href="${siteUrl}/newsletter" style="display: inline-block; background: #FF5A36; color: white; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 4px;">
              Read the Latest Issue →
            </a>
          </div>

          <div style="border: 1px solid #eee; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <p style="font-size: 14px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px;">🎁 Know someone who should read this?</p>
            <p style="font-size: 14px; color: #666; margin: 0 0 12px;">Share your link — when they sign up, you get the Complete Tampa Hidden Gems Database (50+ local spots tourists never find).</p>
            <p style="font-size: 13px; font-weight: 600; color: #FF5A36; margin: 0;">Your link: <a href="${referralLink}" style="color: #FF5A36;">${referralLink}</a></p>
          </div>

          <p style="font-size: 15px; line-height: 1.7; color: #444; margin-bottom: 0;">See you Thursday.</p>
          <p style="font-size: 15px; font-weight: 700; color: #1a1a1a; margin-top: 4px;">— Marv</p>

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
