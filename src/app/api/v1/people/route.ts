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

  const where: Record<string, any> = { deletedAt: null };
  
  // Role filter
  const roleParam = searchParams.get("role");
  if (roleParam && (VALID_ROLES as readonly string[]).includes(roleParam)) where.role = roleParam;
  
  // Status filter (current or former)
  const statusParam = searchParams.get("status");
  if (statusParam === "current") {
    where.endDate = null;
  } else if (statusParam === "former") {
    where.endDate = { not: null };
  }
  
  // Gaps only filter (no signed assignments)
  const gapsOnlyParam = searchParams.get("gapsOnly");
  if (gapsOnlyParam === "true") {
    where.assignments = { none: { status: "SIGNED" } };
  }
  
  // Start date range filter
  const startDateFrom = searchParams.get("startDateFrom");
  const startDateTo = searchParams.get("startDateTo");
  if (startDateFrom || startDateTo) {
    where.startDate = {};
    if (startDateFrom) where.startDate.gte = new Date(startDateFrom);
    if (startDateTo) where.startDate.lte = new Date(startDateTo);
  }
  
  // End date range filter
  const endDateFrom = searchParams.get("endDateFrom");
  const endDateTo = searchParams.get("endDateTo");
  if (endDateFrom || endDateTo) {
    where.endDate = where.endDate || {};
    if (endDateFrom) where.endDate.gte = new Date(endDateFrom);
    if (endDateTo) where.endDate.lte = new Date(endDateTo);
  }

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
