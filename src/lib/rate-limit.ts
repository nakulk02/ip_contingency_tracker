import { RateLimiterRedis, RateLimiterMemory } from "rate-limiter-flexible";
import { NextResponse } from "next/server";
import { redis } from "./redis";

let rateLimiter: RateLimiterRedis | RateLimiterMemory;

try {
  rateLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: "rl",
    points: 60,
    duration: 60,
  });
} catch {
  rateLimiter = new RateLimiterMemory({
    keyPrefix: "rl",
    points: 60,
    duration: 60,
  });
}

const authLimiter = new RateLimiterMemory({
  keyPrefix: "rl_auth",
  points: 10,
  duration: 300,
});

export async function rateLimit(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "anonymous";

  try {
    await rateLimiter.consume(ip);
    return null;
  } catch {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }
}

export async function rateLimitAuth(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "anonymous";

  try {
    await authLimiter.consume(ip);
    return null;
  } catch {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 }
    );
  }
}
