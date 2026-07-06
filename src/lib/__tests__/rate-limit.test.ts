/**
 * @jest-environment node
 */

jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

function makeRequest(ip: string) {
  return new Request("http://localhost/api/v1/ip-assets", {
    headers: { "x-forwarded-for": ip },
  });
}

describe("rateLimit without Redis configured", () => {
  const originalRedisUrl = process.env.REDIS_URL;

  beforeAll(() => {
    delete process.env.REDIS_URL;
  });

  afterAll(() => {
    if (originalRedisUrl !== undefined) process.env.REDIS_URL = originalRedisUrl;
  });

  it("uses an in-memory limiter and does not construct a Redis client", async () => {
    jest.resetModules();
    const { redis } = await import("../redis");
    expect(redis).toBeNull();
  });

  it("allows requests under the limit and rejects once exceeded", async () => {
    jest.resetModules();
    const { rateLimit } = await import("../rate-limit");
    const req = makeRequest("10.0.0.1");

    let allowed = 0;
    let rejected = 0;
    for (let i = 0; i < 65; i++) {
      const result = await rateLimit(req);
      if (result === null) allowed++;
      else rejected++;
    }

    expect(allowed).toBe(60);
    expect(rejected).toBe(5);
  });
});

describe("rateLimit with a working Redis connection", () => {
  const originalRedisUrl = process.env.REDIS_URL;

  beforeAll(() => {
    process.env.REDIS_URL = "redis://mock:6379";
    jest.mock("ioredis", () => {
      const RedisMock = jest.requireActual("ioredis-mock");
      return { __esModule: true, default: RedisMock };
    });
  });

  afterAll(() => {
    jest.unmock("ioredis");
    if (originalRedisUrl !== undefined) {
      process.env.REDIS_URL = originalRedisUrl;
    } else {
      delete process.env.REDIS_URL;
    }
  });

  it("rate limits correctly using the Redis-backed store", async () => {
    jest.resetModules();
    const { rateLimit } = await import("../rate-limit");
    const req = makeRequest("10.0.0.2");

    let allowed = 0;
    let rejected = 0;
    for (let i = 0; i < 65; i++) {
      const result = await rateLimit(req);
      if (result === null) allowed++;
      else rejected++;
    }

    expect(allowed).toBe(60);
    expect(rejected).toBe(5);
  });
});

describe("rateLimit when Redis is configured but unreachable", () => {
  const originalRedisUrl = process.env.REDIS_URL;

  beforeAll(() => {
    process.env.REDIS_URL = "redis://nonexistent-host-xyz:6379";
  });

  afterAll(() => {
    if (originalRedisUrl !== undefined) {
      process.env.REDIS_URL = originalRedisUrl;
    } else {
      delete process.env.REDIS_URL;
    }
  });

  it("falls back to the insurance limiter instead of blocking every request", async () => {
    jest.resetModules();
    const { rateLimit } = await import("../rate-limit");
    const req = makeRequest("10.0.0.3");

    // The critical regression this guards against: previously, any error
    // from the Redis store (including an unreachable host) was treated
    // identically to "rate limit exceeded," so every single request
    // during a Redis outage would return 429 and block all traffic.
    const result = await rateLimit(req);
    expect(result).toBeNull();
  }, 10000);
});
