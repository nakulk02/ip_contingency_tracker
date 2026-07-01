import { z } from "zod";

/**
 * Maximum accepted size (in characters) for a raw CSV upload body.
 * Prevents unbounded payloads from being fully parsed before rejection.
 */
export const MAX_CSV_LENGTH = 2_000_000; // ~2MB of text

/**
 * Shared schema for bulk-import endpoints that accept raw CSV text.
 */
export const csvImportSchema = z.object({
  csv: z
    .string()
    .min(1, "CSV content required")
    .max(MAX_CSV_LENGTH, `CSV content exceeds maximum size of ${MAX_CSV_LENGTH} characters`),
});

/**
 * Maximum accepted length for a free-text natural language query,
 * such as the intelligence query tool's "question" field.
 */
export const MAX_QUERY_LENGTH = 2_000;

export const naturalLanguageQuerySchema = z.object({
  question: z
    .string()
    .min(1, "question field required")
    .max(MAX_QUERY_LENGTH, `question exceeds maximum length of ${MAX_QUERY_LENGTH} characters`),
});
