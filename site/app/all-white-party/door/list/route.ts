import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getTier } from "@/lib/all-white-party";

// Full guest list for door staff. PIN-gated with the same door PIN as check-in.
export async function POST(req: NextRequest) {
  const doorPin = process.env.AWP_DOOR_PIN;
  if (!doorPin) {
    return NextResponse.json({ error: "Door tools are not configured yet." }, { status: 500 });
  }

  let pin = "";
  try {
    const body = await req.json();
    pin = String(body?.pin ?? "");
  } catch {
    /* empty pin fails below */
  }
  if (pin !== doorPin) {
    return NextResponse.json({ error: "Wrong PIN." }, { status: 401 });
  }

  const [{ data: orders, error: ordersError }, { data: tickets, error: ticketsError }] =
    await Promise.all([
      supabaseAdmin.from("awp_orders").select("session_id, email, name, phone, created_at"),
      supabaseAdmin
        .from("awp_tickets")
        .select("code, session_id, tier, status, used_at")
        .order("created_at", { ascending: true }),
    ]);

  if (ordersError || ticketsError) {
    return NextResponse.json(
      { error: (ordersError ?? ticketsError)?.message ?? "Database error." },
      { status: 500 }
    );
  }

  const byOrder = new Map(
    (orders ?? []).map((o) => [
      o.session_id,
      { name: o.name, email: o.email, phone: o.phone, tickets: [] as unknown[] },
    ])
  );
  for (const t of tickets ?? []) {
    const order = byOrder.get(t.session_id);
    const entry = {
      code: t.code,
      tier: t.tier,
      tierName: getTier(t.tier)?.name ?? t.tier,
      status: t.status,
      used_at: t.used_at,
    };
    if (order) order.tickets.push(entry);
  }

  const guests = [...byOrder.values()].filter((g) => g.tickets.length > 0);
  const totalTickets = (tickets ?? []).length;
  const checkedIn = (tickets ?? []).filter((t) => t.status === "used").length;

  return NextResponse.json({ guests, totalTickets, checkedIn });
}
