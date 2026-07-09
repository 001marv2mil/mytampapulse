// Shared ticket-issuing pipeline: given a Stripe checkout session ID, verify it
// with Stripe directly, record the order, mint one coded ticket per seat, and
// email the buyer their QR e-tickets.
//
// Called from TWO independent places so a buyer always gets their tickets:
//   1. the Stripe webhook (fires even if the buyer closes the browser)
//   2. the success page   (fires even if the webhook delivery fails)
// Idempotent — the order's primary key is the session id, so whichever path
// runs second becomes a no-op.
import Stripe from "stripe";
import { Resend } from "resend";
import { supabaseAdmin } from "./supabase";
import { EVENT, getTier, type TierId } from "./all-white-party";
import { generateTicketCode, ticketQrUrl, ticketUrl } from "./awp-ticketing";

export interface IssueResult {
  issued: number;
  skipped?: string;
  error?: string;
}

export async function issueTicketsForSession(sessionId: string): Promise<IssueResult> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return { issued: 0, error: "Stripe is not configured." };
  if (!sessionId.startsWith("cs_")) return { issued: 0, error: "Invalid session id." };

  const stripe = new Stripe(secretKey);

  // Authoritative copy from Stripe — never trust caller-supplied session data.
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return { issued: 0, error: "Unknown session." };
  }

  if (session.status !== "complete") return { issued: 0, skipped: "session not complete" };
  // "no_payment_required" covers $0 totals (100%-off promo codes)
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    return { issued: 0, skipped: "not paid" };
  }

  let items: { id: TierId; qty: number }[] = [];
  try {
    items = JSON.parse(session.metadata?.items ?? "[]");
  } catch {
    /* fall through to empty */
  }
  if (!Array.isArray(items) || items.length === 0) {
    return { issued: 0, skipped: "no items metadata" };
  }

  const email = session.customer_details?.email ?? null;
  // Prefer the name typed on the ticket sheet; card name is the fallback
  // ($0 promo checkouts skip the card form entirely, so it can be missing).
  const buyerName = session.metadata?.buyerName?.trim() || session.customer_details?.name || null;
  const phone = session.customer_details?.phone ?? null;

  let guestNames: string[] = [];
  try {
    const parsed = JSON.parse(session.metadata?.guestNames ?? "[]");
    if (Array.isArray(parsed)) guestNames = parsed.map((g) => String(g).trim());
  } catch {
    /* optional */
  }

  // Idempotency gate: insert the order first; a duplicate key means another
  // path already issued this session's tickets.
  const { error: orderError } = await supabaseAdmin.from("awp_orders").insert({
    session_id: session.id,
    email,
    name: buyerName,
    phone,
    amount_total: session.amount_total,
  });
  if (orderError) {
    if (orderError.code === "23505") return { issued: 0, skipped: "already issued" };
    return { issued: 0, error: `Order insert failed: ${orderError.message}` };
  }

  // Ticket 1 carries the buyer's name; extra tickets take the guest names the
  // buyer typed (in order), blank where they skipped one.
  const tickets: { code: string; tier: TierId; tierName: string; guestName: string | null }[] = [];
  let seat = 0;
  for (const item of items) {
    const tier = getTier(String(item.id));
    if (!tier) continue;
    const qty = Math.max(1, Math.min(20, Math.floor(Number(item.qty)) || 1));
    for (let i = 0; i < qty; i++) {
      const guestName = seat === 0 ? buyerName : guestNames[seat - 1] || null;
      tickets.push({ code: generateTicketCode(), tier: tier.id, tierName: tier.name, guestName });
      seat++;
    }
  }

  const { error: ticketError } = await supabaseAdmin.from("awp_tickets").insert(
    tickets.map((t) => ({
      code: t.code,
      session_id: session.id,
      tier: t.tier,
      buyer_email: email,
      guest_name: t.guestName,
    }))
  );
  if (ticketError) return { issued: 0, error: `Ticket insert failed: ${ticketError.message}` };

  // Buyer joins the Tampa Pulse newsletter list unless they unchecked the
  // opt-in on the ticket sheet. Best-effort: duplicates error out harmlessly,
  // so prior unsubscribes stay unsubscribed.
  const newsletterOptIn = session.metadata?.newsletterOptIn !== "false";
  if (email && newsletterOptIn) {
    await supabaseAdmin.from("subscribers").insert({ email, source: "all-white-party" });
  }

  if (email && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    try {
      await resend.emails.send({
        from: "Tampa Pulse <newsletter@mytampapulse.com>",
        to: email,
        subject: `Your ticket${tickets.length > 1 ? "s" : ""} — ${EVENT.name} 🎟️`,
        html: ticketEmailHtml(buyerName, tickets),
      });
    } catch {
      // Tickets are already issued; the buyer can still be looked up at the
      // door by email. Don't fail issuance over an email hiccup.
    }
  }

  return { issued: tickets.length };
}

function ticketEmailHtml(
  name: string | null,
  tickets: { code: string; tier: TierId; tierName: string; guestName: string | null }[]
): string {
  const gold = "#e0b256";
  const goldHi = "#f7dfa0";
  const ticketBlocks = tickets
    .map(
      (t, i) => `
      <div style="background:#17100a;border:1px solid rgba(224,178,86,0.45);border-radius:16px;padding:24px;margin:0 0 16px;text-align:center;">
        <p style="margin:0 0 4px;color:${gold};font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">Ticket ${i + 1} of ${tickets.length}</p>
        <p style="margin:0 0 ${t.guestName ? "4" : "16"}px;color:${goldHi};font-size:20px;font-weight:bold;">${t.tierName}</p>
        ${t.guestName ? `<p style="margin:0 0 16px;color:#f6efe2;font-size:14px;">Admit: <strong>${t.guestName}</strong></p>` : ""}
        <img src="${ticketQrUrl(t.code)}" width="220" height="220" alt="QR code for ticket ${t.code}" style="display:block;margin:0 auto 12px;border-radius:12px;background:#ffffff;padding:8px;" />
        <p style="margin:0 0 6px;color:#9c948a;font-size:12px;">Ticket code</p>
        <p style="margin:0 0 14px;color:#f6efe2;font-size:18px;font-weight:bold;letter-spacing:3px;">${t.code}</p>
        <a href="${ticketUrl(t.code)}" style="color:${gold};font-size:12px;">View ticket online</a>
      </div>`
    )
    .join("");

  return `
  <div style="background:#0a0705;padding:32px 16px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;">
      <h1 style="margin:0 0 6px;color:${goldHi};font-size:26px;text-align:center;">${EVENT.name}</h1>
      <p style="margin:0 0 24px;color:#9c948a;font-size:14px;text-align:center;">
        ${EVENT.dateLabel} · ${EVENT.timeLabel}<br />
        ${EVENT.venue} — ${EVENT.address}
      </p>
      <p style="margin:0 0 20px;color:#f6efe2;font-size:15px;">
        ${name ? `Hey ${name.split(" ")[0]},` : "Hey,"} you're in! 🤍 Show the QR code${tickets.length > 1 ? "s" : ""} below at the door — from your phone is fine.
      </p>
      ${ticketBlocks}
      <p style="margin:20px 0 0;color:${gold};font-size:13px;text-align:center;font-weight:bold;">${EVENT.dressCode}</p>
      <p style="margin:16px 0 0;color:#6f6862;font-size:11px;text-align:center;">
        Tickets are transferable — forward this email if plans change. All sales final.<br />
        An event by Tampa Pulse · mytampapulse.com
      </p>
    </div>
  </div>`;
}
