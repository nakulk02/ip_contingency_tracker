import { NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { AppError } from "./errors";

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
 * Handles errors uniformly across all API routes.
 *
 * Recognizes:
 *  - AppError subclasses (NotFoundError, ValidationError, etc.) -> their own status/code
 *  - ZodError -> 400 with field-level details
 *  - Prisma known request errors -> mapped to sensible status codes
 *  - anything else -> logged and returned as a generic 500
 */
export function handleApiError(err: unknown) {
  if (err instanceof AppError) {
    return NextResponse.json(
      { error: err.message, code: err.code, ...(err.details ? { details: err.details } : {}) },
      { status: err.statusCode }
    );
  }

  if (err instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: "Invalid input",
        code: "VALIDATION_ERROR",
        details: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  if (err instanceof PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined)?.join(", ") ?? "field";
      return NextResponse.json(
        { error: `A record with this ${target} already exists`, code: "CONFLICT" },
        { status: 409 }
      );
    }
    // Record not found (e.g. update/delete on missing row)
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Record not found", code: "NOT_FOUND" }, { status: 404 });
    }
    // Foreign key constraint failure
    if (err.code === "P2003") {
      return NextResponse.json(
        { error: "Related record not found", code: "INVALID_REFERENCE" },
        { status: 400 }
      );
    }
  }

  console.error("[API Error]", err);
  return NextResponse.json(
    { error: "Internal server error", code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}

/**
 * Wraps a route handler so thrown errors (AppError, ZodError, Prisma errors, etc.)
 * are automatically converted to a standardized JSON response, removing the need
 * for repetitive try/catch blocks in every route.
 *
 * Usage:
 *   export const GET = asyncHandler(async (req) => { ... });
 */
export function asyncHandler<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      return handleApiError(err);
    }
  };
}
