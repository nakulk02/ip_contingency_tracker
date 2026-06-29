/**
 * Export & Reporting System
 * 
 * Generate CSV/JSON reports for legal review and compliance audits
 */

import { prisma } from "@/lib/prisma";
import { calculateAssetRiskScore, calculatePersonRiskScore } from "@/lib/risk-scoring";

export interface GapReport {
  generatedAt: Date;
  totalAssets: number;
  totalPeople: number;
  assetsWithGaps: number;
  peopleWithGaps: number;
  highRiskCount: number;
  criticalRiskCount: number;
  assets: any[];
  people: any[];
}

/**
 * Generate comprehensive gap report
 */
export async function generateGapReport(): Promise<GapReport> {
  const [assets, people] = await Promise.all([
    prisma.ipAsset.findMany({
      where: {
        assignments: { none: { status: "SIGNED", deletedAt: null } },
      },
    }),
    prisma.person.findMany({
      where: {
        deletedAt: null,
        assignments: { none: { status: "SIGNED", deletedAt: null } },
      },
    }),
  ]);

  const [totalAssets, totalPeople] = await Promise.all([
    prisma.ipAsset.count(),
    prisma.person.count({ where: { deletedAt: null } }),
  ]);

  // Score all gaps
  const scoredAssets = assets.map((asset) => {
    const risk = calculateAssetRiskScore(asset.type, asset.status, asset.filingDate, asset.jurisdiction);
    return {
      ...asset,
      riskScore: risk.score,
      riskLevel: risk.level,
    };
  });

  const scoredPeople = people.map((p) => {
    const risk = calculatePersonRiskScore(p.startDate, p.endDate);
    return {
      ...p,
      riskScore: risk.score,
      riskLevel: risk.level,
    };
  });

  const highRisk = [...scoredAssets, ...scoredPeople].filter((i) => i.riskScore >= 50);
  const critical = [...scoredAssets, ...scoredPeople].filter((i) => i.riskScore >= 75);

  return {
    generatedAt: new Date(),
    totalAssets,
    totalPeople,
    assetsWithGaps: assets.length,
    peopleWithGaps: people.length,
    highRiskCount: highRisk.length,
    criticalRiskCount: critical.length,
    assets: scoredAssets.sort((a, b) => b.riskScore - a.riskScore),
    people: scoredPeople.sort((a, b) => b.riskScore - a.riskScore),
  };
}

/**
 * Convert report to CSV format
 */
export function reportToCSV(report: GapReport): string {
  const lines: string[] = [];

  // Header
  lines.push("IP OWNERSHIP GAP REPORT");
  lines.push(`Generated: ${report.generatedAt.toISOString()}`);
  lines.push("");

  // Summary
  lines.push("SUMMARY");
  lines.push(`Total IP Assets,${report.totalAssets}`);
  lines.push(`Total People,${report.totalPeople}`);
  lines.push(`Assets with Gaps,${report.assetsWithGaps}`);
  lines.push(`People without Agreements,${report.peopleWithGaps}`);
  lines.push(`High Risk Items,${report.highRiskCount}`);
  lines.push(`Critical Risk Items,${report.criticalRiskCount}`);
  lines.push("");

  // Assets with gaps
  lines.push("ASSETS WITH GAPS");
  lines.push("Title,Type,Status,Jurisdiction,Filing Date,Risk Level,Risk Score");
  for (const asset of report.assets) {
    lines.push(
      `"${asset.title}",${asset.type},${asset.status},${asset.jurisdiction},"${asset.filingDate || ""}",${asset.riskLevel},${asset.riskScore}`
    );
  }
  lines.push("");

  // People without agreements
  lines.push("PEOPLE WITHOUT SIGNED AGREEMENTS");
  lines.push("Name,Email,Role,Start Date,End Date,Status,Risk Level,Risk Score");
  for (const person of report.people) {
    const status = person.endDate ? "Former" : "Current";
    lines.push(
      `"${person.name}","${person.email || ""}",${person.role},"${person.startDate.toISOString().split("T")[0]}","${person.endDate ? person.endDate.toISOString().split("T")[0] : ""}",${status},${person.riskLevel},${person.riskScore}`
    );
  }

  return lines.join("\n");
}

/**
 * Generate compliance audit report (JSON)
 */
export async function generateComplianceAudit() {
  const report = await generateGapReport();

  // Get audit logs
  const recentAuditLogs = await prisma.auditLog.findMany({
    where: {
      createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // Last 90 days
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return {
    report,
    auditActivity: {
      recentLogsCount: recentAuditLogs.length,
      logs: recentAuditLogs,
    },
  };
}

/**
 * Generate executive summary
 */
export async function generateExecutiveSummary() {
  const report = await generateGapReport();

  const assetsByType = report.assets.reduce(
    (acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const peopleByRole = report.people.reduce(
    (acc, p) => {
      acc[p.role] = (acc[p.role] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    generatedAt: report.generatedAt,
    complianceScore: Math.round(((report.totalAssets - report.assetsWithGaps) / report.totalAssets) * 100),
    riskMetrics: {
      assetsAtRisk: report.assetsWithGaps,
      peopleWithoutAgreements: report.peopleWithGaps,
      highRiskItems: report.highRiskCount,
      criticalRiskItems: report.criticalRiskCount,
    },
    assetBreakdown: assetsByType,
    peopleBreakdown: peopleByRole,
    topRisks: {
      assets: report.assets.slice(0, 5),
      people: report.people.slice(0, 5),
    },
  };
}
