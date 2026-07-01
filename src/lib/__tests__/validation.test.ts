import {
  csvImportSchema,
  naturalLanguageQuerySchema,
  MAX_CSV_LENGTH,
  MAX_QUERY_LENGTH,
} from "../validation";

describe("csvImportSchema", () => {
  it("accepts a valid, non-empty CSV string", () => {
    const result = csvImportSchema.safeParse({ csv: "a,b,c\n1,2,3" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty string", () => {
    const result = csvImportSchema.safeParse({ csv: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing csv field", () => {
    const result = csvImportSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects a non-string csv field", () => {
    const result = csvImportSchema.safeParse({ csv: 12345 });
    expect(result.success).toBe(false);
  });

  it("accepts a CSV exactly at the maximum length", () => {
    const csv = "a".repeat(MAX_CSV_LENGTH);
    const result = csvImportSchema.safeParse({ csv });
    expect(result.success).toBe(true);
  });

  it("rejects a CSV over the maximum length", () => {
    const csv = "a".repeat(MAX_CSV_LENGTH + 1);
    const result = csvImportSchema.safeParse({ csv });
    expect(result.success).toBe(false);
  });
});

describe("naturalLanguageQuerySchema", () => {
  it("accepts a valid question", () => {
    const result = naturalLanguageQuerySchema.safeParse({
      question: "Which assets are missing signed assignments?",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty question", () => {
    const result = naturalLanguageQuerySchema.safeParse({ question: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing question field", () => {
    const result = naturalLanguageQuerySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("accepts a question exactly at the maximum length", () => {
    const question = "a".repeat(MAX_QUERY_LENGTH);
    const result = naturalLanguageQuerySchema.safeParse({ question });
    expect(result.success).toBe(true);
  });

  it("rejects a question over the maximum length", () => {
    const question = "a".repeat(MAX_QUERY_LENGTH + 1);
    const result = naturalLanguageQuerySchema.safeParse({ question });
    expect(result.success).toBe(false);
  });
});
