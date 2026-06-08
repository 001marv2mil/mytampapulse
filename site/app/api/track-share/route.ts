import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/security";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

const ALLOWED_METHODS = ["copy_link", "twitter", "sms", "native", "email"] as const;
const ALLOWED_CTAS    = ["referral_section", "header", "email_cta"] as const;

// POST /api/track-share
// Body: { subscriberId?, issueNumber, method, cta?, referralUrl? }
export async function POST(req: NextRequest) {
  // Rate limit: 20 per minute per IP (standard)
  const limited = await rateLimit(req, "standard");
  if (limited) return limited;

  try {
    const body = await req.json();
    const { subscriberId, issueNumber, method, cta, referralUrl } = body;

    // Validate issueNumber — must be a positive integer
    const issueNum = Number(issueNumber);
    if (!Number.isInteger(issueNum) || issueNum < 1 || issueNum > 9999) {
      return NextResponse.json({ error: "Invalid issueNumber" }, { status: 400 });
    }

    // Validate method — must be from the allowed list
    if (!method || !ALLOWED_METHODS.includes(method)) {
      return NextResponse.json({ error: "Invalid share method" }, { status: 400 });
    }

    // Validate optional fields
    const safeCta = cta && ALLOWED_CTAS.includes(cta) ? cta : null;
    const safeReferralUrl =
      referralUrl && typeof referralUrl === "string" && referralUrl.length <= 500
        ? referralUrl
        : null;

    const { error } = await supabase.from("share_events").insert({
      subscriber_id: subscriberId && typeof subscriberId === "string" ? subscriberId : null,
      issue_number:  issueNum,
      share_method:  method,
      share_cta:     safeCta,
      referral_url:  safeReferralUrl,
    });

    if (error) {
      console.error("track-share insert error:", error);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("track-share error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
