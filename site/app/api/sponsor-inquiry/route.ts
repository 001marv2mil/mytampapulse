import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { escapeHtml, isValidEmail, sanitizeEmailSubject, parseSafeJson, rateLimit } from "@/lib/security";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  // Rate limit: email-sending route — 3 submissions per minute per IP
  const limited = await rateLimit(req, "email");
  if (limited) return limited;

  const parsed = await parseSafeJson(req, 5_000);
  if ("error" in parsed) return parsed.error;

  const { name, business, email, package: pkg, message } = parsed.data;

  // Validate required fields
  if (!name || typeof name !== "string" || name.trim().length < 1) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!business || typeof business !== "string" || business.trim().length < 1) {
    return NextResponse.json({ error: "Business name is required" }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  // Sanitize all user inputs — prevent HTML/header injection in emails
  const safeName     = escapeHtml(String(name).trim().substring(0, 100));
  const safeBusiness = escapeHtml(String(business).trim().substring(0, 100));
  const safeEmail    = String(email).trim().toLowerCase();
  const safePkg      = pkg ? escapeHtml(String(pkg).substring(0, 100)) : null;
  const safeMessage  = message ? escapeHtml(String(message).substring(0, 2000)) : null;
  const safeSubject  = sanitizeEmailSubject(`New sponsor inquiry from ${safeBusiness}`);

  try {
    // Save to Supabase
    const { error } = await supabase.from("sponsor_inquiries").insert({
      name:     safeName,
      business: safeBusiness,
      email:    safeEmail,
      package:  safePkg,
      message:  safeMessage,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Failed to save inquiry" }, { status: 500 });
    }

    // Notify site owner
    const notifyEmail = process.env.SPONSOR_NOTIFY_EMAIL;
    if (notifyEmail && isValidEmail(notifyEmail)) {
      await resend.emails.send({
        from: "Tampa Pulse <newsletter@mytampapulse.com>",
        to: notifyEmail,
        subject: safeSubject,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px; color: #1a1a1a;">
            <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 20px;">New Sponsor Inquiry</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 8px 0; color: #888; width: 120px;">Name</td><td style="padding: 8px 0; font-weight: 600;">${safeName}</td></tr>
              <tr><td style="padding: 8px 0; color: #888;">Business</td><td style="padding: 8px 0; font-weight: 600;">${safeBusiness}</td></tr>
              <tr><td style="padding: 8px 0; color: #888;">Email</td><td style="padding: 8px 0;"><a href="mailto:${safeEmail}" style="color: #FF5A36;">${safeEmail}</a></td></tr>
              <tr><td style="padding: 8px 0; color: #888;">Package</td><td style="padding: 8px 0;">${safePkg ?? "Not specified"}</td></tr>
              <tr><td style="padding: 8px 0; color: #888; vertical-align: top;">Message</td><td style="padding: 8px 0;">${safeMessage ?? "No message"}</td></tr>
            </table>
            <p style="font-size: 12px; color: #999; margin-top: 24px;">Reply directly to ${safeEmail} to follow up.</p>
          </div>
        `,
      });
    }

    // Confirmation to the sponsor
    await resend.emails.send({
      from: "Tampa Pulse <newsletter@mytampapulse.com>",
      to: safeEmail,
      subject: "We got your inquiry — Tampa Pulse Sponsorship",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="font-size: 28px; font-weight: 900; color: #1a1a1a;">tampa<span style="color: #FF5A36;">pulse</span></span>
          </div>
          <h1 style="font-size: 22px; font-weight: 800; margin-bottom: 16px;">Hey ${safeName},</h1>
          <p style="font-size: 15px; line-height: 1.7; color: #444;">
            We got your sponsorship inquiry for <strong>${safeBusiness}</strong>. We're pumped you're interested.
          </p>
          <p style="font-size: 15px; line-height: 1.7; color: #444;">
            We'll get back to you within 24 hours to talk about availability, timing, and how we can make your business look great in front of Tampa's most engaged audience.
          </p>
          <div style="background: #FFF5F0; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <p style="font-size: 13px; color: #666; margin: 0;"><strong>Package interest:</strong> ${safePkg ?? "TBD"}</p>
          </div>
          <p style="font-size: 15px; line-height: 1.7; color: #444;">Talk soon.</p>
          <p style="font-size: 15px; font-weight: 700; color: #1a1a1a; margin-top: 4px;">— The Tampa Pulse Team</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;" />
          <p style="font-size: 11px; color: #999; text-align: center;">Tampa Bay, FL</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Sponsor inquiry error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
