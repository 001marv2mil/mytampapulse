import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// One-time admin endpoint: registers the Stripe webhook for e-ticket issuing.
// Runs in production where STRIPE_SECRET_KEY lives (it's a sensitive env var
// that can't be pulled locally). Guarded by CRON_SECRET.
// Must be the www host: the apex domain 307-redirects to www and Stripe does
// NOT follow redirects on webhook deliveries — it just marks them failed.
const WEBHOOK_URL = "https://www.mytampapulse.com/api/awp-stripe-webhook";

// Diagnostic: recent completed-checkout events (id, payment status, email) so a
// missed webhook delivery can be found and replayed.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json({ error: "STRIPE_SECRET_KEY is not set." }, { status: 500 });
  }
  const stripe = new Stripe(key);
  const events = await stripe.events.list({ type: "checkout.session.completed", limit: 10 });
  return NextResponse.json({
    sessions: events.data.map((e) => {
      const s = e.data.object as Stripe.Checkout.Session;
      return {
        sessionId: s.id,
        created: new Date(e.created * 1000).toISOString(),
        paymentStatus: s.payment_status,
        amountTotal: s.amount_total,
        email: s.customer_details?.email ?? null,
        items: s.metadata?.items ?? null,
      };
    }),
  });
}

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
    // Match any host variant (www / apex) of this endpoint path
    if (ep.url.includes("/api/awp-stripe-webhook")) {
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
