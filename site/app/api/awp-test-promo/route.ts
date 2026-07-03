import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Admin: creates a one-time 100%-off promo code so the full purchase flow can
// be smoke-tested without spending money. CRON_SECRET-guarded.
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json({ error: "STRIPE_SECRET_KEY is not set." }, { status: 500 });
  }

  const stripe = new Stripe(key);

  // Deactivate any previous test codes so they can't linger
  const existing = await stripe.promotionCodes.list({ code: "PULSETEST", limit: 10 });
  for (const pc of existing.data) {
    if (pc.active) await stripe.promotionCodes.update(pc.id, { active: false });
  }

  const coupon = await stripe.coupons.create({
    percent_off: 100,
    duration: "once",
    name: "AWP smoke test (100% off)",
  });

  const promo = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code: "PULSETEST",
    max_redemptions: 1,
  });

  return NextResponse.json({ code: promo.code, maxRedemptions: promo.max_redemptions });
}
