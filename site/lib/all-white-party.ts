// All White Party — event + ticket configuration.
// This is the single source of truth for pricing. The checkout API route
// (app/all-white-party/checkout/route.ts) reads prices FROM HERE on the server,
// so the client can never set its own price. Edit the placeholders below.

export type TierId = "early-bird" | "ga" | "vip";

export interface Tier {
  id: TierId;
  name: string;
  /** Price in cents. e.g. 3500 = $35.00 */
  priceCents: number;
  blurb: string;
  perks: string[];
  highlight?: boolean;
  badge?: string;
  soldOut?: boolean;
  /** Stripe catalog Price ID (price_...). When set, checkout charges this
   * instead of building the price dynamically. Filled by the create-products script. */
  stripePriceId?: string;
  /** Total tickets allotted for this tier. Leave undefined to hide scarcity UI. */
  capacity?: number;
  /** Tickets already sold for this tier (update as sales come in, or wire to Stripe). */
  sold?: number;
}

export const EVENT = {
  name: "All White R&B Night",
  kicker: "Good people · Good vibes · Good times",
  tagline:
    "Tampa's premier R&B experience. Music by Tampa's top R&B DJ. Classics, slow jams, and new flavor all night.",
  dateLabel: "Saturday, July 25, 2026",
  timeLabel: "5 PM to 9 PM",
  // Drop the flyer into mytampapulse/site/public/ and set its filename here
  // (e.g. "/all-white-rnb-flyer.jpg") to use it as the cover image, Posh-style.
  flyerImage: "" as string,
  venue: "Social Club · Downtown Tampa",
  address: "512 N Franklin St, Tampa, FL 33602",
  lat: 27.9487872,
  lng: -82.4585752,
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=512%20N%20Franklin%20St%20Tampa%20FL%2033602",
  dressCode: "All white cocktail attire required for entry.",
  currency: "usd",
} as const;

/** Max tickets a single buyer can purchase per tier in one order. */
export const MAX_PER_TIER = 10;

// Booking / service fee passed on to the buyer — the Posh / Eventbrite model.
// Shown transparently in the order summary AND added as its own line item at
// checkout. Computed server-side so it can't be tampered with. EDIT these.
export const FEES = {
  label: "Service fee",
  percent: 0.1, // 10% of ticket subtotal
  perTicketCents: 150, // + $1.50 per ticket
};

/** Booking fee in cents for a given subtotal + ticket count. */
export function computeFeeCents(subtotalCents: number, ticketCount: number): number {
  if (ticketCount <= 0) return 0;
  return Math.round(subtotalCents * FEES.percent) + FEES.perTicketCents * ticketCount;
}

export const TIERS: Tier[] = [
  {
    id: "early-bird",
    name: "Early Bird",
    priceCents: 3500, // $35.00
    blurb: "Limited release. Same great night, lowest price. Once they're gone, they're gone.",
    perks: [
      "General admission entry",
      "Lowest price guaranteed",
      "Access to main floor & bar",
    ],
    badge: "Limited",
    capacity: 100, // PLACEHOLDER — set real allotment
    sold: 88, //      PLACEHOLDER — set real sold count
  },
  {
    id: "ga",
    name: "General Admission",
    priceCents: 5000, // $50.00
    blurb: "The full All White Party experience. Music, dancing, and the whole vibe.",
    perks: [
      "General admission entry",
      "Access to main floor & bar",
      "Coat / bag check included",
    ],
    highlight: true,
    badge: "Most Popular",
    capacity: 400, // PLACEHOLDER — set real allotment
    sold: 137, //     PLACEHOLDER — set real sold count
  },
  {
    id: "vip",
    name: "VIP",
    priceCents: 10000, // $100.00
    blurb: "Skip the line, sip in style. The premium way to do the night.",
    perks: [
      "Priority express entry",
      "Access to VIP lounge area",
      "1 complimentary welcome drink",
      "Dedicated VIP host",
    ],
    capacity: 40, // PLACEHOLDER — set real allotment
    sold: 28, //     PLACEHOLDER — set real sold count
  },
];

// Show "Only N left" once a tier's remaining drops to/under this number.
export const LOW_STOCK_THRESHOLD = 25;

/** Tickets still available for a tier, or null if no capacity is configured. */
export function tierRemaining(tier: Tier): number | null {
  if (typeof tier.capacity !== "number") return null;
  return Math.max(0, tier.capacity - (tier.sold ?? 0));
}

/** Effective sold-out check (manual flag OR capacity exhausted). */
export function isSoldOut(tier: Tier): boolean {
  if (tier.soldOut) return true;
  const remaining = tierRemaining(tier);
  return remaining !== null && remaining <= 0;
}

// Objection-busting FAQ — edit freely. Fewer doubts = more checkouts.
export const FAQ: { q: string; a: string }[] = [
  {
    q: "What's the dress code?",
    a: "All white cocktail attire, head to toe. It's the whole vibe, and the door enforces it, so dress to impress.",
  },
  {
    q: "How do I get my tickets?",
    a: "Instantly. The moment you check out, your ticket + QR code is emailed to you. Just show it at the door from your phone.",
  },
  {
    q: "Can I pay with Apple Pay or Google Pay?",
    a: "Yes. Both show up automatically at checkout, so you can buy in seconds. Cards are accepted too.",
  },
  {
    q: "Is there an age requirement?",
    a: "21+ with a valid government-issued ID. (Edit if yours differs.)",
  },
  {
    q: "What's the refund policy?",
    a: "All sales are final, but tickets are fully transferable, so send yours to a friend if plans change. (Edit to your policy.)",
  },
  {
    q: "Where is it and is there parking?",
    a: "Social Club, 512 N Franklin St, in Downtown Tampa. Street parking and several public garages are within a short walk.",
  },
];

// Link Stripe catalog Price IDs (populated by scripts/create-stripe-products.mjs)
// onto each tier. Empty values are ignored, so checkout falls back to dynamic pricing.
import STRIPE_PRICE_IDS from "./stripe-price-ids.json";
for (const tier of TIERS) {
  const priceId = (STRIPE_PRICE_IDS as Record<string, string>)[tier.id];
  if (priceId) tier.stripePriceId = priceId;
}

export function getTier(id: string): Tier | undefined {
  return TIERS.find((t) => t.id === id);
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: EVENT.currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
