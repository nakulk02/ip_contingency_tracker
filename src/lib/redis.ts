import Redis from "ioredis";
import { logger } from "./logger";

const globalForRedis = globalThis as unknown as {
  redis: Redis | null | undefined;
};

/**
 * Redis client, or null when REDIS_URL isn't configured.
 *
 * Redis is optional infrastructure: rate limiting falls back to an
 * in-memory limiter when it's unavailable (see rate-limit.ts). This
 * module intentionally does NOT default to redis://localhost:6379 when
 * REDIS_URL is unset, since that would silently attempt a real network
 * connection to a host that was never configured, rather than making
 * the "no Redis configured" case an explicit, checkable state.
 */
function createRedisClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  const client = new Redis(url, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
  });

  client.on("error", (err) => {
    logger.warn(
      { err: err.message },
      "Redis connection error (rate limiting will fall back to in-memory)"
    );
  });

  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;
