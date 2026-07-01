import { createDocument } from "zod-openapi";
import { z } from "zod";
import {
  AssetTypeEnum,
  AssetStatusEnum,
  PersonRoleEnum,
  AgreementStatusEnum,
  AuditActionEnum,
  ErrorResponseSchema,
  CreatePersonSchema,
  UpdatePersonSchema,
  CreateIpAssetSchema,
  UpdateIpAssetSchema,
  CreateAssignmentSchema,
  UpdateAssignmentSchema,
  CreateNoteSchema,
  UpdateNoteSchema,
  RegisterSchema,
  CsvImportSchema,
  NaturalLanguageQuerySchema,
} from "./schemas";

const idParam = z.object({ id: z.string().describe("Record ID") });
const pageQuery = z.object({
  page: z.coerce.number().int().min(1).optional().describe("Page number (default 1)"),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe("Page size, max 100 (default 25)"),
});

const errorResponses = {
  "400": {
    description: "Validation error",
    content: { "application/json": { schema: ErrorResponseSchema } },
  },
  "401": {
    description: "Unauthorized",
    content: { "application/json": { schema: ErrorResponseSchema } },
  },
  "404": {
    description: "Not found",
    content: { "application/json": { schema: ErrorResponseSchema } },
  },
  "429": {
    description: "Rate limited",
    content: { "application/json": { schema: ErrorResponseSchema } },
  },
  "500": {
    description: "Internal server error",
    content: { "application/json": { schema: ErrorResponseSchema } },
  },
};

const security = [{ sessionCookie: [] }];

