import { NextResponse } from "next/server";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";
import { getOwnershipGapSummary } from "@/lib/queries/ownership-gaps";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const limited = await rateLimit(req);
  if (limited) return limited;

  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "5", 10)));

    const summary = await getOwnershipGapSummary(limit);
    return NextResponse.json({ data: summary });
  } catch (err) {
    console.error("[Dashboard Error]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
