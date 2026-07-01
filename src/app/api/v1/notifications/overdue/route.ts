import { NextResponse } from "next/server";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";
import { asyncHandler } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import {
  findOverdueAssignments,
  getOverdueByPerson,
  getCriticalComplianceViolations,
} from "@/lib/notifications";

/**
 * GET /api/v1/notifications/overdue?thresholdDays=30
 * Get list of overdue IP assignments
 *
 * Used by background jobs, dashboards, or manual checks
 */
export const GET = asyncHandler(async (req: Request) => {
  const limited = await rateLimit(req);
  if (limited) return limited;

  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const thresholdDays = parseInt(searchParams.get("thresholdDays") || "30", 10);

  const overdue = await findOverdueAssignments(thresholdDays);
  const byPerson = await getOverdueByPerson(thresholdDays);
  const criticalViolations = await getCriticalComplianceViolations();

  return NextResponse.json({
    data: {
      summary: {
        totalOverdue: overdue.length,
        affectedPeople: byPerson.length,
        criticalViolations: criticalViolations.length,
      },
      overdue,
      byPerson,
      criticalViolations,
    },
  });
});
