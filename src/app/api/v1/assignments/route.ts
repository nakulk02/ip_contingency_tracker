import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";
import { parsePagination, paginatedResponse, handleApiError } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { createAssignmentWithAudit } from "@/lib/transaction-helper";
import { canCreateAssignment } from "@/lib/jurisdiction-compliance";

const VALID_STATUSES = ["SIGNED", "MISSING", "PENDING"] as const;

const createAssignmentSchema = z.object({
  personId: z.string().min(1),
  ipAssetId: z.string().nullable().optional(),
  scope: z.enum(["COMPANY_WIDE", "ASSET_SPECIFIC"]).optional(),
  signedDate: z.string().nullable().optional(),
  fileReference: z.string().nullable().optional(),
  status: z.enum(VALID_STATUSES).optional(),
  notes: z.string().nullable().optional(),
  reason: z.string().optional(),
  skipComplianceCheck: z.boolean().optional().default(false), // Allow override
});

export async function GET(req: Request) {
  const limited = await rateLimit(req);
  if (limited) return limited;

  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const { page, limit, skip } = parsePagination(req);

  const where: Record<string, any> = { deletedAt: null };
  const statusParam = searchParams.get("status");
  const personIdParam = searchParams.get("personId");
  if (statusParam && (VALID_STATUSES as readonly string[]).includes(statusParam)) where.status = statusParam;
  if (personIdParam) where.personId = personIdParam;

  const [assignments, total] = await Promise.all([
    prisma.assignmentAgreement.findMany({
      where,
      include: {
        person: { select: { id: true, name: true, role: true } },
        ipAsset: { select: { id: true, title: true, type: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.assignmentAgreement.count({ where }),
  ]);

  return paginatedResponse(assignments, total, page, limit);
}

export async function POST(req: Request) {
  const limited = await rateLimit(req);
  if (limited) return limited;

  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  try {
    const body = await req.json();
    const { reason, skipComplianceCheck, ...data } = createAssignmentSchema.parse(body);

    // Validate jurisdiction compliance if asset is specified
    if (data.ipAssetId && !skipComplianceCheck) {
      const asset = await prisma.ipAsset.findUnique({
        where: { id: data.ipAssetId },
      });

      if (asset) {
        const { allowed, reason: complianceReason } = canCreateAssignment(
          asset.jurisdiction,
          asset.type as "PATENT" | "TRADEMARK",
          asset.status
        );

        if (!allowed) {
          return NextResponse.json(
            {
              error: "Compliance violation",
              message: complianceReason,
              hint: "Add skipComplianceCheck: true to override (not recommended)",
            },
            { status: 400 }
          );
        }
      }
    }

    const assignment = await createAssignmentWithAudit(
      {
        ...data,
        ipAssetId: data.ipAssetId || null,
        signedDate: data.signedDate ? new Date(data.signedDate) : null,
        scope: data.scope || "COMPANY_WIDE",
        status: data.status || "MISSING",
      },
      {
        userId: session!.user!.id,
        userName: session!.user!.name || "Unknown",
        userEmail: session!.user!.email || "unknown@example.com",
        reason,
      }
    );

    // Fetch full assignment with relations for response
    const fullAssignment = await prisma.assignmentAgreement.findUnique({
      where: { id: assignment.id },
      include: {
        person: { select: { id: true, name: true } },
        ipAsset: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({ data: fullAssignment }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
