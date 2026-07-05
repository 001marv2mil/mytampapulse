import { NextResponse } from "next/server";

// Branded redirect so DMs/ads can share a clean link instead of the raw ig.me/j/... invite.
export async function GET() {
  return NextResponse.redirect("https://ig.me/j/Abb7l0avEQLpfF0m/", 302);
}
