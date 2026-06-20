import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";

const updateIpAssetSchema = z.object({
  type: z.enum(["PATENT", "TRADEMARK"]).optional(),
  title: z.string().min(1).optional(),
  jurisdiction: z.string().min(1).optional(),
  filingDate: z.string().nullable().optional(),
  status: z.enum(["DRAFT", "FILED", "PUBLISHED", "REGISTERED", "EXPIRED", "ABANDONED"]).optional(),
  registrationNumber: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { id } = await params;
  const asset = await prisma.ipAsset.findUnique({ where: { id } });

  if (!asset) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: asset });
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
    const data = updateIpAssetSchema.parse(body);

    const updateData: Record<string, unknown> = { ...data };
    if (data.filingDate !== undefined) {
      updateData.filingDate = data.filingDate ? new Date(data.filingDate) : null;
    }

    const asset = await prisma.ipAsset.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: asset });
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
    await prisma.ipAsset.delete({ where: { id } });
    return NextResponse.json({ data: { success: true } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
