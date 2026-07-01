import { NextResponse } from "next/server";
import { generateOpenApiDocument } from "@/lib/openapi/document";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";

/**
 * GET /api/openapi
 * Serves the generated OpenAPI 3.1 document as JSON.
 * Consumed by the Swagger UI viewer at /api-docs.
 *
 * Requires an authenticated session, same as the rest of the API,
 * since the spec exposes internal route structure and field names.
 */
export async function GET() {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const document = generateOpenApiDocument();
  return NextResponse.json(document);
}
