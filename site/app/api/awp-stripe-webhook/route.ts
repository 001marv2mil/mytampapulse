import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";
import { EVENT, getTier, type TierId } from "@/lib/all-white-party";
import { generateTicketCode, ticketQrUrl, ticketUrl } from "@/lib/awp-ticketing";

// Stripe calls this after every checkout. On a completed payment we record the
// order, mint one ticket per seat, and email the buyer their QR e-tickets.
//
// Verification is fetch-based: we take only the session ID from the payload and
// retrieve the authoritative session straight from Stripe's API. A forged POST
// can't invent a paid session, and idempotency stops replays — so we don't
// depend on STRIPE_WEBHOOK_SECRET (which proved impossible to verify on this
// project's write-only env vars).
export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const stripe = new Stripe(secretKey);

  let payload: { type?: string; data?: { object?: { id?: string } } };
  try {
    payload = JSON.parse(await req.text());
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (payload.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const sessionId = payload.data?.object?.id;
  if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "Missing session id." }, { status: 400 });
  }

  // Authoritative copy from Stripe — ignore everything else in the payload.
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return NextResponse.json({ error: "Unknown session." }, { status: 400 });
  }

  if (session.status !== "complete") {
    return NextResponse.json({ received: true, skipped: "session not complete" });
  }
  // "no_payment_required" covers $0 totals (100%-off promo codes)
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    return NextResponse.json({ received: true, skipped: "not paid" });
  }

  let items: { id: TierId; qty: number }[] = [];
  try {
    items = JSON.parse(session.metadata?.items ?? "[]");
  } catch {
    /* fall through to empty */
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ received: true, skipped: "no items metadata" });
  }

  const email = session.customer_details?.email ?? null;
  const name = session.customer_details?.name ?? null;
  const phone = session.customer_details?.phone ?? null;

  // Idempotency: a webhook can be delivered more than once. The order row's
  // primary key is the session id, so a second delivery fails the insert and
  // we skip re-issuing tickets.
  const { error: orderError } = await supabaseAdmin.from("awp_orders").insert({
    session_id: session.id,
    email,
    name,
    phone,
    amount_total: session.amount_total,
  });
  if (orderError) {
    if (orderError.code === "23505") {
      return NextResponse.json({ received: true, skipped: "duplicate delivery" });
    }
    return NextResponse.json({ error: `Order insert failed: ${orderError.message}` }, { status: 500 });
  }

  const tickets: { code: string; tier: TierId; tierName: string }[] = [];
  for (const item of items) {
    const tier = getTier(String(item.id));
    if (!tier) continue;
    const qty = Math.max(1, Math.min(20, Math.floor(Number(item.qty)) || 1));
    for (let i = 0; i < qty; i++) {
      tickets.push({ code: generateTicketCode(), tier: tier.id, tierName: tier.name });
    }
  }

  const { error: ticketError } = await supabaseAdmin.from("awp_tickets").insert(
    tickets.map((t) => ({
      code: t.code,
      session_id: session.id,
      tier: t.tier,
      buyer_email: email,
    }))
  );
  if (ticketError) {
    return NextResponse.json({ error: `Ticket insert failed: ${ticketError.message}` }, { status: 500 });
  }

  if (email && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    try {
      await resend.emails.send({
        from: "Tampa Pulse <newsletter@mytampapulse.com>",
        to: email,
        subject: `Your ticket${tickets.length > 1 ? "s" : ""} — ${EVENT.name} 🎟️`,
        html: ticketEmailHtml(name, tickets),
      });
    } catch {
      // Tickets are already issued; the buyer can still be looked up at the
      // door by email. Don't fail the webhook over an email hiccup.
    }
  }

  return NextResponse.json({ received: true, ticketsIssued: tickets.length });
}

function ticketEmailHtml(
  name: string | null,
  tickets: { code: string; tier: TierId; tierName: string }[]
): string {
  const gold = "#e0b256";
  const goldHi = "#f7dfa0";
  const ticketBlocks = tickets
    .map(
      (t, i) => `
      <div style="background:#17100a;border:1px solid rgba(224,178,86,0.45);border-radius:16px;padding:24px;margin:0 0 16px;text-align:center;">
        <p style="margin:0 0 4px;color:${gold};font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">Ticket ${i + 1} of ${tickets.length}</p>
        <p style="margin:0 0 16px;color:${goldHi};font-size:20px;font-weight:bold;">${t.tierName}</p>
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
