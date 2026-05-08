import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

// POST /api/track-share
// Body: { subscriberId?, issueNumber, method, cta?, referralUrl? }
// Logs every share action so Marv can see what's driving referrals.
//
// method values: copy_link | twitter | sms | native | email
// cta values:    referral_section | header | email_cta
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscriberId, issueNumber, method, cta, referralUrl } = body;

    if (!issueNumber || !method) {
      return NextResponse.json(
        { error: "issueNumber and method are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("share_events").insert({
      subscriber_id: subscriberId || null,
      issue_number: Number(issueNumber),
      share_method: String(method),
      share_cta: cta ? String(cta) : null,
      referral_url: referralUrl ? String(referralUrl) : null,
    });

    if (error) {
      // Log but don't fail the share action
      console.error("track-share insert error:", error);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("track-share error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
