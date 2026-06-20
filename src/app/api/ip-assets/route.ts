import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";

const createIpAssetSchema = z.object({
  type: z.enum(["PATENT", "TRADEMARK"]),
  title: z.string().min(1),
  jurisdiction: z.string().min(1),
  filingDate: z.string().nullable().optional(),
  status: z.enum(["DRAFT", "FILED", "PUBLISHED", "REGISTERED", "EXPIRED", "ABANDONED"]).optional(),
  registrationNumber: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export async function GET(req: Request) {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");

  const where: Record<string, string> = {};
  if (type) where.type = type;
  if (status) where.status = status;

  const assets = await prisma.ipAsset.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ data: assets });
}

export async function POST(req: Request) {
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

    return NextResponse.json({ data: asset });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
