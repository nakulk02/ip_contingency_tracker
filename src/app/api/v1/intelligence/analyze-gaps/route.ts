import { NextRequest, NextResponse } from "next/server";
import { processTool } from "ip-contingency-mcp";
import { prisma } from "@/lib/prisma";
import { calculateGapStatistics } from "@/lib/queries/ownership-gaps";

export async function GET(req: NextRequest) {
  try {
    const gaps = await prisma.assignmentAgreement.findMany({
      where: { deletedAt: null },
      include: {
        person: true,
        ipAsset: true,
      },
    });

    const formattedGaps = gaps.map((gap) => ({
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
      riskScore: 50, // Will calculate from actual data
      riskLevel: "MEDIUM" as const,
      daysOverdue: 0, // Will calculate based on dates
    }));

    const result = await processTool({
      tool: "analyzeGaps",
      input: { gaps: formattedGaps },
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
