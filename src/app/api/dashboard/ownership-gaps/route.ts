import { NextResponse } from "next/server";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";
import { getOwnershipGapSummary } from "@/lib/queries/ownership-gaps";
import { asyncHandler } from "@/lib/api-utils";

export const GET = asyncHandler(async () => {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const summary = await getOwnershipGapSummary();
  return NextResponse.json({ data: summary });
});
