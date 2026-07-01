import { NextRequest, NextResponse } from "next/server";
import { processTool } from "ip-contingency-mcp";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";
import { asyncHandler } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { getFormattedGaps } from "@/lib/queries/intelligence-gaps";

export const GET = asyncHandler(async (req: NextRequest) => {
  const limited = await rateLimit(req);
  if (limited) return limited;

  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const formattedGaps = await getFormattedGaps();

  const result = await processTool({
    tool: "detectAnomalies",
    input: { gaps: formattedGaps },
  });

  return NextResponse.json(result);
});
