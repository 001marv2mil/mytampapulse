import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  EVENT,
  FEES,
  MAX_PER_TIER,
  computeFeeCents,
  getTier,
} from "@/lib/all-white-party";
import { corsHeaders, getAvailability } from "@/lib/awp-ticketing";

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

  // Email typed on the ticket sheet — pre-fills Stripe's checkout page so the
  // buyer doesn't enter it twice. Stripe still validates/collects it.
  const rawEmail = (body as { email?: string })?.email;
  const customerEmail =
    typeof rawEmail === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail.trim())
      ? rawEmail.trim()
      : undefined;

  // Buyer + optional guest names from the ticket sheet, carried to the webhook
  // via session metadata so each ticket can be issued under a name.
  const rawName = (body as { name?: string })?.name;
  const buyerName = typeof rawName === "string" ? rawName.trim().slice(0, 80) : "";
  const rawGuests = (body as { guestNames?: unknown })?.guestNames;
  const guestNames = Array.isArray(rawGuests)
    ? rawGuests.map((g) => (typeof g === "string" ? g.trim().slice(0, 80) : "")).slice(0, 20)
    : [];

  // Live counts from the database — real inventory, not the static config.
  let availability: Awaited<ReturnType<typeof getAvailability>> | null = null;
  try {
    availability = await getAvailability();
  } catch {
    // DB unreachable: fall through with no capacity enforcement rather than
    // blocking all sales. Capacities are re-checked on the next purchase.
  }

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  const metadataItems: { id: string; qty: number }[] = [];
  let subtotalCents = 0;
  let ticketCount = 0;

  for (const item of items) {
    const tier = getTier(String(item?.id));
    if (!tier) {
      return NextResponse.json({ error: `Unknown ticket type: ${item?.id}` }, { status: 400, headers });
    }

    const qty = Math.floor(Number(item?.qty));
    if (!Number.isFinite(qty) || qty < 1 || qty > MAX_PER_TIER) {
      return NextResponse.json(
        { error: `Quantity for ${tier.name} must be between 1 and ${MAX_PER_TIER}.` },
        { status: 400, headers }
      );
    }

    const remaining = availability?.[tier.id]?.remaining ?? null;
    if (remaining !== null && remaining <= 0) {
      return NextResponse.json({ error: `${tier.name} is sold out.` }, { status: 409, headers });
    }
    if (remaining !== null && qty > remaining) {
      return NextResponse.json(
        { error: `Only ${remaining} ${tier.name} ticket${remaining === 1 ? "" : "s"} left.` },
        { status: 409, headers }
      );
    }

    metadataItems.push({ id: tier.id, qty });
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
      cancel_url:
        origin === "https://cyphr10.github.io"
          ? `${origin}/all-white-rnb/`
          : `https://mytampapulse.com/all-white-party`,
      customer_email: customerEmail,
      phone_number_collection: { enabled: true },
      billing_address_collection: "auto",
      custom_text: { submit: { message: EVENT.dressCode } },
      // items JSON is read by the webhook to mint one e-ticket per seat;
      // buyerName/guestNames put a name on each ticket for the door list
      metadata: {
        event: EVENT.name,
        items: JSON.stringify(metadataItems),
        buyerName,
        guestNames: JSON.stringify(guestNames).slice(0, 490),
      },
    });

    return NextResponse.json({ url: session.url }, { headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not start checkout.";
    return NextResponse.json({ error: message }, { status: 502, headers });
  }
}
