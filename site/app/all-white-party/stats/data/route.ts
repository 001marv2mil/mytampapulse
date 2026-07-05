import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { TIERS } from "@/lib/all-white-party";

// Revenue + sales stats for the mini dashboard. Same door PIN as the guest list.
export async function POST(req: NextRequest) {
  const doorPin = process.env.AWP_DOOR_PIN;
  if (!doorPin) {
    return NextResponse.json({ error: "Not configured yet." }, { status: 500 });
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

  const [{ data: orders, error: e1 }, { data: tickets, error: e2 }] = await Promise.all([
    supabaseAdmin
      .from("awp_orders")
      .select("session_id, name, email, amount_total, created_at")
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("awp_tickets").select("tier, status"),
  ]);
  if (e1 || e2) {
    return NextResponse.json({ error: (e1 ?? e2)?.message ?? "Database error." }, { status: 500 });
  }

  const totalCollectedCents = (orders ?? []).reduce((s, o) => s + (o.amount_total ?? 0), 0);
  const checkedIn = (tickets ?? []).filter((t) => t.status === "used").length;

  const tiers = TIERS.map((tier) => {
    const sold = (tickets ?? []).filter((t) => t.tier === tier.id).length;
    return {
      id: tier.id,
      name: tier.name,
      priceCents: tier.priceCents,
      sold,
      capacity: tier.capacity ?? null,
      faceRevenueCents: sold * tier.priceCents,
    };
  });

  return NextResponse.json({
    totalCollectedCents,
    totalTickets: (tickets ?? []).length,
    totalOrders: (orders ?? []).length,
    checkedIn,
    tiers,
    recent: (orders ?? []).slice(0, 15).map((o) => ({
      name: o.name,
      email: o.email,
      amountCents: o.amount_total,
      at: o.created_at,
    })),
  });
}
