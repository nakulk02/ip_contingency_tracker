import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";

const updateAssignmentSchema = z.object({
  personId: z.string().min(1).optional(),
  ipAssetId: z.string().nullable().optional(),
  scope: z.enum(["COMPANY_WIDE", "ASSET_SPECIFIC"]).optional(),
  signedDate: z.string().nullable().optional(),
  fileReference: z.string().nullable().optional(),
  status: z.enum(["SIGNED", "MISSING", "PENDING"]).optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { id } = await params;

  try {
    const body = await req.json();
    const data = updateAssignmentSchema.parse(body);

    const updateData: Record<string, unknown> = { ...data };
    if (data.signedDate !== undefined) {
      updateData.signedDate = data.signedDate ? new Date(data.signedDate) : null;
    }

    const assignment = await prisma.assignmentAgreement.update({
      where: { id },
      data: updateData,
      include: {
        person: { select: { id: true, name: true } },
        ipAsset: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({ data: assignment });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { id } = await params;

  try {
    await prisma.assignmentAgreement.delete({ where: { id } });
    return NextResponse.json({ data: { success: true } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
