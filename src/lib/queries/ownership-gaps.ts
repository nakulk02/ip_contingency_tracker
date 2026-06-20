import { prisma } from "@/lib/prisma";

export async function getAssetsWithGaps() {
  const assets = await prisma.ipAsset.findMany({
    include: {
      assignments: {
        where: { status: "SIGNED" },
      },
    },
    orderBy: { title: "asc" },
  });

  return assets.filter((a) => a.assignments.length === 0);
}

export async function getPeopleWithGaps() {
  const people = await prisma.person.findMany({
    include: {
      assignments: {
        where: { status: "SIGNED" },
      },
    },
    orderBy: { name: "asc" },
  });

  return people
    .filter((p) => p.assignments.length === 0)
    .map((p) => ({
      ...p,
      priority: p.endDate === null ? "HIGH" : "MEDIUM",
    }));
}

export async function getOwnershipGapSummary() {
  const [assetsAtRisk, peopleWithGaps] = await Promise.all([
    getAssetsWithGaps(),
    getPeopleWithGaps(),
  ]);

  return {
    assetsAtRisk: assetsAtRisk.length,
    peopleWithoutAgreements: peopleWithGaps.length,
    highPriorityPeople: peopleWithGaps.filter((p) => p.priority === "HIGH").length,
    assets: assetsAtRisk,
    people: peopleWithGaps,
  };
}
