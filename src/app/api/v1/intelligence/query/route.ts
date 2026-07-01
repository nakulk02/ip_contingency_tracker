import { NextRequest, NextResponse } from "next/server";
import { processTool } from "ip-contingency-mcp";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";
import { asyncHandler } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { getFormattedGaps } from "@/lib/queries/intelligence-gaps";
import { naturalLanguageQuerySchema } from "@/lib/validation";

export const POST = asyncHandler(async (req: NextRequest) => {
  const limited = await rateLimit(req);
  if (limited) return limited;

  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const body = await req.json();
  const { question } = naturalLanguageQuerySchema.parse(body);

  const formattedGaps = await getFormattedGaps();

  const result = await processTool({
    tool: "queryAssignments",
    input: { question, gaps: formattedGaps },
  });

  return NextResponse.json(result);
});
