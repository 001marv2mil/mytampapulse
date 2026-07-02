import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  EVENT,
  FEES,
  MAX_PER_TIER,
  computeFeeCents,
  getTier,
  isSoldOut,
  tierRemaining,
} from "@/lib/all-white-party";

// Origins allowed to call this endpoint (includes the developer's GitHub Pages site)
const ALLOWED_ORIGINS = [
  "https://mytampapulse.com",
  "https://www.mytampapulse.com",
  "https://cyphr10.github.io",
  "http://localhost:3000",
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = ALLOWED_ORIGINS.includes(origin ?? "") ? (origin as string) : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// Handle CORS preflight
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Checkout is not configured yet." },
      { status: 500, headers }
    );
  }

  const stripe = new Stripe(secretKey);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400, headers });
  }

  const items = (body as { items?: { id?: string; qty?: number }[] })?.items;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Please select at least one ticket." }, { status: 400, headers });
  }

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  let subtotalCents = 0;
  let ticketCount = 0;

  for (const item of items) {
    const tier = getTier(String(item?.id));
    if (!tier) {
      return NextResponse.json({ error: `Unknown ticket type: ${item?.id}` }, { status: 400, headers });
    }
    if (isSoldOut(tier)) {
      return NextResponse.json({ error: `${tier.name} is sold out.` }, { status: 400, headers });
    }

    const qty = Math.floor(Number(item?.qty));
    if (!Number.isFinite(qty) || qty < 1 || qty > MAX_PER_TIER) {
      return NextResponse.json(
        { error: `Quantity for ${tier.name} must be between 1 and ${MAX_PER_TIER}.` },
        { status: 400, headers }
      );
    }

    const remaining = tierRemaining(tier);
    if (remaining !== null && qty > remaining) {
      return NextResponse.json(
        { error: `Only ${remaining} ${tier.name} ticket${remaining === 1 ? "" : "s"} left.` },
        { status: 409, headers }
      );
    }

    subtotalCents += tier.priceCents * qty;
    ticketCount += qty;

    if (tier.stripePriceId) {
      line_items.push({ quantity: qty, price: tier.stripePriceId });
    } else {
      line_items.push({
        quantity: qty,
        price_data: {
          currency: EVENT.currency,
          unit_amount: tier.priceCents,
          product_data: {
            name: `${EVENT.name} — ${tier.name}`,
            description: tier.blurb,
          },
        },
      });
    }
  }

  const feeCents = computeFeeCents(subtotalCents, ticketCount);
  if (feeCents > 0) {
    line_items.push({
      quantity: 1,
      price_data: {
        currency: EVENT.currency,
        unit_amount: feeCents,
        product_data: {
          name: FEES.label,
          description: `Booking & processing fee for ${ticketCount} ticket${ticketCount > 1 ? "s" : ""}`,
        },
      },
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      submit_type: "pay",
      line_items,
      allow_promotion_codes: true,
      success_url: `https://mytampapulse.com/all-white-party/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: ALLOWED_ORIGINS.includes(origin ?? "")
        ? `${origin}/all-white-rnb/`
        : `https://mytampapulse.com/all-white-party?canceled=1`,
      phone_number_collection: { enabled: true },
      billing_address_collection: "auto",
      custom_text: { submit: { message: EVENT.dressCode } },
      metadata: { event: EVENT.name },
    });

    return NextResponse.json({ url: session.url }, { headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not start checkout.";
    return NextResponse.json({ error: message }, { status: 502, headers });
  }
}
