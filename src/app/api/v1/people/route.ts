import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";
import { parsePagination, paginatedResponse, handleApiError } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";

const VALID_ROLES = ["FOUNDER", "EMPLOYEE", "CONTRACTOR", "ADVISOR"] as const;

const createPersonSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().nullable().optional(),
  role: z.enum(VALID_ROLES),
  startDate: z.string().min(1),
  endDate: z.string().nullable().optional(),
});

export async function GET(req: Request) {
  const limited = await rateLimit(req);
  if (limited) return limited;

  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const { page, limit, skip } = parsePagination(req);

  const where: Record<string, unknown> = { deletedAt: null };
  const roleParam = searchParams.get("role");
  if (roleParam && (VALID_ROLES as readonly string[]).includes(roleParam)) where.role = roleParam;

  const [people, total] = await Promise.all([
    prisma.person.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.person.count({ where }),
  ]);

  return paginatedResponse(people, total, page, limit);
}

export async function POST(req: Request) {
  const limited = await rateLimit(req);
  if (limited) return limited;

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

    return NextResponse.json({ data: person }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
