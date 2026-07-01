import { NextResponse } from "next/server";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";
import { asyncHandler } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { getAssignmentAuditHistory } from "@/lib/audit-log";

export const GET = asyncHandler(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const limited = await rateLimit(req);
    if (limited) return limited;

    const { error } = await getSessionOrUnauthorized();
    if (error) return error;

    const { id } = await params;

    const auditLogs = await getAssignmentAuditHistory(id);

    return NextResponse.json({
      data: {
        assignmentId: id,
        auditCount: auditLogs.length,
        logs: auditLogs,
      },
    });
  }
);
