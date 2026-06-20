import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Parses pagination params from a request URL.
 * Defaults: page=1, limit=25, maxLimit=100
 */
export function parsePagination(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Returns a paginated JSON response.
 */
export function paginatedResponse<T>(data: T[], total: number, page: number, limit: number) {
  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

/**
 * Handles errors uniformly — strips Zod details from client response.
 */
export function handleApiError(err: unknown) {
  if (err instanceof z.ZodError) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  console.error("[API Error]", err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
