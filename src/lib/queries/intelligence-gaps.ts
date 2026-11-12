import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import { calculateAssignmentRiskScore } from "@/lib/risk-scoring";

type GapWithRelations = NonNullable<
  Awaited<ReturnType<typeof prisma.assignmentAgreement.findUnique>>
> & {
  person: {
    name: string;
    email: string | null;
    role: string;
    startDate: Date;
    endDate: Date | null;
  };
  ipAsset: {
    title: string;
    type: string;
    status: string;
    jurisdiction: string;
    filingDate: Date | null;
  } | null;
};

/** The flat gap shape the intelligence tools (ip-contingency-mcp) expect. */
export type IntelligenceGap = ReturnType<typeof toIntelligenceGap>;

const DAY_MS = 1000 * 60 * 60 * 24;

/**
 * Days the assignment has been outstanding: counted from the later of the
 * person's start date and the asset's filing date, which is when a signed
 * assignment should have existed.
 */
function daysOutstanding(gap: GapWithRelations, now = new Date()): number {
  const from = Math.max(gap.person.startDate.getTime(), gap.ipAsset?.filingDate?.getTime() ?? 0);
  return Math.max(0, Math.floor((now.getTime() - from) / DAY_MS));
}

/**
 * Shapes a Prisma assignment-agreement record into the flat structure
 * expected by the intelligence tool layer, with a real risk score from
 * src/lib/risk-scoring.ts.
 */
function toIntelligenceGap(gap: GapWithRelations) {
  const risk = calculateAssignmentRiskScore(
    gap.person.startDate,
    gap.person.endDate,
    gap.ipAsset?.type,
    gap.ipAsset?.status,
    gap.ipAsset?.filingDate,
    gap.ipAsset?.jurisdiction
  );

  return {
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
    riskScore: risk.score,
    riskLevel: risk.level,
    daysOverdue: daysOutstanding(gap),
  };
}

/**
 * Fetches and formats all open gaps: non-deleted agreements that are not yet
 * signed (status MISSING or PENDING).
 */
export async function getFormattedGaps() {
  const gaps = await prisma.assignmentAgreement.findMany({
    where: { deletedAt: null, status: { not: "SIGNED" } },
    include: { person: true, ipAsset: true },
  });

  return gaps.map((gap: unknown) => toIntelligenceGap(gap as GapWithRelations));
}

/** Fetches and formats a single gap by id, throwing NotFoundError if it doesn't exist. */
export async function getFormattedGap(gapId: string) {
  const gap = await prisma.assignmentAgreement.findUnique({
    where: { id: gapId },
    include: { person: true, ipAsset: true },
  });

  if (!gap || gap.deletedAt) {
    throw new NotFoundError("Gap");
  }

  return toIntelligenceGap(gap as unknown as GapWithRelations);
}
