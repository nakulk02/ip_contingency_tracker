import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";
import { parsePagination, paginatedResponse, handleApiError } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";

const VALID_TYPES = ["PATENT", "TRADEMARK"] as const;
const VALID_STATUSES = ["DRAFT", "FILED", "PUBLISHED", "REGISTERED", "EXPIRED", "ABANDONED"] as const;

const createIpAssetSchema = z.object({
  type: z.enum(VALID_TYPES),
  title: z.string().min(1),
  jurisdiction: z.string().min(1),
  filingDate: z.string().nullable().optional(),
  status: z.enum(VALID_STATUSES).optional(),
  registrationNumber: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export async function GET(req: Request) {
  const limited = await rateLimit(req);
  if (limited) return limited;

  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const { page, limit, skip } = parsePagination(req);

  const where: Record<string, any> = {};
  
  // Type filter
  const typeParam = searchParams.get("type");
  if (typeParam && (VALID_TYPES as readonly string[]).includes(typeParam)) where.type = typeParam;
  
  // Status filter
  const statusParam = searchParams.get("status");
  if (statusParam && (VALID_STATUSES as readonly string[]).includes(statusParam)) where.status = statusParam;
  
  // Jurisdiction filter
  const jurisdictionParam = searchParams.get("jurisdiction");
  if (jurisdictionParam) where.jurisdiction = jurisdictionParam.toUpperCase();
  
  // Gaps only filter (no signed assignments)
  const gapsOnlyParam = searchParams.get("gapsOnly");
  if (gapsOnlyParam === "true") {
    where.assignments = { none: { status: "SIGNED" } };
  }
  
  // Filing date range filter
  const filingDateFrom = searchParams.get("filingDateFrom");
  const filingDateTo = searchParams.get("filingDateTo");
  if (filingDateFrom || filingDateTo) {
    where.filingDate = {};
    if (filingDateFrom) where.filingDate.gte = new Date(filingDateFrom);
    if (filingDateTo) where.filingDate.lte = new Date(filingDateTo);
  }

  const [assets, total] = await Promise.all([
    prisma.ipAsset.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.ipAsset.count({ where }),
  ]);

  return paginatedResponse(assets, total, page, limit);
}

export async function POST(req: Request) {
  const limited = await rateLimit(req);
  if (limited) return limited;

  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  try {
    const body = await req.json();
    const data = createIpAssetSchema.parse(body);

    const asset = await prisma.ipAsset.create({
      data: {
        ...data,
        filingDate: data.filingDate ? new Date(data.filingDate) : null,
      },
    });

    return NextResponse.json({ data: asset }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
