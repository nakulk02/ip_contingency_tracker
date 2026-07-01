import { z } from "zod";

/**
 * OpenAPI-annotated versions of the Zod schemas used across the API routes.
 *
 * These mirror the validation schemas defined inline in each route file.
 * They are kept here (rather than importing the route-local schemas directly)
 * so that documentation metadata (.meta()) doesn't leak into the schemas
 * actually used for runtime validation, and so route files don't need to
 * import an OpenAPI-specific dependency.
 *
 * If a route's validation schema changes, update the matching schema here.
 */

// ---- Shared enums ----
export const AssetTypeEnum = z.enum(["PATENT", "TRADEMARK"]).meta({ id: "AssetType" });
export const AssetStatusEnum = z
  .enum(["DRAFT", "FILED", "PUBLISHED", "REGISTERED", "EXPIRED", "ABANDONED"])
  .meta({ id: "AssetStatus" });
export const PersonRoleEnum = z
  .enum(["FOUNDER", "EMPLOYEE", "CONTRACTOR", "ADVISOR"])
  .meta({ id: "PersonRole" });
export const AgreementStatusEnum = z
  .enum(["SIGNED", "MISSING", "PENDING"])
  .meta({ id: "AgreementStatus" });
export const AgreementScopeEnum = z
  .enum(["COMPANY_WIDE", "ASSET_SPECIFIC"])
  .meta({ id: "AgreementScope" });
export const AuditActionEnum = z
  .enum(["CREATE", "UPDATE", "DELETE", "STATUS_CHANGE"])
  .meta({ id: "AuditAction" });

// ---- Error response ----
export const ErrorResponseSchema = z
  .object({
    error: z.string(),
    code: z.string().optional(),
    details: z.unknown().optional(),
  })
  .meta({ id: "ErrorResponse" });

// ---- People ----
export const CreatePersonSchema = z
  .object({
    name: z.string().min(1),
    email: z.string().email().nullable().optional(),
    role: PersonRoleEnum,
    startDate: z.string().min(1).describe("ISO 8601 date string"),
    endDate: z.string().nullable().optional().describe("ISO 8601 date string"),
  })
  .meta({ id: "CreatePersonInput" });

export const UpdatePersonSchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.string().email().nullable().optional(),
    role: PersonRoleEnum.optional(),
    startDate: z.string().optional(),
    endDate: z.string().nullable().optional(),
  })
  .meta({ id: "UpdatePersonInput" });

// ---- IP Assets ----
export const CreateIpAssetSchema = z
  .object({
    type: AssetTypeEnum,
    title: z.string().min(1),
    jurisdiction: z.string().min(1),
    filingDate: z.string().nullable().optional().describe("ISO 8601 date string"),
    status: AssetStatusEnum.optional(),
    registrationNumber: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
  })
  .meta({ id: "CreateIpAssetInput" });

export const UpdateIpAssetSchema = z
  .object({
    type: AssetTypeEnum.optional(),
    title: z.string().min(1).optional(),
    jurisdiction: z.string().min(1).optional(),
    filingDate: z.string().nullable().optional(),
    status: AssetStatusEnum.optional(),
    registrationNumber: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
  })
  .meta({ id: "UpdateIpAssetInput" });

// ---- Assignments ----
export const CreateAssignmentSchema = z
  .object({
    personId: z.string().min(1),
    ipAssetId: z.string().nullable().optional(),
    scope: AgreementScopeEnum.optional(),
    signedDate: z.string().nullable().optional(),
    fileReference: z.string().nullable().optional(),
    status: AgreementStatusEnum.optional(),
    notes: z.string().nullable().optional(),
    reason: z.string().optional().describe("Optional audit reason for this change"),
    skipComplianceCheck: z.boolean().optional().default(false),
  })
  .meta({ id: "CreateAssignmentInput" });

export const UpdateAssignmentSchema = z
  .object({
    personId: z.string().min(1).optional(),
    ipAssetId: z.string().nullable().optional(),
    scope: AgreementScopeEnum.optional(),
    signedDate: z.string().nullable().optional(),
    fileReference: z.string().nullable().optional(),
    status: AgreementStatusEnum.optional(),
    notes: z.string().nullable().optional(),
    reason: z.string().optional(),
  })
  .meta({ id: "UpdateAssignmentInput" });

// ---- Notes ----
export const CreateNoteSchema = z
  .object({
    title: z.string().min(1),
    body: z.string().optional(),
  })
  .meta({ id: "CreateNoteInput" });

export const UpdateNoteSchema = z
  .object({
    title: z.string().min(1).optional(),
    body: z.string().optional(),
  })
  .meta({ id: "UpdateNoteInput" });

// ---- Auth ----
export const RegisterSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1).optional(),
  })
  .meta({ id: "RegisterInput" });

// ---- Bulk import ----
export const CsvImportSchema = z
  .object({
    csv: z.string().min(1).describe("Raw CSV text, max ~2MB"),
  })
  .meta({ id: "CsvImportInput" });

// ---- Intelligence ----
export const NaturalLanguageQuerySchema = z
  .object({
    question: z.string().min(1).max(2000),
  })
  .meta({ id: "IntelligenceQueryInput" });
