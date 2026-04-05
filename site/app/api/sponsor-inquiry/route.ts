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
    const body = await req.json();
    const { name, business, email, package: pkg, message } = body;

    if (!name || !business || !email) {
      return NextResponse.json({ error: "Name, business, and email are required" }, { status: 400 });
    }

    // Save to Supabase
    const { error } = await supabase.from("sponsor_inquiries").insert({
      name,
      business,
      email,
      package: pkg,
      message,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Failed to save inquiry" }, { status: 500 });
    }

    // Notify site owner (if configured)
    const notifyEmail = process.env.SPONSOR_NOTIFY_EMAIL;
    if (notifyEmail) {
      await resend.emails.send({
        from: "Tampa Pulse <newsletter@mytampapulse.com>",
        to: notifyEmail,
        subject: `New sponsor inquiry from ${business}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px; color: #1a1a1a;">
            <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 20px;">New Sponsor Inquiry</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 8px 0; color: #888; width: 120px;">Name</td><td style="padding: 8px 0; font-weight: 600;">${name}</td></tr>
              <tr><td style="padding: 8px 0; color: #888;">Business</td><td style="padding: 8px 0; font-weight: 600;">${business}</td></tr>
              <tr><td style="padding: 8px 0; color: #888;">Email</td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #FF5A36;">${email}</a></td></tr>
              <tr><td style="padding: 8px 0; color: #888;">Package</td><td style="padding: 8px 0;">${pkg || "Not specified"}</td></tr>
              <tr><td style="padding: 8px 0; color: #888; vertical-align: top;">Message</td><td style="padding: 8px 0;">${message || "No message"}</td></tr>
            </table>
            <p style="font-size: 12px; color: #999; margin-top: 24px;">Reply directly to ${email} to follow up.</p>
          </div>
        `,
      });
    }

    // Send confirmation to the sponsor
    await resend.emails.send({
      from: "Tampa Pulse <newsletter@mytampapulse.com>",
      to: email,
      subject: "We got your inquiry — Tampa Pulse Sponsorship",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="font-size: 28px; font-weight: 900; color: #1a1a1a;">tampa<span style="color: #FF5A36;">pulse</span></span>
          </div>

          <h1 style="font-size: 22px; font-weight: 800; margin-bottom: 16px;">Hey ${name},</h1>

          <p style="font-size: 15px; line-height: 1.7; color: #444;">
            We got your sponsorship inquiry for <strong>${business}</strong>. We're pumped you're interested.
          </p>

          <p style="font-size: 15px; line-height: 1.7; color: #444;">
            We'll get back to you within 24 hours to talk about availability, timing, and how we can make your business look great in front of Tampa's most engaged audience.
          </p>

          <div style="background: #FFF5F0; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <p style="font-size: 13px; color: #666; margin: 0;"><strong>Package interest:</strong> ${pkg || "TBD"}</p>
          </div>

          <p style="font-size: 15px; line-height: 1.7; color: #444;">
            Talk soon.
          </p>
          <p style="font-size: 15px; font-weight: 700; color: #1a1a1a; margin-top: 4px;">
            — The Tampa Pulse Team
          </p>

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
