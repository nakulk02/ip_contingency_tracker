import { NextRequest, NextResponse } from "next/server";
import { processTool } from "ip-contingency-mcp";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const gapId = req.nextUrl.searchParams.get("gapId");

    if (!gapId) {
      return NextResponse.json(
        { error: "gapId parameter required" },
        { status: 400 }
      );
    }

    const gap = await prisma.assignmentAgreement.findUnique({
      where: { id: gapId },
      include: {
        person: true,
        ipAsset: true,
      },
    });

    if (!gap) {
      return NextResponse.json(
        { error: "Gap not found" },
        { status: 404 }
      );
    }

    const formattedGap = {
      id: gap.id,
      personId: gap.personId,
      personName: gap.person.name,
      personEmail: gap.person.email,
      personRole: gap.person.role,
      personStartDate: gap.person.startDate,
      personEndDate: gap.person.endDate,
      assetId: gap.ipAssetId,
      assetTitle: gap.ipAsset?.title,
      assetType: gap.ipAsset?.type || "PATENT",
      assetStatus: gap.ipAsset?.status || "DRAFT",
      jurisdiction: gap.ipAsset?.jurisdiction || "US",
      filingDate: gap.ipAsset?.filingDate,
      riskScore: 50,
      riskLevel: "MEDIUM" as const,
      daysOverdue: 0,
    };

    const result = await processTool({
      tool: "checkCompliance",
      input: { gap: formattedGap },
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Compliance check failed" },
      { status: 500 }
    );
  }
}
