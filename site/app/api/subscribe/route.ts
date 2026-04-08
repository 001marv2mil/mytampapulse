import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

const MILESTONES: Record<number, { prize: string; description: string }> = {
  5:  { prize: "a Tampa restaurant voucher",       description: "dinner for two at a local Tampa spot" },
  10: { prize: "a $100 Tampa Bay gift card",        description: "$100 to spend anywhere in Tampa Bay" },
  25: { prize: "an iPad giveaway entry",            description: "you're entered to win an iPad — winner announced monthly" },
};

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

    // Duplicate email — still return success
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
        const newCount = (referrer.referral_count || 0) + 1;

        // Increment referral count
        await supabase
          .from("subscribers")
          .update({ referral_count: newCount })
          .eq("id", referrer.id);

        // Log the referral
        await supabase.from("referrals").insert({
          referrer_id: referrer.id,
          referred_id: data.id,
          referred_email: email,
        });

        // Check if they hit a milestone
        const milestone = MILESTONES[newCount];

        if (milestone) {
          // Milestone email — entered for a prize
          await resend.emails.send({
            from: "Tampa Pulse <newsletter@mytampapulse.com>",
            to: referrer.email,
            subject: `🏆 You hit ${newCount} referrals — you've been entered for ${milestone.prize}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <span style="font-size: 28px; font-weight: 900;">tampa<span style="color: #FF5A36;">pulse</span></span>
                </div>

                <div style="background: #FFF5F0; border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 32px;">
                  <p style="font-size: 40px; margin: 0 0 8px;">🏆</p>
                  <h1 style="font-size: 22px; font-weight: 900; margin: 0 0 8px;">You hit ${newCount} referrals.</h1>
                  <p style="font-size: 16px; color: #FF5A36; font-weight: 700; margin: 0;">You've been entered for ${milestone.prize}.</p>
                </div>

                <p style="font-size: 15px; line-height: 1.7; color: #444;">
                  That's ${newCount} people who signed up because of you. Seriously — thank you.
                </p>

                <p style="font-size: 15px; line-height: 1.7; color: #444;">
                  As a reward, you're now entered for <strong>${milestone.description}</strong>. We'll reach out directly when winners are picked.
                </p>

                <p style="font-size: 15px; line-height: 1.7; color: #444;">
                  Keep going — the next milestone unlocks an even bigger reward.
                </p>

                <div style="border: 1px solid #eee; border-radius: 12px; padding: 20px; margin: 28px 0;">
                  <p style="font-size: 13px; font-weight: 700; color: #1a1a1a; margin: 0 0 6px;">Your referral link</p>
                  <p style="font-size: 13px; color: #FF5A36; margin: 0;"><a href="${referralLink}" style="color: #FF5A36;">${referralLink}</a></p>
                </div>

                <div style="background: #1a1a1a; border-radius: 12px; padding: 20px; margin: 0 0 28px; text-align: center;">
                  <p style="font-size: 13px; font-weight: 700; color: #fff; margin: 0 0 6px;">Follow us on Instagram for daily updates</p>
                  <p style="font-size: 12px; color: #999; margin: 0 0 12px;">We post 3x/day — the stuff that can't wait until Thursday.</p>
                  <a href="https://instagram.com/thetampapulse" style="display: inline-block; background: #FF5A36; color: white; font-weight: 700; font-size: 13px; padding: 10px 22px; border-radius: 8px; text-decoration: none;">@thetampapulse</a>
                </div>

                <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;" />
                <p style="font-size: 11px; color: #999; text-align: center;">
                  <a href="${unsubscribeUrl}" style="color: #999; text-decoration: underline;">Unsubscribe</a>
                  &nbsp;&middot;&nbsp; Tampa Bay, FL
                </p>
              </div>
            `,
          });
        } else {
          // Standard referral email — all 3 PDFs
          await resend.emails.send({
            from: "Tampa Pulse <newsletter@mytampapulse.com>",
            to: referrer.email,
            subject: `Someone signed up with your link 🎉 Here's your Tampa bundle`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <span style="font-size: 28px; font-weight: 900;">tampa<span style="color: #FF5A36;">pulse</span></span>
                </div>

                <h1 style="font-size: 22px; font-weight: 800; margin-bottom: 12px;">You got a referral. 🙌</h1>

                <p style="font-size: 15px; line-height: 1.7; color: #444;">
                  Someone just signed up using your link. You now have <strong>${newCount} referral${newCount !== 1 ? "s" : ""}</strong>.
                </p>

                <p style="font-size: 15px; line-height: 1.7; color: #444;">
                  Here's your Tampa bundle — three guides, pick whichever hits for you:
                </p>

                <div style="margin: 28px 0; display: flex; flex-direction: column; gap: 12px;">
                  <a href="${siteUrl}/first-timer.pdf" style="display: block; background: #FF5A36; color: white; font-weight: 700; font-size: 14px; padding: 14px 24px; border-radius: 10px; text-decoration: none; margin-bottom: 10px;">
                    Tampa First-Timer's Checklist →<br>
                    <span style="font-weight: 400; font-size: 12px; opacity: 0.85;">50 things worth your time, by neighborhood</span>
                  </a>
                  <a href="${siteUrl}/neighborhoods.pdf" style="display: block; background: #1a1a1a; color: white; font-weight: 700; font-size: 14px; padding: 14px 24px; border-radius: 10px; text-decoration: none; margin-bottom: 10px;">
                    Tampa Neighborhoods Guide →<br>
                    <span style="font-weight: 400; font-size: 12px; opacity: 0.7;">Ybor, SoHo, Hyde Park + more — where to actually go</span>
                  </a>
                  <a href="${siteUrl}/events-guide.pdf" style="display: block; background: #1a1a1a; color: white; font-weight: 700; font-size: 14px; padding: 14px 24px; border-radius: 10px; text-decoration: none;">
                    Tampa Essential Events Guide →<br>
                    <span style="font-weight: 400; font-size: 12px; opacity: 0.7;">The events worth planning around, year-round</span>
                  </a>
                </div>

                <p style="font-size: 14px; line-height: 1.7; color: #666;">
                  Keep sharing — at <strong>5 referrals</strong> you're entered for a restaurant voucher. At <strong>10</strong>, a $100 gift card. At <strong>25</strong>, an iPad giveaway.
                </p>

                <p style="font-size: 14px; color: #999; margin-top: 8px;">Your referral link: <a href="${referralLink}" style="color: #FF5A36;">${referralLink}</a></p>

                <div style="background: #1a1a1a; border-radius: 12px; padding: 20px; margin: 28px 0 0; text-align: center;">
                  <p style="font-size: 13px; font-weight: 700; color: #fff; margin: 0 0 6px;">Follow us on Instagram for daily updates</p>
                  <p style="font-size: 12px; color: #999; margin: 0 0 12px;">We post 3x/day — the stuff that can't wait until Thursday.</p>
                  <a href="https://instagram.com/thetampapulse" style="display: inline-block; background: #FF5A36; color: white; font-weight: 700; font-size: 13px; padding: 10px 22px; border-radius: 8px; text-decoration: none;">@thetampapulse</a>
                </div>

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
    }

    // Welcome email to new subscriber
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

          <div style="background: linear-gradient(135deg, #405DE6, #833AB4, #E1306C, #F77737); border-radius: 12px; padding: 3px; margin: 24px 0;">
            <div style="background: #ffffff; border-radius: 10px; padding: 20px; text-align: center;">
              <p style="font-size: 14px; font-weight: 700; color: #1a1a1a; margin: 0 0 6px;">Get daily Tampa updates between newsletters</p>
              <p style="font-size: 13px; color: #666; margin: 0 0 14px;">We post 3x/day — new openings, development, events. The stuff that can't wait until Thursday.</p>
              <a href="https://instagram.com/thetampapulse" style="display: inline-block; background: #1a1a1a; color: white; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 8px; text-decoration: none;">
                Follow @thetampapulse on Instagram →
              </a>
            </div>
          </div>

          <div style="border: 1px solid #eee; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <p style="font-size: 14px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px;">🎁 Know someone who'd love this?</p>
            <p style="font-size: 14px; color: #666; margin: 0 0 6px;">Share your link and unlock rewards:</p>
            <p style="font-size: 13px; color: #444; margin: 0 0 4px;">1 referral — Tampa guide bundle (3 PDFs)</p>
            <p style="font-size: 13px; color: #444; margin: 0 0 4px;">5 referrals — Restaurant voucher entry</p>
            <p style="font-size: 13px; color: #444; margin: 0 0 12px;">10+ referrals — $100 gift card &amp; iPad giveaway</p>
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
