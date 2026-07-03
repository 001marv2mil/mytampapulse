import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// One-time admin endpoint: registers the Stripe webhook for e-ticket issuing.
// Runs in production where STRIPE_SECRET_KEY lives (it's a sensitive env var
// that can't be pulled locally). Guarded by CRON_SECRET.
const WEBHOOK_URL = "https://mytampapulse.com/api/awp-stripe-webhook";

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json({ error: "STRIPE_SECRET_KEY is not set." }, { status: 500 });
  }

  const stripe = new Stripe(key);

  // Replace any previous endpoint for this URL — the signing secret is only
  // revealed at creation time.
  const removed: string[] = [];
  const existing = await stripe.webhookEndpoints.list({ limit: 100 });
  for (const ep of existing.data) {
    if (ep.url === WEBHOOK_URL) {
      await stripe.webhookEndpoints.del(ep.id);
      removed.push(ep.id);
    }
  }

  const endpoint = await stripe.webhookEndpoints.create({
    url: WEBHOOK_URL,
    enabled_events: ["checkout.session.completed"],
    description: "All White R&B Rooftop — e-ticket issuing",
  });

  return NextResponse.json({
    id: endpoint.id,
    secret: endpoint.secret,
    mode: key.startsWith("sk_live_") ? "live" : "test",
    removed,
  });
}
