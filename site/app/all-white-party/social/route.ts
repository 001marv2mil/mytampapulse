import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getTier } from "@/lib/all-white-party";
import { corsHeaders } from "@/lib/awp-ticketing";

export const dynamic = "force-dynamic";

/** "Diana mcfarlane" -> "Diana M." — enough to be real, anonymous enough to be safe. */
function anonymize(name: string | null): string {
  if (!name?.trim()) return "Someone";
  const parts = name.trim().split(/\s+/);
  const first = parts[0][0].toUpperCase() + parts[0].slice(1).toLowerCase();
  const lastInitial = parts.length > 1 ? ` ${parts[parts.length - 1][0].toUpperCase()}.` : "";
  return `${first}${lastInitial}`;
}

// Public social proof: total sold + anonymized recent purchases.
export async function GET(req: NextRequest) {
  const headers = corsHeaders(req.headers.get("origin"));
  try {
    const [{ count }, { data: recentTickets }] = await Promise.all([
      supabaseAdmin.from("awp_tickets").select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("awp_tickets")
        .select("tier, guest_name, created_at, session_id")
        .order("created_at", { ascending: false })
        .limit(12),
    ]);

    // One entry per order (so a 3-ticket buy shows once, as "grabbed 3 tickets")
    const seen = new Set<string>();
    const recent: { name: string; tier: string; at: string }[] = [];
    for (const t of recentTickets ?? []) {
      if (seen.has(t.session_id)) continue;
      seen.add(t.session_id);
      recent.push({
        name: anonymize(t.guest_name),
        tier: getTier(t.tier)?.name ?? t.tier,
        at: t.created_at,
      });
      if (recent.length >= 6) break;
    }

    return NextResponse.json({ totalSold: count ?? 0, recent }, { headers });
  } catch {
    return NextResponse.json({ totalSold: 0, recent: [] }, { headers });
  }
}