export function generateOpenApiDocument() {
  return createDocument({
    openapi: "3.1.0",
    info: {
      title: "IP Contingency Tracker API",
      version: "1.0.0",
      description:
        "Internal API for tracking IP ownership gaps, assignment agreements, and deadline risk. " +
        "All /api/v1/* routes require an authenticated session unless noted otherwise. " +
        "The unversioned /api/* routes (e.g. /api/people, /api/ip-assets) are deprecated — use /api/v1/* instead.",
    },
    servers: [{ url: "/api/v1", description: "Current API (v1)" }],
    components: {
      securitySchemes: {
        sessionCookie: {
          type: "apiKey",
          in: "cookie",
          name: "next-auth.session-token",
          description: "NextAuth session cookie, set after signing in via /api/auth",
        },
      },
    },
    paths: {
      // ---- People ----
      "/people": {
        get: {
          tags: ["People"],
          summary: "List people",
          security,
          requestParams: {
            query: pageQuery.extend({
              role: PersonRoleEnum.optional(),
              status: z.enum(["current", "former"]).optional(),
              gapsOnly: z.coerce.boolean().optional(),
              startDateFrom: z.string().optional().describe("ISO 8601 date"),
              startDateTo: z.string().optional().describe("ISO 8601 date"),
            }),
          },
          responses: {
            "200": { description: "Paginated list of people" },
            ...errorResponses,
          },
        },
        post: {
          tags: ["People"],
          summary: "Create a person",
          security,
          requestBody: { content: { "application/json": { schema: CreatePersonSchema } } },
          responses: { "201": { description: "Person created" }, ...errorResponses },
        },
      },
      "/people/{id}": {
        get: {
          tags: ["People"],
          summary: "Get a person by ID",
          security,
          requestParams: { path: idParam },
          responses: { "200": { description: "Person found" }, ...errorResponses },
        },
        put: {
          tags: ["People"],
          summary: "Update a person",
          security,
          requestParams: { path: idParam },
          requestBody: { content: { "application/json": { schema: UpdatePersonSchema } } },
          responses: { "200": { description: "Person updated" }, ...errorResponses },
        },
        delete: {
          tags: ["People"],
          summary: "Delete a person",
          security,
          requestParams: { path: idParam },
          responses: { "200": { description: "Person deleted" }, ...errorResponses },
        },
      },
      "/people/bulk-import": {
        post: {
          tags: ["People"],
          summary: "Bulk import people from CSV",
          security,
          requestBody: { content: { "application/json": { schema: CsvImportSchema } } },
          responses: { "201": { description: "Import results" }, ...errorResponses },
        },
      },

      // ---- IP Assets ----
      "/ip-assets": {
        get: {
          tags: ["IP Assets"],
          summary: "List IP assets",
          security,
          requestParams: {
            query: pageQuery.extend({
              type: AssetTypeEnum.optional(),
              status: AssetStatusEnum.optional(),
              jurisdiction: z.string().optional(),
              gapsOnly: z.coerce.boolean().optional(),
              filingDateFrom: z.string().optional(),
              filingDateTo: z.string().optional(),
            }),
          },
          responses: { "200": { description: "Paginated list of IP assets" }, ...errorResponses },
        },
        post: {
          tags: ["IP Assets"],
          summary: "Create an IP asset",
          security,
          requestBody: { content: { "application/json": { schema: CreateIpAssetSchema } } },
          responses: { "201": { description: "IP asset created" }, ...errorResponses },
        },
      },
      "/ip-assets/{id}": {
        get: {
          tags: ["IP Assets"],
          summary: "Get an IP asset by ID",
          security,
          requestParams: { path: idParam },
          responses: { "200": { description: "IP asset found" }, ...errorResponses },
        },
        put: {
          tags: ["IP Assets"],
          summary: "Update an IP asset",
          security,
          requestParams: { path: idParam },
          requestBody: { content: { "application/json": { schema: UpdateIpAssetSchema } } },
          responses: { "200": { description: "IP asset updated" }, ...errorResponses },
        },
        delete: {
          tags: ["IP Assets"],
          summary: "Delete an IP asset",
          security,
          requestParams: { path: idParam },
          responses: { "200": { description: "IP asset deleted" }, ...errorResponses },
        },
      },
      "/ip-assets/bulk-import": {
        post: {
          tags: ["IP Assets"],
          summary: "Bulk import IP assets from CSV",
          security,
          requestBody: { content: { "application/json": { schema: CsvImportSchema } } },
          responses: { "201": { description: "Import results" }, ...errorResponses },
        },
      },

      // ---- Assignments ----
      "/assignments": {
        get: {
          tags: ["Assignments"],
          summary: "List assignment agreements",
          security,
          requestParams: {
            query: pageQuery.extend({
              status: AgreementStatusEnum.optional(),
              personId: z.string().optional(),
            }),
          },
          responses: { "200": { description: "Paginated list of assignments" }, ...errorResponses },
        },
        post: {
          tags: ["Assignments"],
          summary: "Create an assignment agreement",
          security,
          requestBody: { content: { "application/json": { schema: CreateAssignmentSchema } } },
          responses: { "201": { description: "Assignment created" }, ...errorResponses },
        },
      },
      "/assignments/{id}": {
        get: {
          tags: ["Assignments"],
          summary: "Get an assignment by ID",
          security,
          requestParams: { path: idParam },
          responses: { "200": { description: "Assignment found" }, ...errorResponses },
        },
        put: {
          tags: ["Assignments"],
          summary: "Update an assignment",
          security,
          requestParams: { path: idParam },
          requestBody: { content: { "application/json": { schema: UpdateAssignmentSchema } } },
          responses: { "200": { description: "Assignment updated" }, ...errorResponses },
        },
        delete: {
          tags: ["Assignments"],
          summary: "Delete an assignment",
          security,
          requestParams: { path: idParam },
          responses: { "200": { description: "Assignment deleted" }, ...errorResponses },
        },
      },
      "/assignments/{id}/audit-history": {
        get: {
          tags: ["Assignments"],
          summary: "Get audit history for an assignment",
          security,
          requestParams: { path: idParam },
          responses: { "200": { description: "Audit log entries" }, ...errorResponses },
        },
      },

      // ---- Audit Logs ----
      "/audit-logs": {
        get: {
          tags: ["Audit Logs"],
          summary: "List audit logs by action type",
          security,
          requestParams: { query: pageQuery.extend({ action: AuditActionEnum }) },
          responses: { "200": { description: "Paginated list of audit logs" }, ...errorResponses },
        },
      },
      "/audit-logs/user": {
        get: {
          tags: ["Audit Logs"],
          summary: "List audit logs for the current authenticated user",
          security,
          requestParams: { query: pageQuery },
          responses: {
            "200": { description: "Paginated list of the user's audit logs" },
            ...errorResponses,
          },
        },
      },

      // ---- Dashboard ----
      "/dashboard/ownership-gaps": {
        get: {
          tags: ["Dashboard"],
          summary: "Get ownership gap summary",
          security,
          requestParams: {
            query: z.object({ limit: z.coerce.number().int().min(1).max(50).optional() }),
          },
          responses: { "200": { description: "Ownership gap summary" }, ...errorResponses },
        },
      },

      // ---- Notifications ----
      "/notifications/overdue": {
        get: {
          tags: ["Notifications"],
          summary: "Get overdue IP assignments",
          security,
          requestParams: {
            query: z.object({ thresholdDays: z.coerce.number().int().min(1).optional() }),
          },
          responses: {
            "200": { description: "Overdue assignments and violations" },
            ...errorResponses,
          },
        },
      },

      // ---- Reports ----
      "/reports/gap-report": {
        get: {
          tags: ["Reports"],
          summary: "Export IP gap report",
          security,
          requestParams: { query: z.object({ format: z.enum(["json", "csv"]).optional() }) },
          responses: {
            "200": { description: "Gap report (JSON or CSV depending on format param)" },
            ...errorResponses,
          },
        },
      },
      "/reports/compliance-audit": {
        get: {
          tags: ["Reports"],
          summary: "Generate compliance audit report",
          security,
          responses: { "200": { description: "Compliance audit report" }, ...errorResponses },
        },
      },
      "/reports/executive-summary": {
        get: {
          tags: ["Reports"],
          summary: "Generate executive summary",
          security,
          responses: { "200": { description: "Executive summary" }, ...errorResponses },
        },
      },

      // ---- Notes ----
      "/notes": {
        get: {
          tags: ["Notes"],
          summary: "List the current user's notes",
          security,
          requestParams: { query: pageQuery },
          responses: { "200": { description: "Paginated list of notes" }, ...errorResponses },
        },
        post: {
          tags: ["Notes"],
          summary: "Create a note",
          security,
          requestBody: { content: { "application/json": { schema: CreateNoteSchema } } },
          responses: { "201": { description: "Note created" }, ...errorResponses },
        },
      },
      "/notes/{id}": {
        get: {
          tags: ["Notes"],
          summary: "Get a note by ID",
          security,
          requestParams: { path: idParam },
          responses: { "200": { description: "Note found" }, ...errorResponses },
        },
        put: {
          tags: ["Notes"],
          summary: "Update a note",
          security,
          requestParams: { path: idParam },
          requestBody: { content: { "application/json": { schema: UpdateNoteSchema } } },
          responses: { "200": { description: "Note updated" }, ...errorResponses },
        },
        delete: {
          tags: ["Notes"],
          summary: "Delete a note",
          security,
          requestParams: { path: idParam },
          responses: { "200": { description: "Note deleted" }, ...errorResponses },
        },
      },

      // ---- Intelligence ----
      "/intelligence/analyze-gaps": {
        get: {
          tags: ["Intelligence"],
          summary: "Analyze ownership gaps for patterns and risk areas",
          security,
          responses: { "200": { description: "Gap analysis result" }, ...errorResponses },
        },
      },
      "/intelligence/advisory": {
        get: {
          tags: ["Intelligence"],
          summary: "Generate an executive advisory report",
          security,
          responses: { "200": { description: "Advisory report" }, ...errorResponses },
        },
      },
      "/intelligence/anomalies": {
        get: {
          tags: ["Intelligence"],
          summary: "Detect anomalies and red flags across all gaps",
          security,
          responses: { "200": { description: "Detected anomalies" }, ...errorResponses },
        },
      },
      "/intelligence/priorities": {
        get: {
          tags: ["Intelligence"],
          summary: "Rank gaps by strategic priority",
          security,
          responses: { "200": { description: "Ranked gaps" }, ...errorResponses },
        },
      },
      "/intelligence/compliance": {
        get: {
          tags: ["Intelligence"],
          summary: "Check compliance for a single gap",
          security,
          requestParams: { query: z.object({ gapId: z.string() }) },
          responses: { "200": { description: "Compliance check result" }, ...errorResponses },
        },
      },
      "/intelligence/predict": {
        get: {
          tags: ["Intelligence"],
          summary: "Predict likely outcome and risk for a single gap",
          security,
          requestParams: { query: z.object({ gapId: z.string() }) },
          responses: { "200": { description: "Risk prediction" }, ...errorResponses },
        },
      },
      "/intelligence/recommendations": {
        get: {
          tags: ["Intelligence"],
          summary: "Get recommended actions for a single gap",
          security,
          requestParams: { query: z.object({ gapId: z.string() }) },
          responses: { "200": { description: "Recommended actions" }, ...errorResponses },
        },
      },
      "/intelligence/query": {
        post: {
          tags: ["Intelligence"],
          summary: "Query gaps using a natural language question",
          security,
          requestBody: { content: { "application/json": { schema: NaturalLanguageQuerySchema } } },
          responses: { "200": { description: "Query result" }, ...errorResponses },
        },
      },

      // ---- Auth ----
      "/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a new user",
          requestBody: { content: { "application/json": { schema: RegisterSchema } } },
          responses: { "200": { description: "User created" }, ...errorResponses },
        },
      },
    },
  });
}
