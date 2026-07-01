import { NextRequest, NextResponse } from "next/server";
import { processTool } from "ip-contingency-mcp";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";
import { asyncHandler } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { getFormattedGap } from "@/lib/queries/intelligence-gaps";
import { ValidationError } from "@/lib/errors";

export const GET = asyncHandler(async (req: NextRequest) => {
  const limited = await rateLimit(req);
  if (limited) return limited;

  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const gapId = req.nextUrl.searchParams.get("gapId");
  if (!gapId) {
    throw new ValidationError("gapId parameter required");
  }

  const formattedGap = await getFormattedGap(gapId);

  const result = await processTool({
    tool: "predictRisk",
    input: { gap: formattedGap },
  });

  return NextResponse.json(result);
});
