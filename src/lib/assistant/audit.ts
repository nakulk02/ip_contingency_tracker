import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { ToolCallRecord } from "./agent";

/**
 * Write one ToolCallAudit row per tool the assistant runs.
 *
 * `inputSummary` has already been redacted by the agent (ids, counts and
 * filters only). A failed write is logged and swallowed, so an audit outage
 * degrades to log-only auditing instead of failing the user's request.
 */
export function makeToolCallAuditor(requestId: string, userId: string) {
  return async (record: ToolCallRecord & { inputSummary: unknown }) => {
    logger.info(
      {
        requestId,
        tool: record.tool,
        success: record.success,
        durationMs: record.durationMs,
        gapCount: record.gapCount,
        inputTokens: record.inputTokens,
        outputTokens: record.outputTokens,
      },
      "Assistant tool call"
    );

    try {
      await prisma.toolCallAudit.create({
        data: {
          requestId,
          userId,
          tool: record.tool,
          inputSummary: record.inputSummary as object,
          success: record.success,
          error: record.error?.slice(0, 1000),
          durationMs: Math.round(record.durationMs),
          inputTokens: record.inputTokens,
          outputTokens: record.outputTokens,
        },
      });
    } catch (err) {
      logger.error({ err, requestId, tool: record.tool }, "Failed to write tool call audit row");
    }
  };
}
