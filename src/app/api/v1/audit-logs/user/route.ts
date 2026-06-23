import { NextResponse } from "next/server";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limit";
import { parsePagination, paginatedResponse } from "@/lib/api-utils";
import { getUserAuditHistory } from "@/lib/audit-log";

/**
 * GET /api/v1/audit-logs/user
 * Get all audit logs for the current authenticated user
 * Helps track what changes this user has made
 */
export async function GET(req: Request) {
  const limited = await rateLimit(req);
  if (limited) return limited;

  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  try {
    const { page, limit, skip } = parsePagination(req);

    const logs = await getUserAuditHistory(session!.user!.id);

    // Paginate in memory since we're including relations
    const paginatedLogs = logs.slice(skip, skip + limit);

    return paginatedResponse(paginatedLogs, logs.length, page, limit);
  } catch (err) {
    console.error("[User Audit History Error]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
