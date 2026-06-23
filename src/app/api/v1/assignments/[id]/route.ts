import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { updateAssignmentWithAudit, deleteAssignmentWithAudit } from "@/lib/transaction-helper";

const updateAssignmentSchema = z.object({
  personId: z.string().min(1).optional(),
  ipAssetId: z.string().nullable().optional(),
  scope: z.enum(["COMPANY_WIDE", "ASSET_SPECIFIC"]).optional(),
  signedDate: z.string().nullable().optional(),
  fileReference: z.string().nullable().optional(),
  status: z.enum(["SIGNED", "MISSING", "PENDING"]).optional(),
  notes: z.string().nullable().optional(),
  reason: z.string().optional(), // Optional audit reason
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await rateLimit(req);
  if (limited) return limited;

  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { id } = await params;
  const assignment = await prisma.assignmentAgreement.findUnique({
    where: { id },
    include: {
      person: { select: { id: true, name: true, role: true } },
      ipAsset: { select: { id: true, title: true, type: true } },
    },
  });

  if (!assignment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: assignment });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await rateLimit(req);
  if (limited) return limited;

  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { id } = await params;

  try {
    const body = await req.json();
    const { reason, ...data } = updateAssignmentSchema.parse(body);

    const updateInput: Record<string, any> = {
      id,
      ...data,
    };

    if (data.signedDate !== undefined) {
      updateInput.signedDate = data.signedDate ? new Date(data.signedDate) : null;
    }

    const assignment = await updateAssignmentWithAudit(updateInput, {
      userId: session!.user!.id,
      userName: session!.user!.name || "Unknown",
      userEmail: session!.user!.email || "unknown@example.com",
      reason,
    });

    // Fetch full assignment with relations for response
    const fullAssignment = await prisma.assignmentAgreement.findUnique({
      where: { id: assignment.id },
      include: {
        person: { select: { id: true, name: true } },
        ipAsset: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({ data: fullAssignment });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await rateLimit(req);
  if (limited) return limited;

  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { id } = await params;

  try {
    const body = await req.json().catch(() => ({}));
    const reason = body?.reason || undefined;

    await deleteAssignmentWithAudit(id, {
      userId: session!.user!.id,
      userName: session!.user!.name || "Unknown",
      userEmail: session!.user!.email || "unknown@example.com",
      reason,
    });

    return NextResponse.json({ data: { success: true } });
  } catch (err) {
    return handleApiError(err);
  }
}
