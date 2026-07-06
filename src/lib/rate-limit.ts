import { RateLimiterRedis, RateLimiterMemory } from "rate-limiter-flexible";
import { NextResponse } from "next/server";
import { redis } from "./redis";
import { logger } from "./logger";

/**
 * General API rate limiter: 60 requests/minute per IP.
 *
 * When REDIS_URL is configured, uses Redis so the limit is shared
 * correctly across multiple app instances. An insuranceLimiter (backed
 * by in-memory state) is attached so that if Redis becomes unreachable
 * at runtime, requests fall back to a per-instance limit instead of
 * every request failing closed with a 429 due to the store erroring.
 *
 * When REDIS_URL isn't configured (e.g. local development), uses an
 * in-memory limiter directly. This is correctly enforced per-instance
 * only, which is fine for a single-instance deployment.
 */
const insuranceLimiter = new RateLimiterMemory({
  keyPrefix: "rl_insurance",
  points: 60,
  duration: 60,
});

const rateLimiter: RateLimiterRedis | RateLimiterMemory = redis
  ? new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: "rl",
      points: 60,
      duration: 60,
      insuranceLimiter,
    })
  : new RateLimiterMemory({
      keyPrefix: "rl",
      points: 60,
      duration: 60,
    });

const authLimiter = new RateLimiterMemory({
  keyPrefix: "rl_auth",
  points: 10,
  duration: 300,
});

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "anonymous";
}

export async function rateLimit(req: Request) {
  const ip = getClientIp(req);

  try {
    await rateLimiter.consume(ip);
    return null;
  } catch (rejOrErr) {
    // rate-limiter-flexible rejects with a RateLimiterRes when the limit
    // was actually exceeded, or with a plain Error for unexpected backend
    // failures (only reachable here if the insurance limiter itself also
    // failed, which in-memory limiters don't do). Treat anything that
    // isn't a RateLimiterRes as a real error worth logging, but still
    // fail closed rather than letting an unknown failure mode bypass
    // rate limiting entirely.
    if (rejOrErr instanceof Error) {
      logger.error({ err: rejOrErr }, "Rate limiter failed unexpectedly");
    }
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
}

export async function rateLimitAuth(req: Request) {
  const ip = getClientIp(req);

  try {
    await authLimiter.consume(ip);
    return null;
  } catch {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
}
