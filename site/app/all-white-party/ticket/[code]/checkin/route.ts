import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Marks a ticket as used. PIN-gated so only door staff can check people in.
export async function POST(req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const doorPin = process.env.AWP_DOOR_PIN;
  if (!doorPin) {
    return NextResponse.json({ error: "Check-in is not configured yet." }, { status: 500 });
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

  const { code } = await ctx.params;
  const cleanCode = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);

  // Atomic: only flips valid -> used, so a double scan can't check in twice.
  const { data, error } = await supabaseAdmin
    .from("awp_tickets")
    .update({ status: "used", used_at: new Date().toISOString() })
    .eq("code", cleanCode)
    .eq("status", "valid")
    .select("code, used_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    // Either the code doesn't exist or it was already used — report which.
    const { data: existing } = await supabaseAdmin
      .from("awp_tickets")
      .select("status, used_at")
      .eq("code", cleanCode)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Ticket already used.", used_at: existing.used_at },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true, used_at: data.used_at });
}
