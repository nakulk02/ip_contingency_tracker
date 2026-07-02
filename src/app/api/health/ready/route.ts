import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

const DB_CHECK_TIMEOUT_MS = 3000;

/**
 * GET /api/health/ready
 * Readiness check: confirms the app can actually serve real requests,
 * specifically that the database is reachable. Returns 503 (not 200)
 * when the dependency check fails, since readiness probes use the
 * status code to decide whether to route traffic here.
 *
 * The DB check is bounded by a timeout so a hung connection produces
 * a fast, definite "not ready" instead of leaving the probe hanging.
 *
 * The prisma import is dynamic (inside the try block) rather than a
 * top-level import, so that a failure to construct the Prisma client
 * itself (e.g. missing generated client, bad connection string) is
 * caught and reported as a clean 503 instead of crashing the route
 * with an unhandled module-load error.
 */
export async function GET() {
  try {
    const { prisma } = await import("@/lib/prisma");

    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database check timed out")), DB_CHECK_TIMEOUT_MS)
      ),
    ]);

    return NextResponse.json({ status: "ready", timestamp: new Date().toISOString() });
  } catch (err) {
    logger.error({ err }, "Readiness check failed: database unreachable");
    return NextResponse.json(
      { status: "not_ready", reason: "database_unreachable", timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}
