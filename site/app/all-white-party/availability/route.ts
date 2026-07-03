import { NextRequest, NextResponse } from "next/server";
import { corsHeaders, getAvailability } from "@/lib/awp-ticketing";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}

// Live remaining-ticket counts per tier, read by the ticket page on load.
export async function GET(req: NextRequest) {
  const headers = corsHeaders(req.headers.get("origin"));
  try {
    const availability = await getAvailability();
    return NextResponse.json({ tiers: availability }, { headers });
  } catch {
    // If the DB is unreachable, don't block sales — report everything open.
    return NextResponse.json({ tiers: null }, { headers });
  }
}
