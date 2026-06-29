import { NextResponse } from "next/server";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limit";
import { generateGapReport, reportToCSV, generateComplianceAudit, generateExecutiveSummary } from "@/lib/reporting";

/**
 * GET /api/v1/reports/gap-report?format=csv
 * Export IP gap report
 */
export async function GET(req: Request) {
  const limited = await rateLimit(req);
  if (limited) return limited;

  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";

    const report = await generateGapReport();

    if (format === "csv") {
      const csv = reportToCSV(report);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="ip-gap-report-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({ data: report });
  } catch (err) {
    console.error("[Report Error]", err);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
