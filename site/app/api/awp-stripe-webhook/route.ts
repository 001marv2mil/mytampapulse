import { NextRequest, NextResponse } from "next/server";
import { issueTicketsForSession } from "@/lib/awp-issue-tickets";

// Stripe calls this after every checkout. Issuance itself lives in
// lib/awp-issue-tickets.ts and is verified by fetching the session from
// Stripe's API — we take nothing from the payload but the session id, so a
// forged POST can't invent a paid session, and idempotency stops replays.
// The success page calls the same pipeline as a backup path.
export async function POST(req: NextRequest) {
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
  if (typeof sessionId !== "string") {
    return NextResponse.json({ error: "Missing session id." }, { status: 400 });
  }

  const result = await issueTicketsForSession(sessionId);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ received: true, ticketsIssued: result.issued, skipped: result.skipped });
}
