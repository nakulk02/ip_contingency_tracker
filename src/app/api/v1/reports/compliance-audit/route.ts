import { NextResponse } from "next/server";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limit";
import { generateComplianceAudit } from "@/lib/reporting";

/**
 * GET /api/v1/reports/compliance-audit
 * Generate compliance audit report with audit logs
 */
export async function GET(req: Request) {
  const limited = await rateLimit(req);
  if (limited) return limited;

  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  try {
    const audit = await generateComplianceAudit();
    return NextResponse.json({ data: audit });
  } catch (err) {
    console.error("[Compliance Audit Error]", err);
    return NextResponse.json({ error: "Failed to generate audit" }, { status: 500 });
  }
}
