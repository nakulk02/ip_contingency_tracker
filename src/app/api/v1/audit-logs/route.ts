import { getSessionOrUnauthorized } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limit";
import { parsePagination, paginatedResponse, asyncHandler } from "@/lib/api-utils";
import { getAuditLogsByAction } from "@/lib/audit-log";
import { ValidationError } from "@/lib/errors";
import { AuditAction } from "@prisma/client";

const VALID_ACTIONS = ["CREATE", "UPDATE", "DELETE", "STATUS_CHANGE"] as const;

/**
 * GET /api/v1/audit-logs?action=STATUS_CHANGE
 * Get all audit logs filtered by action type
 * Useful for compliance audits, change tracking, etc.
 */
export const GET = asyncHandler(async (req: Request) => {
  const limited = await rateLimit(req);
  if (limited) return limited;

  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const { page, limit, skip } = parsePagination(req);

  const actionParam = searchParams.get("action") as string | null;

  // Validate action parameter
  if (!actionParam || !(VALID_ACTIONS as readonly string[]).includes(actionParam)) {
    throw new ValidationError(
      "Invalid action. Valid values: CREATE, UPDATE, DELETE, STATUS_CHANGE"
    );
  }

  const logs = await getAuditLogsByAction(actionParam as AuditAction);

  // Paginate in memory since we're including relations
  const paginatedLogs = logs.slice(skip, skip + limit);

  return paginatedResponse(paginatedLogs, logs.length, page, limit);
});
