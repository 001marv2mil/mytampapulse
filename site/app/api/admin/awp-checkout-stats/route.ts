import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { EVENT } from "@/lib/all-white-party";

// GET /api/admin/awp-checkout-stats?secret=CRON_SECRET&hours=24
// Diagnoses funnel drop-off: how many Stripe checkout sessions were started
// for this event vs completed vs abandoned, in the last N hours.
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
  }
  const stripe = new Stripe(secretKey);

  const hours = Number(req.nextUrl.searchParams.get("hours")) || 24;
  const sinceUnix = Math.floor(Date.now() / 1000) - hours * 3600;

  let complete = 0;
  let open = 0;
  let expired = 0;
  let other = 0;

  let startingAfter: string | undefined;
  for (;;) {
    const page: Stripe.Response<Stripe.ApiList<Stripe.Checkout.Session>> =
      await stripe.checkout.sessions.list({
        created: { gte: sinceUnix },
        limit: 100,
        starting_after: startingAfter,
      });

    for (const s of page.data) {
      if (s.metadata?.event !== EVENT.name) continue;
      if (s.status === "complete") complete++;
      else if (s.status === "open") open++;
      else if (s.status === "expired") expired++;
      else other++;
    }

    if (!page.has_more || page.data.length === 0) break;
    startingAfter = page.data[page.data.length - 1].id;
  }

  const started = complete + open + expired + other;
  return NextResponse.json({
    windowHours: hours,
    started,
    completed: complete,
    abandoned: expired,
    stillOpen: open,
    other,
    completionRate: started > 0 ? `${((complete / started) * 100).toFixed(1)}%` : "n/a",
  });
}
