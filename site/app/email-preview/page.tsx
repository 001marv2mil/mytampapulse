"use client";
import { useState } from "react";

const siteUrl = "https://mytampapulse.com";
const referralLink = `${siteUrl}?ref=example-id`;
const unsubscribeUrl = `${siteUrl}/unsubscribe?token=example-token`;
const newCount = 3;

const emails: Record<string, { subject: string; html: string }> = {
  welcome: {
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
          &nbsp;·&nbsp; Tampa Bay, FL
        </p>
      </div>
    `,
  },
  referral: {
    subject: "Someone signed up with your link 🎉 Here's your Tampa bundle",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="font-size: 28px; font-weight: 900;">tampa<span style="color: #FF5A36;">pulse</span></span>
        </div>
        <h1 style="font-size: 22px; font-weight: 800; margin-bottom: 12px;">You got a referral. 🙌</h1>
        <p style="font-size: 15px; line-height: 1.7; color: #444;">
          Someone just signed up using your link. You now have <strong>${newCount} referrals</strong>.
        </p>
        <p style="font-size: 15px; line-height: 1.7; color: #444;">
          Here's your Tampa bundle — three guides, pick whichever hits for you:
        </p>
        <div style="margin: 28px 0;">
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
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;" />
        <p style="font-size: 11px; color: #999; text-align: center;">
          <a href="${unsubscribeUrl}" style="color: #999; text-decoration: underline;">Unsubscribe</a>
          &nbsp;·&nbsp; Tampa Bay, FL
        </p>
      </div>
    `,
  },
  milestone_5: {
    subject: "🏆 You hit 5 referrals — you've been entered for a Tampa restaurant voucher",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="font-size: 28px; font-weight: 900;">tampa<span style="color: #FF5A36;">pulse</span></span>
        </div>
        <div style="background: #FFF5F0; border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 32px;">
          <p style="font-size: 40px; margin: 0 0 8px;">🏆</p>
          <h1 style="font-size: 22px; font-weight: 900; margin: 0 0 8px;">You hit 5 referrals.</h1>
          <p style="font-size: 16px; color: #FF5A36; font-weight: 700; margin: 0;">You've been entered for a Tampa restaurant voucher.</p>
        </div>
        <p style="font-size: 15px; line-height: 1.7; color: #444;">
          That's 5 people who signed up because of you. Seriously — thank you.
        </p>
        <p style="font-size: 15px; line-height: 1.7; color: #444;">
          You're now entered for <strong>dinner for two at a local Tampa spot</strong>. We'll reach out directly when winners are picked.
        </p>
        <p style="font-size: 15px; line-height: 1.7; color: #444;">
          Keep going — the next milestone unlocks an even bigger reward.
        </p>
        <div style="border: 1px solid #eee; border-radius: 12px; padding: 20px; margin: 28px 0;">
          <p style="font-size: 13px; font-weight: 700; color: #1a1a1a; margin: 0 0 6px;">Your referral link</p>
          <p style="font-size: 13px; color: #FF5A36; margin: 0;"><a href="${referralLink}" style="color: #FF5A36;">${referralLink}</a></p>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;" />
        <p style="font-size: 11px; color: #999; text-align: center;">
          <a href="${unsubscribeUrl}" style="color: #999; text-decoration: underline;">Unsubscribe</a>
          &nbsp;·&nbsp; Tampa Bay, FL
        </p>
      </div>
    `,
  },
  milestone_10: {
    subject: "🏆 You hit 10 referrals — you've been entered for a $100 Tampa Bay gift card",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="font-size: 28px; font-weight: 900;">tampa<span style="color: #FF5A36;">pulse</span></span>
        </div>
        <div style="background: #FFF5F0; border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 32px;">
          <p style="font-size: 40px; margin: 0 0 8px;">🏆</p>
          <h1 style="font-size: 22px; font-weight: 900; margin: 0 0 8px;">You hit 10 referrals.</h1>
          <p style="font-size: 16px; color: #FF5A36; font-weight: 700; margin: 0;">You've been entered for a $100 Tampa Bay gift card.</p>
        </div>
        <p style="font-size: 15px; line-height: 1.7; color: #444;">
          That's 10 people who signed up because of you. You're building something real here.
        </p>
        <p style="font-size: 15px; line-height: 1.7; color: #444;">
          You're now entered for <strong>$100 to spend anywhere in Tampa Bay</strong>. We'll reach out directly when winners are picked.
        </p>
        <p style="font-size: 15px; line-height: 1.7; color: #444;">
          Keep going — at 25 referrals you're in for the iPad giveaway.
        </p>
        <div style="border: 1px solid #eee; border-radius: 12px; padding: 20px; margin: 28px 0;">
          <p style="font-size: 13px; font-weight: 700; color: #1a1a1a; margin: 0 0 6px;">Your referral link</p>
          <p style="font-size: 13px; color: #FF5A36; margin: 0;"><a href="${referralLink}" style="color: #FF5A36;">${referralLink}</a></p>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;" />
        <p style="font-size: 11px; color: #999; text-align: center;">
          <a href="${unsubscribeUrl}" style="color: #999; text-decoration: underline;">Unsubscribe</a>
          &nbsp;·&nbsp; Tampa Bay, FL
        </p>
      </div>
    `,
  },
  milestone_25: {
    subject: "🏆 You hit 25 referrals — you've been entered for the iPad giveaway",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="font-size: 28px; font-weight: 900;">tampa<span style="color: #FF5A36;">pulse</span></span>
        </div>
        <div style="background: #FFF5F0; border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 32px;">
          <p style="font-size: 40px; margin: 0 0 8px;">🏆</p>
          <h1 style="font-size: 22px; font-weight: 900; margin: 0 0 8px;">You hit 25 referrals.</h1>
          <p style="font-size: 16px; color: #FF5A36; font-weight: 700; margin: 0;">You're entered for the iPad giveaway.</p>
        </div>
        <p style="font-size: 15px; line-height: 1.7; color: #444;">
          25 people. That's a whole squad that found Tampa Pulse because of you.
        </p>
        <p style="font-size: 15px; line-height: 1.7; color: #444;">
          You're now entered to <strong>win an iPad</strong> — winner announced monthly. We'll reach out directly if you win.
        </p>
        <div style="border: 1px solid #eee; border-radius: 12px; padding: 20px; margin: 28px 0;">
          <p style="font-size: 13px; font-weight: 700; color: #1a1a1a; margin: 0 0 6px;">Your referral link</p>
          <p style="font-size: 13px; color: #FF5A36; margin: 0;"><a href="${referralLink}" style="color: #FF5A36;">${referralLink}</a></p>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;" />
        <p style="font-size: 11px; color: #999; text-align: center;">
          <a href="${unsubscribeUrl}" style="color: #999; text-decoration: underline;">Unsubscribe</a>
          &nbsp;·&nbsp; Tampa Bay, FL
        </p>
      </div>
    `,
  },
};

const labels: Record<string, string> = {
  welcome: "Welcome Email",
  referral: "Referral Reward (PDFs)",
  milestone_5: "Milestone — 5 Referrals",
  milestone_10: "Milestone — 10 Referrals",
  milestone_25: "Milestone — 25 Referrals",
};

export default function EmailPreview() {
  const [active, setActive] = useState("welcome");

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", minHeight: "100vh", background: "#f5f5f5" }}>
      <div style={{ background: "#1a1a1a", padding: "16px 24px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ color: "white", fontWeight: 700, marginRight: 8 }}>Email Preview</span>
        {Object.keys(emails).map((key) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            style={{
              background: active === key ? "#FF5A36" : "#333",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "6px 14px",
              fontSize: 13,
              cursor: "pointer",
              fontWeight: active === key ? 700 : 400,
            }}
          >
            {labels[key]}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 640, margin: "32px auto", background: "white", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
        <div style={{ background: "#f9f9f9", borderBottom: "1px solid #eee", padding: "12px 20px" }}>
          <p style={{ margin: 0, fontSize: 13, color: "#666" }}>
            <strong style={{ color: "#1a1a1a" }}>Subject:</strong> {emails[active].subject}
          </p>
        </div>
        <div dangerouslySetInnerHTML={{ __html: emails[active].html }} />
      </div>
    </div>
  );
}
