// All White Party ticketing — sold counts, ticket codes, shared CORS.
// Tables: awp_orders, awp_tickets (supabase/migrations/20260702_create_awp_ticketing.sql)
import { supabaseAdmin } from "./supabase";
import { TIERS, type TierId } from "./all-white-party";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://mytampapulse.com").replace(/\/$/, "");

export const ALLOWED_ORIGINS = [
  "https://mytampapulse.com",
  "https://www.mytampapulse.com",
  "https://cyphr10.github.io",
  "http://localhost:3000",
];

export function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = ALLOWED_ORIGINS.includes(origin ?? "") ? (origin as string) : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

/** Tickets sold per tier, straight from the database. */
export async function getSoldCounts(): Promise<Record<TierId, number>> {
  const counts: Record<TierId, number> = { earlybird: 0, ga: 0, vip: 0, founder: 0 };
  const { data, error } = await supabaseAdmin.from("awp_tickets").select("tier");
  if (error) throw new Error(`Could not read ticket counts: ${error.message}`);
  for (const row of data ?? []) {
    const t = row.tier as TierId;
    if (t in counts) counts[t]++;
  }
  return counts;
}

export interface TierAvailability {
  capacity: number | null;
  sold: number;
  remaining: number | null; // null = unlimited
}

/** Live availability per tier (capacity comes from TIERS config).
 *  A manual `soldOut: true` on a tier forces remaining to 0. */
export async function getAvailability(): Promise<Record<TierId, TierAvailability>> {
  const sold = await getSoldCounts();
  const out = {} as Record<TierId, TierAvailability>;
  for (const tier of TIERS) {
    const capacity = typeof tier.capacity === "number" ? tier.capacity : null;
    out[tier.id] = {
      capacity,
      sold: sold[tier.id],
      remaining: tier.soldOut ? 0 : capacity === null ? null : Math.max(0, capacity - sold[tier.id]),
    };
  }
  return out;
}

/** Short, unambiguous ticket code (no 0/O, 1/I/L). */
export function generateTicketCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  let code = "";
  for (const b of bytes) code += alphabet[b % alphabet.length];
  return code;
}

export function ticketUrl(code: string): string {
  return `${SITE_URL}/all-white-party/ticket/${code}`;
}

/** QR image URL for a ticket (rendered by the email client, not our CSP). */
export function ticketQrUrl(code: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=10&data=${encodeURIComponent(ticketUrl(code))}`;
}
