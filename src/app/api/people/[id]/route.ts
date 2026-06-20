import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";

const updatePersonSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  role: z.enum(["FOUNDER", "EMPLOYEE", "CONTRACTOR", "ADVISOR"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().nullable().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { id } = await params;
  const person = await prisma.person.findUnique({ where: { id } });

  if (!person) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: person });
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
    await prisma.person.delete({ where: { id } });
    return NextResponse.json({ data: { success: true } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
