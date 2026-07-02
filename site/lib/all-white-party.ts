// All White Party — event + ticket configuration.
// This is the single source of truth for pricing. The checkout API route
// (app/all-white-party/checkout/route.ts) reads prices FROM HERE on the server,
// so the client can never set its own price.

export type TierId = "earlybird" | "ga" | "vip" | "founder";

export interface Tier {
  id: TierId;
  name: string;
  /** Price in cents. e.g. 2500 = $25.00 */
  priceCents: number;
  blurb: string;
  perks: string[];
  highlight?: boolean;
  badge?: string;
  soldOut?: boolean;
  /** Stripe catalog Price ID (price_...). Filled by create-stripe-products.mjs. */
  stripePriceId?: string;
  /** Total tickets allotted for this tier. Leave undefined to hide scarcity UI. */
  capacity?: number;
  /** Tickets already sold for this tier. */
  sold?: number;
}

export const EVENT = {
  name: "All White R&B Rooftop",
  kicker: "Good people · Good vibes · Good times",
  tagline:
    "Tampa's premier R&B experience. Music by DJ Tev. Classics, slow jams, and new flavor all night.",
  dateLabel: "Saturday, July 25, 2026",
  timeLabel: "5 PM to 9 PM",
  flyerImage: "" as string,
  venue: "Hyatt Place Downtown Tampa",
  address: "325 N Florida Ave, Tampa, FL 33602",
  lat: 27.9478092,
  lng: -82.4565328,
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Hyatt+Place+Downtown+Tampa+325+N+Florida+Ave+Tampa+FL+33602",
  dressCode: "All-white linen attire required for entry.",
  currency: "usd",
} as const;

/** Max tickets a single buyer can purchase per tier in one order. */
export const MAX_PER_TIER = 10;

// Fee structure: 10% of subtotal + $0.99 per ticket (matches developer page)
export const FEES = {
  label: "Service fee",
  percent: 0.1,
  perTicketCents: 99,
};

/** Booking fee in cents for a given subtotal + ticket count. */
export function computeFeeCents(subtotalCents: number, ticketCount: number): number {
  if (ticketCount <= 0) return 0;
  return Math.round(subtotalCents * FEES.percent) + FEES.perTicketCents * ticketCount;
}

export const TIERS: Tier[] = [
  {
    id: "earlybird",
    name: "Early Bird GA",
    priceCents: 2500, // $25.00
    blurb: "First in · only 20 available. Same great night, lowest price.",
    perks: ["General admission entry", "Lowest price guaranteed", "Access to main floor & bar"],
    badge: "Limited",
    capacity: 20,
    sold: 0,
  },
  {
    id: "ga",
    name: "General Admission",
    priceCents: 4000, // $40.00
    blurb: "The Pulse Experience. Music, dancing, and the whole vibe.",
    perks: ["General admission entry", "Access to main floor & bar"],
    highlight: true,
    badge: "Most Popular",
  },
  {
    id: "vip",
    name: "VIP Lounge",
    priceCents: 7500, // $75.00
    blurb: "Priority entry + welcome drink. Skip the line, sip in style.",
    perks: ["Priority express entry", "Access to VIP lounge area", "1 complimentary welcome drink"],
  },
  {
    id: "founder",
    name: "Founder's Seat",
    priceCents: 15000, // $150.00
    blurb: "Only 5 available · seat at the DJ table.",
    perks: ["Seat at the DJ table", "Priority entry", "2 complimentary drinks", "Meet DJ Tev"],
    badge: "Exclusive",
    capacity: 5,
    sold: 0,
  },
];

export const LOW_STOCK_THRESHOLD = 5;

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

export const FAQ: { q: string; a: string }[] = [
  {
    q: "What's the dress code?",
    a: "All-white linen, head to toe. It's a Tampa summer rooftop — dress light, breathable, and sharp.",
  },
  {
    q: "How do I get my tickets?",
    a: "Instantly. The moment you check out, your ticket + QR code is emailed to you. Show it at the door from your phone.",
  },
  {
    q: "Can I pay with Apple Pay or Google Pay?",
    a: "Yes. Both show up automatically at checkout. Cards are accepted too.",
  },
  {
    q: "Is there an age requirement?",
    a: "21+ with a valid government-issued ID.",
  },
  {
    q: "What's the refund policy?",
    a: "All sales are final, but tickets are fully transferable — send yours to a friend if plans change.",
  },
  {
    q: "Where is it and is there parking?",
    a: "Hyatt Place Downtown Tampa, 325 N Florida Ave. The hotel offers on-site parking and there are several garages within a short walk.",
  },
];

// Link Stripe catalog Price IDs (populated by scripts/create-stripe-products.mjs)
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
