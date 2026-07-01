/**
 * @jest-environment node
 */
import { parsePagination } from "../api-utils";

function makeRequest(query: string) {
  return new Request(`https://example.com/api/v1/things${query}`);
}

describe("parsePagination", () => {
  it("defaults to page 1, limit 25, skip 0 when no params given", () => {
    const result = parsePagination(makeRequest(""));
    expect(result).toEqual({ page: 1, limit: 25, skip: 0 });
  });

  it("parses explicit page and limit", () => {
    const result = parsePagination(makeRequest("?page=3&limit=10"));
    expect(result).toEqual({ page: 3, limit: 10, skip: 20 });
  });

  it("clamps page below 1 up to 1", () => {
    const result = parsePagination(makeRequest("?page=0"));
    expect(result.page).toBe(1);
  });

  it("clamps negative page up to 1", () => {
    const result = parsePagination(makeRequest("?page=-5"));
    expect(result.page).toBe(1);
  });

  it("clamps limit above 100 down to 100", () => {
    const result = parsePagination(makeRequest("?limit=500"));
    expect(result.limit).toBe(100);
  });

  it("clamps limit below 1 up to 1", () => {
    const result = parsePagination(makeRequest("?limit=0"));
    expect(result.limit).toBe(1);
  });

  it("falls back to defaults for non-numeric params", () => {
    const result = parsePagination(makeRequest("?page=abc&limit=xyz"));
    expect(result).toEqual({ page: 1, limit: 25, skip: 0 });
  });

  it("computes skip correctly for page 5, limit 20", () => {
    const result = parsePagination(makeRequest("?page=5&limit=20"));
    expect(result.skip).toBe(80);
  });
});
