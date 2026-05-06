import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

// GET /api/auth/sub?token=xxx&to=/newsletter/5
// Validates subscriber token, sets a 30-day httpOnly cookie, and redirects.
// Used by newsletter email CTAs and magic links so any device the subscriber
// clicks from gets full archive access without a password.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  // Only allow relative redirect targets to prevent open-redirect abuse
  const to = url.searchParams.get("to") || "/newsletter";
  const redirectPath = to.startsWith("/") ? to : "/newsletter";

  const redirectUrl = new URL(redirectPath, req.url);

  if (!token) {
    return NextResponse.redirect(redirectUrl);
  }

  const { data } = await supabase
    .from("subscribers")
    .select("id")
    .eq("unsubscribe_token", token)
    .eq("status", "active")
    .maybeSingle();

  const response = NextResponse.redirect(redirectUrl);

  if (data) {
    // 30-day subscriber cookie — httpOnly so JS can't touch it
    response.cookies.set("sp_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
  }

  return response;
}
