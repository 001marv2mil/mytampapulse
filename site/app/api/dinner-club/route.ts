import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { isValidEmail } from "@/lib/security";
import { NEXT_DINNER_DATE, prettyDinnerDate } from "@/lib/dinner-club";

// Service role key required: RLS is enabled on dinner_club_signups so the anon
// key can never read other people's emails.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, firstName, neighborhood, diningStyle, dietary, ageRange, notes } = body;

    if (!email || typeof email !== "string" || !isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const clean = email.trim().toLowerCase();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mytampapulse.com";

    // Link to an existing subscriber when we recognize them.
    const { data: subscriber } = await supabase
      .from("subscribers")
      .select("id")
      .eq("email", clean)
      .maybeSingle();

    const { error } = await supabase.from("dinner_club_signups").upsert(
      {
        email: clean,
        first_name: typeof firstName === "string" ? firstName.slice(0, 80) : null,
        dinner_date: NEXT_DINNER_DATE,
        neighborhood: typeof neighborhood === "string" ? neighborhood.slice(0, 60) : null,
        dining_style: typeof diningStyle === "string" ? diningStyle.slice(0, 60) : null,
        dietary: typeof dietary === "string" ? dietary.slice(0, 200) : null,
        age_range: typeof ageRange === "string" ? ageRange.slice(0, 20) : null,
        notes: typeof notes === "string" ? notes.slice(0, 500) : null,
        subscriber_id: subscriber?.id ?? null,
        status: "pending",
      },
      { onConflict: "email,dinner_date" }
    );

    if (error) {
      console.error("Dinner club signup error:", error);
      return NextResponse.json({ error: "Could not save your seat. Try again in a moment." }, { status: 500 });
    }

    // Confirmation email. Never let a mail failure block the signup.
    try {
      const pretty = prettyDinnerDate();
      await resend.emails.send({
        from: "Tampa Pulse <newsletter@mytampapulse.com>",
        to: clean,
        subject: `You're in for Tampa Pulse Dinner Club, ${pretty}`,
        html: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:28px;color:#222;">
  <h1 style="font-size:24px;font-weight:800;color:#1a1a1a;margin:0 0 12px;">Your seat is saved 🍽️</h1>
  <p style="font-size:15px;line-height:1.6;color:#454b54;margin:0 0 16px;">
    You're on the list for <strong>Tampa Pulse Dinner Club</strong> on <strong>${pretty}</strong>.
  </p>
  <p style="font-size:15px;line-height:1.6;color:#454b54;margin:0 0 16px;">
    Here's how it works: we seat you with five other Tampa Bay locals you haven't met. You find out the restaurant
    the morning of. You show up, order, and talk to strangers. That's the whole thing.
  </p>
  <p style="font-size:15px;line-height:1.6;color:#454b54;margin:0 0 24px;">
    We'll email you the restaurant and your table the morning of. If your plans change, just reply to this email so we can free the seat.
  </p>
  <a href="${siteUrl}/dinner-club" style="display:inline-block;background:#FF5A36;color:#fff;font-weight:700;font-size:14px;padding:12px 26px;border-radius:8px;text-decoration:none;">Dinner Club details →</a>
  <p style="font-size:12px;color:#999;margin:28px 0 0;">Tampa Pulse. The Bay, Simplified.</p>
</div>`.trim(),
      });
    } catch (mailErr) {
      console.error("Dinner club confirmation email failed:", mailErr);
    }

    return NextResponse.json({ success: true, dinnerDate: NEXT_DINNER_DATE });
  } catch (err) {
    console.error("Dinner club route error:", err);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
