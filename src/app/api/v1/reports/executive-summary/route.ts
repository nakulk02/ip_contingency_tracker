import { NextResponse } from "next/server";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";
import { asyncHandler } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { generateExecutiveSummary } from "@/lib/reporting";

/**
 * GET /api/v1/reports/executive-summary
 * Generate executive summary for board/stakeholder review
 */
export const GET = asyncHandler(async (req: Request) => {
  const limited = await rateLimit(req);
  if (limited) return limited;

  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const summary = await generateExecutiveSummary();
  return NextResponse.json({ data: summary });
});
