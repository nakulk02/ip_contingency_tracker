import { NextResponse } from "next/server";

/**
 * GET /api/health
 * Liveness check: confirms the process is running and can respond to
 * requests. Deliberately checks nothing else (no DB, no external
 * services) so a slow dependency doesn't make an otherwise-healthy
 * process look dead to an orchestrator's liveness probe.
 *
 * For "can this instance actually serve real requests", use
 * /api/health/ready instead.
 */
export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
