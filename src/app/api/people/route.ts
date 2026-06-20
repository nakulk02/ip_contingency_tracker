import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";

const createPersonSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().nullable().optional(),
  role: z.enum(["FOUNDER", "EMPLOYEE", "CONTRACTOR", "ADVISOR"]),
  startDate: z.string().min(1),
  endDate: z.string().nullable().optional(),
});

export async function GET(req: Request) {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");

  const where: Record<string, string> = {};
  if (role) where.role = role;

  const people = await prisma.person.findMany({
    where,
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: people });
}

export async function POST(req: Request) {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  try {
    const body = await req.json();
    const data = createPersonSchema.parse(body);

    const person = await prisma.person.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });

    return NextResponse.json({ data: person });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
