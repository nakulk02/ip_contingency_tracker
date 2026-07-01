import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";

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

/**
 * Shapes a Prisma assignment-agreement record into the flat structure
 * expected by the intelligence tool layer.
 *
 * Note: riskScore, riskLevel, and daysOverdue are currently placeholders
 * pending real risk-scoring integration for this code path.
 */
function toIntelligenceGap(gap: GapWithRelations) {
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
    riskScore: 50,
    riskLevel: "MEDIUM" as const,
    daysOverdue: 0,
  };
}

/** Fetches and formats all non-deleted gaps for tools that operate on a full gap set. */
export async function getFormattedGaps() {
  const gaps = await prisma.assignmentAgreement.findMany({
    where: { deletedAt: null },
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

  if (!gap) {
    throw new NotFoundError("Gap");
  }

  return toIntelligenceGap(gap as unknown as GapWithRelations);
}
