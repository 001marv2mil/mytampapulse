import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { createHash } from "crypto";

async function sendMetaCAPIEvent(
  email: string,
  sourceUrl: string,
  eventId?: string,
  fbp?: string,
  fbc?: string,
) {
  const token = process.env.META_CAPI_TOKEN;
  if (!token) return;

  const hashedEmail = createHash("sha256").update(email.toLowerCase().trim()).digest("hex");

  const userData: Record<string, string | string[]> = { em: [hashedEmail] };
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  try {
    await fetch("https://graph.facebook.com/v21.0/1272183185072628/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [{
          event_name: "Lead",
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          event_source_url: sourceUrl,
          event_id: eventId,
          user_data: userData,
        }],
        access_token: token,
      }),
    });
  } catch (err) {
    console.error("Meta CAPI error:", err);
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

const MILESTONES: Record<number, { prize: string; description: string }> = {
  5:  { prize: "dinner for 2 at Bern's Steak House ($250)",  description: "dinner for two at Bern's Steak House — $250 on us" },
  10: { prize: "a $250 Tampa Bay gift card",        description: "$250 to spend anywhere in Tampa Bay" },
  25: { prize: "an iPad giveaway entry",            description: "you're entered to win an iPad winner announced monthly" },
};

export async function POST(req: NextRequest) {
  try {
    const { email, ref, source, event_id, fbp, fbc } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Derive these early so they're available in the duplicate handler too
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mytampapulse.com";
    const isEventSignup = source && source !== "join";
    const eventDisplayName =
      source === "black-mask" ? "Black Mask Social" : (source || "the next event");

    // Insert subscriber
    const { data, error } = await supabase
      .from("subscribers")
      .insert({ email })
      .select("id, unsubscribe_token")
      .single();

    // ── Duplicate email handler ──────────────────────────────────────────────
    // The email is already in the system. We never double-insert, but we do
    // need to handle three cases intelligently:
    //   1. Previously unsubscribed → reactivate + send fresh welcome
    //   2. Active + came from an event ad → confirm they're on the list for that event
    //   3. Active + generic signup → silent success, no spam
    if (error && error.code === "23505") {
      const { data: existing } = await supabase
        .from("subscribers")
        .select("id, unsubscribe_token, status")
        .eq("email", email)
        .single();

      if (existing) {
        const referralLink = `${siteUrl}?ref=${existing.id}`;
        const unsubUrl = `${siteUrl}/unsubscribe?token=${existing.unsubscribe_token}`;

        if (existing.status === "unsubscribed") {
          // Reactivate — they want back in
          await supabase
            .from("subscribers")
            .update({ status: "active", source: source ?? existing.status })
            .eq("id", existing.id);

          // Send a "welcome back" version of the event or generic email
          await resend.emails.send({
            from: "Tampa Pulse <newsletter@mytampapulse.com>",
            to: email,
            subject: isEventSignup
              ? `Welcome back — you're on the list for ${eventDisplayName} 🎭`
              : "Welcome back to Tampa Pulse 👋",
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <span style="font-size: 28px; font-weight: 900; color: #1a1a1a;">tampa<span style="color: #FF5A36;">pulse</span></span>
                </div>
                <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 12px;">You're back. 👋</h1>
                <p style="font-size: 15px; line-height: 1.7; color: #444; margin-bottom: 20px;">
                  ${isEventSignup
                    ? `Good to have you back. You're on the list for <strong>${eventDisplayName}</strong> — we'll hit you first when it drops.`
                    : `Good to have you back. You're back on Tampa Pulse — every Thursday, Tampa's best events, food, and moves, straight to your inbox.`
                  }
                </p>
                <div style="border: 1px solid #eee; border-radius: 12px; padding: 20px; margin: 24px 0;">
                  <p style="font-size: 14px; font-weight: 700; color: #1a1a1a; margin: 0 0 6px;">🎁 Your referral link</p>
                  <p style="font-size: 13px; color: #666; margin: 0 0 10px;">Share this and earn rewards — restaurant vouchers, gift cards, iPad giveaway.</p>
                  <p style="font-size: 13px; font-weight: 600; color: #FF5A36; margin: 0;"><a href="${referralLink}" style="color: #FF5A36;">${referralLink}</a></p>
                </div>
                <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;" />
                <p style="font-size: 11px; color: #999; text-align: center;">
                  <a href="${unsubUrl}" style="color: #999; text-decoration: underline;">Unsubscribe</a>
                  &nbsp;&middot;&nbsp; Tampa Bay, FL
                </p>
              </div>
            `,
          });

        } else if (isEventSignup) {
          // Active subscriber — already on the list, saw an event ad and signed up again.
          // Acknowledge the event, don't touch their record, don't send duplicate welcome.
          await resend.emails.send({
            from: "Tampa Pulse <newsletter@mytampapulse.com>",
            to: email,
            subject: `You're already in — we'll hit you when ${eventDisplayName} drops 🎭`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <span style="font-size: 28px; font-weight: 900; color: #1a1a1a;">tampa<span style="color: #FF5A36;">pulse</span></span>
                </div>
                <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 12px;">You're already on the list. ✅</h1>
                <p style="font-size: 15px; line-height: 1.7; color: #444; margin-bottom: 20px;">
                  Good news — you're already a Tampa Pulse subscriber, so you're first in line.
                  When <strong>${eventDisplayName}</strong> drops, you'll hear about it before anyone else.
                  No action needed.
                </p>
                <p style="font-size: 15px; line-height: 1.7; color: #444; margin-bottom: 28px;">
                  In the meantime, keep an eye on your Thursday newsletter — that's where the real stuff lives.
                </p>
                <div style="border: 1px solid #eee; border-radius: 12px; padding: 20px; margin: 24px 0;">
                  <p style="font-size: 14px; font-weight: 700; color: #1a1a1a; margin: 0 0 6px;">🎁 Know someone who'd be into it?</p>
                  <p style="font-size: 13px; color: #666; margin: 0 0 10px;">Share your link — every signup you send earns you rewards.</p>
                  <p style="font-size: 13px; font-weight: 600; color: #FF5A36; margin: 0;"><a href="${referralLink}" style="color: #FF5A36;">${referralLink}</a></p>
                </div>
                <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;" />
                <p style="font-size: 11px; color: #999; text-align: center;">
                  <a href="${unsubUrl}" style="color: #999; text-decoration: underline;">Unsubscribe</a>
                  &nbsp;&middot;&nbsp; Tampa Bay, FL
                </p>
              </div>
            `,
          });
        }
        // Active + generic signup → silent success, no email (they're already in, no need to remind them)
      }

      return NextResponse.json({ success: true, ref: existing?.id ?? null });
    }
    // ── End duplicate handler ────────────────────────────────────────────────

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
    }

    // Track signup source — runs silently if column doesn't exist yet
    if (source) {
      void supabase.from("subscribers").update({ source }).eq("id", data.id);
    }

    // Fire Meta CAPI Lead event server-side (bypasses iOS/ad blocker tracking)
    const sourceUrl = req.headers.get("referer") || "https://mytampapulse.com";
    sendMetaCAPIEvent(email, sourceUrl, event_id, fbp, fbc);

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
          // Milestone email entered for a prize
          await resend.emails.send({
            from: "Tampa Pulse <newsletter@mytampapulse.com>",
            to: referrer.email,
            subject: `🏆 You hit ${newCount} referrals you've been entered for ${milestone.prize}`,
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
                  That's ${newCount} people who signed up because of you. Seriously thank you.
                </p>

                <p style="font-size: 15px; line-height: 1.7; color: #444;">
                  As a reward, you're now entered for <strong>${milestone.description}</strong>. We'll reach out directly when winners are picked.
                </p>

                <p style="font-size: 15px; line-height: 1.7; color: #444;">
                  Keep going the next milestone unlocks an even bigger reward.
                </p>

                <div style="border: 1px solid #eee; border-radius: 12px; padding: 20px; margin: 28px 0;">
                  <p style="font-size: 13px; font-weight: 700; color: #1a1a1a; margin: 0 0 6px;">Your referral link</p>
                  <p style="font-size: 13px; color: #FF5A36; margin: 0;"><a href="${referralLink}" style="color: #FF5A36;">${referralLink}</a></p>
                </div>

                <div style="background: #1a1a1a; border-radius: 12px; padding: 20px; margin: 0 0 28px; text-align: center;">
                  <p style="font-size: 13px; font-weight: 700; color: #fff; margin: 0 0 6px;">Follow us on Instagram for daily updates</p>
                  <p style="font-size: 12px; color: #999; margin: 0 0 12px;">We post 3x/day the stuff that can't wait until Thursday.</p>
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
          // Standard referral email all 3 PDFs
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
                  Two bonus guides unlocked on top of the 60-Day Events Guide you already have:
                </p>

                <div style="margin: 28px 0; display: flex; flex-direction: column; gap: 12px;">
                  <a href="${siteUrl}/neighborhoods.pdf" style="display: block; background: #FF5A36; color: white; font-weight: 700; font-size: 14px; padding: 14px 24px; border-radius: 10px; text-decoration: none; margin-bottom: 10px;">
                    Tampa Neighborhoods Guide →<br>
                    <span style="font-weight: 400; font-size: 12px; opacity: 0.85;">Ybor, SoHo, Hyde Park + more where to actually go</span>
                  </a>
                  <a href="${siteUrl}/first-timer.pdf" style="display: block; background: #1a1a1a; color: white; font-weight: 700; font-size: 14px; padding: 14px 24px; border-radius: 10px; text-decoration: none;">
                    Tampa First-Timer's Checklist →<br>
                    <span style="font-weight: 400; font-size: 12px; opacity: 0.7;">50 Tampa picks locals actually stand behind</span>
                  </a>
                </div>

                <p style="font-size: 14px; line-height: 1.7; color: #666;">
                  Keep sharing — at <strong>5 referrals</strong> you&apos;re entered for dinner for 2 at Bern&apos;s Steak House ($250). At <strong>10</strong>, a $250 gift card. At <strong>25</strong>, an iPad giveaway.
                </p>

                <p style="font-size: 14px; color: #999; margin-top: 8px;">Your referral link: <a href="${referralLink}" style="color: #FF5A36;">${referralLink}</a></p>

                <div style="background: #1a1a1a; border-radius: 12px; padding: 20px; margin: 28px 0 0; text-align: center;">
                  <p style="font-size: 13px; font-weight: 700; color: #fff; margin: 0 0 6px;">Follow us on Instagram for daily updates</p>
                  <p style="font-size: 12px; color: #999; margin: 0 0 12px;">We post 3x/day the stuff that can't wait until Thursday.</p>
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

    // Welcome email — copy varies by signup source (isEventSignup + eventDisplayName defined above)
    await resend.emails.send({
      from: "Tampa Pulse <newsletter@mytampapulse.com>",
      to: email,
      subject: isEventSignup
        ? `You're on the list. Here's something for you while you wait 🎭`
        : "Your free 60-Day Tampa Events Guide is here 🎉",
      html: isEventSignup ? `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="font-size: 28px; font-weight: 900; color: #1a1a1a;">tampa<span style="color: #FF5A36;">pulse</span></span>
          </div>

          <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 12px;">You're on the list. 🎭</h1>

          <p style="font-size: 15px; line-height: 1.7; color: #444; margin-bottom: 20px;">
            The next ${eventDisplayName} is coming and you'll be the first to know when it drops. I'll hit your inbox with the date, location, and everything you need before it goes public.
          </p>

          <p style="font-size: 15px; line-height: 1.7; color: #444; margin-bottom: 28px;">
            In the meantime, I put together something for you. No reason to just sit and wait Tampa's got moves every weekend and I made sure you won't miss any of them.
          </p>

          <div style="background: #0d0d0d; border-radius: 16px; padding: 28px; margin: 0 0 28px; text-align: center;">
            <p style="font-size: 12px; font-weight: 700; color: #FF5A36; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 8px;">Free Gift On Me</p>
            <p style="font-size: 22px; font-weight: 900; color: #ffffff; margin: 0 0 8px;">60-Day Tampa Events Guide</p>
            <p style="font-size: 14px; line-height: 1.6; color: #aaa; margin: 0 0 20px;">60 days of concerts, rooftop events, restaurant openings, and weekend moves curated for locals, not tourists.</p>
            <a href="${siteUrl}/events-guide.pdf" style="display: inline-block; background: #FF5A36; color: white; font-weight: 800; font-size: 15px; padding: 14px 32px; border-radius: 10px; text-decoration: none;">
              Grab Your Free Guide →
            </a>
            <p style="font-size: 11px; color: #666; margin: 12px 0 0;">PDF · Free · No strings</p>
          </div>

          <p style="font-size: 15px; line-height: 1.7; color: #444; margin-bottom: 8px;">
            I also send a weekly newsletter every Thursday Tampa's best spots, what's opening, and what's worth your time. You're already on it.
          </p>

          <div style="background: #F7F8FA; border-radius: 12px; padding: 20px; margin: 16px 0; text-align: center;">
            <p style="font-size: 13px; font-weight: 700; color: #1a1a1a; margin: 0 0 6px;">📬 Want to read past issues?</p>
            <p style="font-size: 13px; color: #666; margin: 0 0 12px;">Browse the full archive every issue we've ever sent, all in one place.</p>
            <a href="${siteUrl}/newsletter" style="display: inline-block; background: #1a1a1a; color: white; font-weight: 700; font-size: 13px; padding: 10px 22px; border-radius: 8px; text-decoration: none;">
              Read the Archive →
            </a>
          </div>

          <div style="border: 1px solid #eee; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <p style="font-size: 14px; font-weight: 700; color: #1a1a1a; margin: 0 0 6px;">🎁 Refer a friend, get more</p>
            <p style="font-size: 13px; color: #666; margin: 0 0 10px;">Share your link and unlock bonus guides + giveaway entries:</p>
            <p style="font-size: 13px; color: #444; margin: 0 0 3px;">1 referral Tampa Neighborhoods Guide + First-Timer's Checklist</p>
            <p style="font-size: 13px; color: #444; margin: 0 0 3px;">5 referrals Dinner for 2 at Bern&apos;s Steak House ($250)</p>
            <p style="font-size: 13px; color: #444; margin: 0 0 14px;">10+ referrals $250 gift card &amp; iPad giveaway</p>
            <p style="font-size: 13px; font-weight: 600; color: #FF5A36; margin: 0;">Your link: <a href="${referralLink}" style="color: #FF5A36;">${referralLink}</a></p>
          </div>

          <div style="background: linear-gradient(135deg, #405DE6, #833AB4, #E1306C, #F77737); border-radius: 12px; padding: 3px; margin: 0 0 28px;">
            <div style="background: #ffffff; border-radius: 10px; padding: 20px; text-align: center;">
              <p style="font-size: 14px; font-weight: 700; color: #1a1a1a; margin: 0 0 6px;">Daily Tampa drops between newsletters</p>
              <p style="font-size: 13px; color: #666; margin: 0 0 14px;">New openings, events, and local moves stuff that can't wait until Thursday.</p>
              <a href="https://instagram.com/thetampapulse" style="display: inline-block; background: #1a1a1a; color: white; font-weight: 700; font-size: 13px; padding: 10px 22px; border-radius: 8px; text-decoration: none;">
                Follow @thetampapulse →
              </a>
            </div>
          </div>

          <p style="font-size: 15px; line-height: 1.7; color: #444; margin-bottom: 0;">See you at the next one.</p>
          <p style="font-size: 15px; font-weight: 700; color: #1a1a1a; margin-top: 4px;"> Marv</p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;" />
          <p style="font-size: 11px; color: #999; text-align: center;">
            <a href="${unsubscribeUrl}" style="color: #999; text-decoration: underline;">Unsubscribe</a>
            &nbsp;&middot;&nbsp; Tampa Bay, FL
          </p>
        </div>
      ` : `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="font-size: 28px; font-weight: 900; color: #1a1a1a;">tampa<span style="color: #FF5A36;">pulse</span></span>
          </div>

          <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 12px;">Here's your guide. Welcome to the Pulse.</h1>

          <p style="font-size: 15px; line-height: 1.7; color: #444; margin-bottom: 24px;">
            You're in. Every Thursday I send Tampa's best events, food drops, hidden gems, and weekend plans direct to your inbox, free.
          </p>

          <div style="background: #FFF5F0; border-radius: 16px; padding: 28px; margin: 0 0 28px; text-align: center;">
            <p style="font-size: 13px; font-weight: 700; color: #FF5A36; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px;">Your Free Download</p>
            <p style="font-size: 22px; font-weight: 900; color: #1a1a1a; margin: 0 0 8px;">60-Day Tampa Events Guide</p>
            <p style="font-size: 14px; line-height: 1.6; color: #555; margin: 0 0 20px;">Locals' picks. Not tourist traps. 60 days of concerts, food, openings, and weekend moves the same stuff I curate for the weekly newsletter.</p>
            <a href="${siteUrl}/events-guide.pdf" style="display: inline-block; background: #FF5A36; color: white; font-weight: 800; font-size: 15px; padding: 14px 32px; border-radius: 10px; text-decoration: none; letter-spacing: -0.01em;">
              Download Your Guide →
            </a>
            <p style="font-size: 11px; color: #999; margin: 12px 0 0;">PDF · Free · No strings</p>
          </div>

          <div style="background: #F7F8FA; border-radius: 12px; padding: 20px; margin: 0 0 24px; text-align: center;">
            <p style="font-size: 13px; font-weight: 700; color: #1a1a1a; margin: 0 0 10px;">While you wait for Thursday's issue...</p>
            <a href="${siteUrl}/newsletter" style="display: inline-block; background: #1a1a1a; color: white; font-weight: 700; font-size: 13px; padding: 10px 22px; border-radius: 8px; text-decoration: none;">
              Read the Latest Issue →
            </a>
          </div>

          <div style="border: 1px solid #eee; border-radius: 12px; padding: 20px; margin: 0 0 24px;">
            <p style="font-size: 14px; font-weight: 700; color: #1a1a1a; margin: 0 0 6px;">🎁 Refer a friend, unlock more</p>
            <p style="font-size: 13px; color: #666; margin: 0 0 10px;">Share your link and get bonus Tampa guides + giveaway entries:</p>
            <p style="font-size: 13px; color: #444; margin: 0 0 3px;">1 referral Tampa Neighborhoods Guide + First-Timer's Checklist (PDFs)</p>
            <p style="font-size: 13px; color: #444; margin: 0 0 3px;">5 referrals Dinner for 2 at Bern&apos;s Steak House ($250)</p>
            <p style="font-size: 13px; color: #444; margin: 0 0 14px;">10+ referrals $250 gift card &amp; iPad giveaway</p>
            <p style="font-size: 13px; font-weight: 600; color: #FF5A36; margin: 0;">Your link: <a href="${referralLink}" style="color: #FF5A36;">${referralLink}</a></p>
          </div>

          <div style="background: linear-gradient(135deg, #405DE6, #833AB4, #E1306C, #F77737); border-radius: 12px; padding: 3px; margin: 0 0 28px;">
            <div style="background: #ffffff; border-radius: 10px; padding: 20px; text-align: center;">
              <p style="font-size: 14px; font-weight: 700; color: #1a1a1a; margin: 0 0 6px;">Daily Tampa updates between newsletters</p>
              <p style="font-size: 13px; color: #666; margin: 0 0 14px;">New openings, events, and local news the stuff that can't wait until Thursday.</p>
              <a href="https://instagram.com/thetampapulse" style="display: inline-block; background: #1a1a1a; color: white; font-weight: 700; font-size: 13px; padding: 10px 22px; border-radius: 8px; text-decoration: none;">
                Follow @thetampapulse →
              </a>
            </div>
          </div>

          <p style="font-size: 15px; line-height: 1.7; color: #444; margin-bottom: 0;">See you Thursday.</p>
          <p style="font-size: 15px; font-weight: 700; color: #1a1a1a; margin-top: 4px;"> Marv</p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;" />
          <p style="font-size: 11px; color: #999; text-align: center;">
            <a href="${unsubscribeUrl}" style="color: #999; text-decoration: underline;">Unsubscribe</a>
            &nbsp;&middot;&nbsp; Tampa Bay, FL
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, ref: data.id });
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
