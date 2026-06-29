import { NextResponse } from "next/server";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limit";
import { generateExecutiveSummary } from "@/lib/reporting";

/**
 * GET /api/v1/reports/executive-summary
 * Generate executive summary for board/stakeholder review
 */
export async function GET(req: Request) {
  const limited = await rateLimit(req);
  if (limited) return limited;

  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  try {
    const summary = await generateExecutiveSummary();
    return NextResponse.json({ data: summary });
  } catch (err) {
    console.error("[Executive Summary Error]", err);
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}
