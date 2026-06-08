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

// Creates a Stripe Checkout Session for the All White Party.
// Prices are looked up server-side from lib/all-white-party.ts — the client
// only sends { id, qty }, never amounts.
export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Checkout is not configured yet. Add STRIPE_SECRET_KEY to .env.local." },
      { status: 500 }
    );
  }

  const stripe = new Stripe(secretKey);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const items = (body as { items?: { id?: string; qty?: number }[] })?.items;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Please select at least one ticket." }, { status: 400 });
  }

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  let subtotalCents = 0;
  let ticketCount = 0;

  for (const item of items) {
    const tier = getTier(String(item?.id));
    if (!tier) {
      return NextResponse.json({ error: `Unknown ticket type: ${item?.id}` }, { status: 400 });
    }
    if (isSoldOut(tier)) {
      return NextResponse.json({ error: `${tier.name} is sold out.` }, { status: 400 });
    }

    const qty = Math.floor(Number(item?.qty));
    if (!Number.isFinite(qty) || qty < 1 || qty > MAX_PER_TIER) {
      return NextResponse.json(
        { error: `Quantity for ${tier.name} must be between 1 and ${MAX_PER_TIER}.` },
        { status: 400 }
      );
    }

    // Don't let anyone buy more than what's actually left in the tier.
    const remaining = tierRemaining(tier);
    if (remaining !== null && qty > remaining) {
      return NextResponse.json(
        { error: `Only ${remaining} ${tier.name} ticket${remaining === 1 ? "" : "s"} left.` },
        { status: 409 }
      );
    }

    subtotalCents += tier.priceCents * qty;
    ticketCount += qty;

    if (tier.stripePriceId) {
      // Use the official Stripe catalog Price (created by the products script)
      line_items.push({ quantity: qty, price: tier.stripePriceId });
    } else {
      // Fallback: build the price dynamically (works before catalog is set up)
      line_items.push({
        quantity: qty,
        price_data: {
          currency: EVENT.currency,
          unit_amount: tier.priceCents, // trusted, server-side price
          product_data: {
            name: `${EVENT.name} — ${tier.name}`,
            description: tier.blurb,
          },
        },
      });
    }
  }

  // Booking / service fee as its own transparent line item (Eventbrite / Posh model).
  const feeCents = computeFeeCents(subtotalCents, ticketCount);
  if (feeCents > 0) {
    line_items.push({
      quantity: 1,
      price_data: {
        currency: EVENT.currency,
        unit_amount: feeCents,
        product_data: {
          name: FEES.label,
          description: `Booking & processing fee for ${ticketCount} ticket${
            ticketCount > 1 ? "s" : ""
          }`,
        },
      },
    });
  }

  const origin = req.headers.get("origin") ?? new URL(req.url).origin;

  try {
    // NOTE: we intentionally do NOT set payment_method_types — that lets Stripe
    // Checkout show every method enabled in your Dashboard, including Apple Pay
    // and Google Pay (the biggest mobile conversion lift). Enable wallets at
    // https://dashboard.stripe.com/settings/payment_methods
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      submit_type: "pay",
      line_items,
      allow_promotion_codes: true,
      success_url: `${origin}/all-white-party/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/all-white-party?canceled=1`,
      phone_number_collection: { enabled: true },
      billing_address_collection: "auto",
      custom_text: {
        submit: { message: EVENT.dressCode },
      },
      metadata: { event: EVENT.name },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not start checkout.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
