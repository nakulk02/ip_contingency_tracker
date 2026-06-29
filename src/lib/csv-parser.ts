/**
 * CSV Parser for Bulk Imports
 * Handles parsing CSV files for people and IP assets
 */

import { z } from "zod";

export interface ParsedPerson {
  name: string;
  email: string | null;
  role: "FOUNDER" | "EMPLOYEE" | "CONTRACTOR" | "ADVISOR";
  startDate: Date;
  endDate: Date | null;
}

export interface ParsedAsset {
  type: "PATENT" | "TRADEMARK";
  title: string;
  jurisdiction: string;
  filingDate: Date | null;
  status: "DRAFT" | "FILED" | "PUBLISHED" | "REGISTERED" | "EXPIRED" | "ABANDONED";
  registrationNumber: string | null;
  description: string | null;
}

const personRowSchema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().email().nullable().default(null),
  role: z.enum(["FOUNDER", "EMPLOYEE", "CONTRACTOR", "ADVISOR"]),
  startDate: z.string().min(1, "Start date required"),
  endDate: z.string().nullable().default(null),
});

const assetRowSchema = z.object({
  type: z.enum(["PATENT", "TRADEMARK"]),
  title: z.string().min(1, "Title required"),
  jurisdiction: z.string().min(1, "Jurisdiction required"),
  filingDate: z.string().nullable().default(null),
  status: z.enum(["DRAFT", "FILED", "PUBLISHED", "REGISTERED", "EXPIRED", "ABANDONED"]).default("DRAFT"),
  registrationNumber: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
});

/**
 * Parse CSV string into rows
 */
export function parseCSV(csvContent: string): string[][] {
  const lines = csvContent.trim().split("\n");
  if (lines.length < 2) {
    throw new Error("CSV must have header row and at least one data row");
  }

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows: string[][] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    if (values.length !== headers.length) {
      throw new Error(`Row ${i + 1}: expected ${headers.length} columns, got ${values.length}`);
    }
    rows.push(values);
  }

  return rows;
}

/**
 * Convert CSV rows to objects with header mapping
 */
export function mapRowsToObjects(headers: string[], rows: string[][]): Record<string, string>[] {
  return rows.map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      obj[header.toLowerCase()] = row[idx];
    });
    return obj;
  });
}

/**
 * Parse people from CSV
 * Expected headers: name, email, role, startDate, endDate
 */
export function parsePeopleFromCSV(csvContent: string): { success: ParsedPerson[]; errors: string[] } {
  const lines = csvContent.trim().split("\n");
  if (lines.length < 2) {
    return { success: [], errors: ["CSV must have header row and at least one data row"] };
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const success: ParsedPerson[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "") continue; // Skip empty lines

    const values = lines[i].split(",").map((v) => v.trim());
    const row: Record<string, any> = {};

    headers.forEach((header, idx) => {
      row[header] = values[idx] || null;
    });

    try {
      const validated = personRowSchema.parse(row);
      success.push({
        ...validated,
        startDate: new Date(validated.startDate),
        endDate: validated.endDate ? new Date(validated.endDate) : null,
      });
    } catch (err) {
      const errorMsg = err instanceof z.ZodError ? err.errors[0]?.message : String(err);
      errors.push(`Row ${i + 1}: ${errorMsg}`);
    }
  }

  return { success, errors };
}

/**
 * Parse IP assets from CSV
 * Expected headers: type, title, jurisdiction, filingDate, status, registrationNumber, description
 */
export function parseAssetsFromCSV(csvContent: string): { success: ParsedAsset[]; errors: string[] } {
  const lines = csvContent.trim().split("\n");
  if (lines.length < 2) {
    return { success: [], errors: ["CSV must have header row and at least one data row"] };
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const success: ParsedAsset[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "") continue; // Skip empty lines

    const values = lines[i].split(",").map((v) => v.trim());
    const row: Record<string, any> = {};

    headers.forEach((header, idx) => {
      row[header] = values[idx] || null;
    });

    try {
      const validated = assetRowSchema.parse(row);
      success.push({
        ...validated,
        filingDate: validated.filingDate ? new Date(validated.filingDate) : null,
      });
    } catch (err) {
      const errorMsg = err instanceof z.ZodError ? err.errors[0]?.message : String(err);
      errors.push(`Row ${i + 1}: ${errorMsg}`);
    }
  }

  return { success, errors };
}
