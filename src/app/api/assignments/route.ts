import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";

const createAssignmentSchema = z.object({
  personId: z.string().min(1),
  ipAssetId: z.string().nullable().optional(),
  scope: z.enum(["COMPANY_WIDE", "ASSET_SPECIFIC"]).optional(),
  signedDate: z.string().nullable().optional(),
  fileReference: z.string().nullable().optional(),
  status: z.enum(["SIGNED", "MISSING", "PENDING"]).optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(req: Request) {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const personId = searchParams.get("personId");

  const where: Record<string, string> = {};
  if (status) where.status = status;
  if (personId) where.personId = personId;

  const assignments = await prisma.assignmentAgreement.findMany({
    where,
    include: {
      person: { select: { id: true, name: true, role: true } },
      ipAsset: { select: { id: true, title: true, type: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ data: assignments });
}

export async function POST(req: Request) {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  try {
    const body = await req.json();
    const data = createAssignmentSchema.parse(body);

    const assignment = await prisma.assignmentAgreement.create({
      data: {
        ...data,
        ipAssetId: data.ipAssetId || null,
        signedDate: data.signedDate ? new Date(data.signedDate) : null,
      },
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
