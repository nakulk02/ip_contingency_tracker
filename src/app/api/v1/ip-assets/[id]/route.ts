import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";
import { asyncHandler } from "@/lib/api-utils";
import { NotFoundError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";

const updateIpAssetSchema = z.object({
  type: z.enum(["PATENT", "TRADEMARK"]).optional(),
  title: z.string().min(1).optional(),
  jurisdiction: z.string().min(1).optional(),
  filingDate: z.string().nullable().optional(),
  status: z.enum(["DRAFT", "FILED", "PUBLISHED", "REGISTERED", "EXPIRED", "ABANDONED"]).optional(),
  registrationNumber: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export const GET = asyncHandler(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const limited = await rateLimit(req);
    if (limited) return limited;

    const { error } = await getSessionOrUnauthorized();
    if (error) return error;

    const { id } = await params;
    const asset = await prisma.ipAsset.findUnique({ where: { id } });

    if (!asset) {
      throw new NotFoundError("IP asset");
    }

    return NextResponse.json({ data: asset });
  }
);

export const PUT = asyncHandler(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const limited = await rateLimit(req);
    if (limited) return limited;

    const { error } = await getSessionOrUnauthorized();
    if (error) return error;

    const { id } = await params;
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
  }
);

export const DELETE = asyncHandler(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const limited = await rateLimit(req);
    if (limited) return limited;

    const { error } = await getSessionOrUnauthorized();
    if (error) return error;

    const { id } = await params;
    await prisma.ipAsset.delete({ where: { id } });

    return NextResponse.json({ data: { success: true } });
  }
);
