import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { processTool } from "ip-contingency-mcp";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";
import { asyncHandler } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { getFormattedGaps } from "@/lib/queries/intelligence-gaps";
import { assistantRequestSchema } from "@/lib/assistant/guardrails";
import { redactText } from "@/lib/assistant/redact";
import { askAssistant } from "@/lib/assistant/agent";
import { makeToolCallAuditor } from "@/lib/assistant/audit";

let llm: Anthropic | undefined;
function getLLM() {
  if (!llm) llm = new Anthropic();
  return llm;
}

/**
 * POST /api/v1/intelligence/assistant
 *
 * Answers a natural-language question about IP assignment gaps by letting
 * Claude choose and chain the intelligence tools. Returns the answer and a
 * trace of every tool call. Off-topic and prompt-injection questions are
 * refused before any model call.
 */
export const POST = asyncHandler(async (req: NextRequest) => {
  const limited = await rateLimit(req);
  if (limited) return limited;

  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const requestId = randomUUID();
  const userId = session!.user.id;
  const { question } = assistantRequestSchema.parse(await req.json());
  logger.info({ requestId, userId, question: redactText(question) }, "Assistant request");

  const result = await askAssistant(question, {
    llm: getLLM(),
    loadGaps: getFormattedGaps,
    runTool: processTool,
    onToolCall: makeToolCallAuditor(requestId, userId),
  });

  logger.info(
    {
      requestId,
      refused: result.refused,
      refusalReason: result.refusalReason,
      tools: result.trace.map((t) => t.tool),
      latencyMs: result.latencyMs,
      ...("usage" in result ? result.usage : {}),
    },
    "Assistant request completed"
  );

  return NextResponse.json({ requestId, ...result });
});
