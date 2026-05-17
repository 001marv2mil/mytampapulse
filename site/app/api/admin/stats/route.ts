import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/admin/stats?secret=CRON_SECRET
// Returns live subscriber counts + share analytics.
// Protected by the same CRON_SECRET used for the newsletter send.
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalActive },
    { count: new7d },
    { count: new30d },
    { count: totalUnsub },
    { data: shareEvents },
    { count: totalReferrals },
    { data: topReferrers },
  ] = await Promise.all([
    supabase.from("subscribers").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("subscribers").select("*", { count: "exact", head: true }).eq("status", "active").gte("created_at", sevenDaysAgo),
    supabase.from("subscribers").select("*", { count: "exact", head: true }).eq("status", "active").gte("created_at", thirtyDaysAgo),
    supabase.from("subscribers").select("*", { count: "exact", head: true }).eq("status", "unsubscribed"),
    supabase.from("share_events").select("share_method, share_cta, issue_number, created_at").order("created_at", { ascending: false }),
    supabase.from("referrals").select("*", { count: "exact", head: true }),
    supabase.from("subscribers").select("email, referral_count").gt("referral_count", 0).order("referral_count", { ascending: false }).limit(10),
  ]);

  // Aggregate share events
  const byMethod: Record<string, number> = {};
  const byCta: Record<string, number> = {};
  const byIssue: Record<string, number> = {};

  for (const e of (shareEvents ?? [])) {
    byMethod[e.share_method] = (byMethod[e.share_method] ?? 0) + 1;
    if (e.share_cta) byCta[e.share_cta] = (byCta[e.share_cta] ?? 0) + 1;
    const key = `issue_${e.issue_number}`;
    byIssue[key] = (byIssue[key] ?? 0) + 1;
  }

  return NextResponse.json({
    subscribers: {
      active: totalActive ?? 0,
      new7d: new7d ?? 0,
      new30d: new30d ?? 0,
      unsubscribed: totalUnsub ?? 0,
    },
    referrals: {
      total: totalReferrals ?? 0,
      top: (topReferrers ?? []).map((r) => ({ email: r.email, count: r.referral_count })),
    },
    shares: {
      total: (shareEvents ?? []).length,
      byMethod,
      byCta,
      byIssue,
      recent: (shareEvents ?? []).slice(0, 20),
    },
    generatedAt: new Date().toISOString(),
  });
}
