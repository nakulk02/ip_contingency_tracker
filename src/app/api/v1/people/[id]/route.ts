import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";

const updatePersonSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  role: z.enum(["FOUNDER", "EMPLOYEE", "CONTRACTOR", "ADVISOR"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().nullable().optional(),
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
  const person = await prisma.person.findFirst({ where: { id, deletedAt: null } });

  if (!person) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: person });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await rateLimit(req);
  if (limited) return limited;

  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { id } = await params;

  try {
    const existing = await prisma.person.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const data = updatePersonSchema.parse(body);

    const updateData: Record<string, unknown> = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    }

    const person = await prisma.person.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: person });
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

  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { id } = await params;

  const person = await prisma.person.findFirst({ where: { id, deletedAt: null } });
  if (!person) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Soft delete — preserves assignment history
  await prisma.person.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ data: { success: true } });
}
