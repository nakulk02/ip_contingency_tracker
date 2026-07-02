/**
 * @jest-environment node
 */

// Mock env before anything imports it (prisma.ts self-executes env validation on import)
jest.mock("@/lib/env", () => ({ env: {} }));

const mockQueryRaw = jest.fn();
jest.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
  },
}));

jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

import { GET } from "../route";

describe("GET /api/health/ready", () => {
  beforeEach(() => {
    mockQueryRaw.mockReset();
  });

  it("returns 200 with status ready when the database responds", async () => {
    mockQueryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ready");
  });

  it("returns 503 with status not_ready when the database query throws", async () => {
    mockQueryRaw.mockRejectedValueOnce(new Error("connection refused"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("not_ready");
    expect(body.reason).toBe("database_unreachable");
  });

  it("returns 503 when the database check times out", async () => {
    mockQueryRaw.mockImplementationOnce(() => new Promise(() => {})); // never resolves

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("not_ready");
  }, 10000);
});
