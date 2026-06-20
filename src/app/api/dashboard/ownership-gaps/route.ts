import { NextResponse } from "next/server";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";
import { getOwnershipGapSummary } from "@/lib/queries/ownership-gaps";

export async function GET() {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const summary = await getOwnershipGapSummary();
  return NextResponse.json({ data: summary });
}
