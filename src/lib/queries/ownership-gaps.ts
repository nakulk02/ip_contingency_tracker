import { prisma } from "@/lib/prisma";
import { calculateAssetRiskScore, calculatePersonRiskScore } from "@/lib/risk-scoring";

export async function getAssetsWithGaps(limit?: number) {
  const assets = await prisma.ipAsset.findMany({
    where: {
      assignments: { none: { status: "SIGNED" } },
    },
    orderBy: { title: "asc" },
    ...(limit ? { take: limit } : {}),
  });

  return assets.map((asset) => {
    const riskData = calculateAssetRiskScore(
      asset.type,
      asset.status,
      asset.filingDate,
      asset.jurisdiction
    );

    return {
      ...asset,
      riskScore: riskData.score,
      riskLevel: riskData.level,
    };
  });
}

export async function getPeopleWithGaps(limit?: number) {
  const people = await prisma.person.findMany({
    where: {
      deletedAt: null,
      assignments: { none: { status: "SIGNED" } },
    },
    orderBy: { name: "asc" },
    ...(limit ? { take: limit } : {}),
  });

  return people.map((p) => {
    const riskData = calculatePersonRiskScore(p.startDate, p.endDate);

    return {
      ...p,
      riskScore: riskData.score,
      riskLevel: riskData.level,
      priority: p.endDate === null ? ("HIGH" as const) : ("MEDIUM" as const),
    };
  });
}

export async function getOwnershipGapSummary(limit = 5) {
  const [assetsAtRiskCount, peopleWithGapsCount, highPriorityCount, assets, people] =
    await Promise.all([
      prisma.ipAsset.count({
        where: { assignments: { none: { status: "SIGNED" } } },
      }),
      prisma.person.count({
        where: {
          deletedAt: null,
          assignments: { none: { status: "SIGNED" } },
        },
      }),
      prisma.person.count({
        where: {
          deletedAt: null,
          endDate: null,
          assignments: { none: { status: "SIGNED" } },
        },
      }),
      getAssetsWithGaps(limit),
      getPeopleWithGaps(limit),
    ]);

  return {
    assetsAtRisk: assetsAtRiskCount,
    peopleWithoutAgreements: peopleWithGapsCount,
    highPriorityPeople: highPriorityCount,
    assets,
    people,
  };
}
