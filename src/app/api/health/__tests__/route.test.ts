/**
 * @jest-environment node
 */
import { GET } from "../route";

describe("GET /api/health", () => {
  it("returns 200 with status ok", async () => {
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
  });

  it("includes a timestamp", async () => {
    const response = await GET();
    const body = await response.json();
    expect(body.timestamp).toBeDefined();
    expect(new Date(body.timestamp).toString()).not.toBe("Invalid Date");
  });
});
