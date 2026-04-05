import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("subscribers")
      .update({ status: "unsubscribed" })
      .eq("unsubscribe_token", token)
      .select("email")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
    }

    return NextResponse.json({ success: true, email: data.email });
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
