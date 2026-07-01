import { NextResponse } from "next/server";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";
import { asyncHandler } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { generateComplianceAudit } from "@/lib/reporting";

/**
 * GET /api/v1/reports/compliance-audit
 * Generate compliance audit report with audit logs
 */
export const GET = asyncHandler(async (req: Request) => {
  const limited = await rateLimit(req);
  if (limited) return limited;

  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const audit = await generateComplianceAudit();
  return NextResponse.json({ data: audit });
});
