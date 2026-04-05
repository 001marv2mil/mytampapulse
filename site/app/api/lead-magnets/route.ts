import { NextRequest, NextResponse } from "next/server";
import { leadMagnets } from "@/lib/lead-magnets";

export async function GET(req: NextRequest) {
  return NextResponse.json({
    available: Object.values(leadMagnets).map((mg) => ({
      id: mg.id,
      title: mg.title,
      description: mg.description,
      format: mg.format,
      shortUrl: mg.shortUrl,
    })),
  });
}
