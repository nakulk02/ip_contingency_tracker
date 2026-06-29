import { prisma } from "@/lib/prisma";
import { calculateAssetRiskScore, calculatePersonRiskScore } from "@/lib/risk-scoring";

export async function getOwnershipGapSummary(limit = 5) {
  // Fetch all gaps in parallel (2 queries instead of 5)
  const [allAssets, allPeople] = await Promise.all([
    prisma.ipAsset.findMany({
      where: {
        assignments: { 
          none: { 
            AND: [
              { status: "SIGNED" },
              { deletedAt: null }
            ]
          } 
        },
      },
      orderBy: { title: "asc" },
    }),
    prisma.person.findMany({
      where: {
        deletedAt: null,
        assignments: { 
          none: { 
            AND: [
              { status: "SIGNED" },
              { deletedAt: null }
            ]
          }
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  // Calculate counts and add risk scores in memory
  const assets = allAssets.slice(0, limit).map((asset) => {
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

  const people = allPeople.map((p) => {
    const riskData = calculatePersonRiskScore(p.startDate, p.endDate);
    return {
      ...p,
      riskScore: riskData.score,
      riskLevel: riskData.level,
      priority: p.endDate === null ? ("HIGH" as const) : ("MEDIUM" as const),
    };
  });

  const highPriorityPeople = people.filter((p) => p.endDate === null);

  return {
    assetsAtRisk: allAssets.length,
    peopleWithoutAgreements: allPeople.length,
    highPriorityPeople: highPriorityPeople.length,
    assets: assets.slice(0, limit),
    people: people.slice(0, limit),
  };
}
