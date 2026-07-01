/**
 * @jest-environment node
 */
import { generateOpenApiDocument } from "../openapi/document";

describe("generateOpenApiDocument", () => {
  it("generates a valid OpenAPI 3.1 document without throwing", () => {
    expect(() => generateOpenApiDocument()).not.toThrow();
  });

  it("includes the expected top-level metadata", () => {
    const doc = generateOpenApiDocument();
    expect(doc.openapi).toBe("3.1.0");
    expect(doc.info.title).toBe("IP Contingency Tracker API");
  });

  it("registers a security scheme for the session cookie", () => {
    const doc = generateOpenApiDocument();
    expect(doc.components?.securitySchemes?.sessionCookie).toBeDefined();
  });

  it("documents all core resource collections", () => {
    const doc = generateOpenApiDocument();
    const paths = Object.keys(doc.paths ?? {});
    for (const expected of ["/people", "/ip-assets", "/assignments", "/notes"]) {
      expect(paths).toContain(expected);
    }
  });

  it("documents every intelligence route", () => {
    const doc = generateOpenApiDocument();
    const paths = Object.keys(doc.paths ?? {});
    const intelligenceRoutes = paths.filter((p) => p.startsWith("/intelligence/"));
    expect(intelligenceRoutes.length).toBe(8);
  });

  it("marks mutating routes as requiring the session cookie", () => {
    const doc = generateOpenApiDocument();
    const createPerson = doc.paths?.["/people"]?.post;
    expect(createPerson?.security).toEqual([{ sessionCookie: [] }]);
  });

  it("does not require auth on the registration endpoint", () => {
    const doc = generateOpenApiDocument();
    const register = doc.paths?.["/auth/register"]?.post;
    expect(register?.security).toBeUndefined();
  });
});
