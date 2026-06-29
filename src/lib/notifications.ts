/**
 * Notification & Reminder System
 * 
 * Background job to identify and flag overdue IP assignments
 * Can be triggered by cron job or message queue
 */

import { prisma } from "@/lib/prisma";

export interface OverdueAssignment {
  assignmentId: string;
  personName: string;
  personEmail: string | null;
  assetTitle: string | null;
  assetType: string;
  daysOverdue: number;
  personStartDate: Date;
  reason: "PERSON_TENURE" | "ASSET_FILED" | "ASSET_PUBLISHED";
}

/**
 * Find assignments that are overdue for signature
 * Considers:
 * - How long person has been with company without signed IP agreement
 * - How long asset has been filed/published without assignment
 */
export async function findOverdueAssignments(
  thresholdDays: number = 30
): Promise<OverdueAssignment[]> {
  const now = new Date();
  const thresholdDate = new Date(now.getTime() - thresholdDays * 24 * 60 * 60 * 1000);

  const assignments = await prisma.assignmentAgreement.findMany({
    where: {
      deletedAt: null,
      status: { not: "SIGNED" }, // PENDING or MISSING
    },
    include: {
      person: {
        select: {
          id: true,
          name: true,
          email: true,
          startDate: true,
          endDate: true,
        },
      },
      ipAsset: {
        select: {
          id: true,
          title: true,
          type: true,
          filingDate: true,
          status: true,
        },
      },
    },
  });

  const overdue: OverdueAssignment[] = [];

  for (const assignment of assignments) {
    // Check person tenure: if person started before threshold, flag it
    if (assignment.person.startDate < thresholdDate && !assignment.person.endDate) {
      const daysOverdue = Math.floor(
        (now.getTime() - assignment.person.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      overdue.push({
        assignmentId: assignment.id,
        personName: assignment.person.name,
        personEmail: assignment.person.email,
        assetTitle: assignment.ipAsset?.title || "Company-wide",
        assetType: assignment.ipAsset?.type || "GENERAL",
        daysOverdue,
        personStartDate: assignment.person.startDate,
        reason: "PERSON_TENURE",
      });
    }

    // Check asset timeline: if asset was filed before threshold without assignment
    if (
      assignment.ipAsset &&
      assignment.ipAsset.filingDate &&
      assignment.ipAsset.filingDate < thresholdDate
    ) {
      const daysOverdue = Math.floor(
        (now.getTime() - assignment.ipAsset.filingDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Only add once per assignment (avoid duplicates)
      if (!overdue.some((o) => o.assignmentId === assignment.id)) {
        overdue.push({
          assignmentId: assignment.id,
          personName: assignment.person.name,
          personEmail: assignment.person.email,
          assetTitle: assignment.ipAsset.title,
          assetType: assignment.ipAsset.type,
          daysOverdue,
          personStartDate: assignment.person.startDate,
          reason: "ASSET_FILED",
        });
      }
    }
  }

  return overdue.sort((a, b) => b.daysOverdue - a.daysOverdue); // Sort by most overdue
}

/**
 * Generate email reminder text
 */
export function generateReminderEmailBody(overdue: OverdueAssignment): string {
  return `
Hi Legal Team,

This is an automated reminder about an overdue IP assignment agreement:

OVERDUE ASSIGNMENT
-------------------
Person: ${overdue.personName} ${overdue.personEmail ? `(${overdue.personEmail})` : ""}
Asset: ${overdue.assetTitle} (${overdue.assetType})
Days Overdue: ${overdue.daysOverdue}
Reason: ${overdue.reason === "PERSON_TENURE" ? `Person has been with company for ${overdue.daysOverdue} days without signed IP agreement` : `Asset has been filed for ${overdue.daysOverdue} days without signed assignment`}

ACTION REQUIRED
---------------
Please obtain signature on the IP assignment agreement as soon as possible.

For critical jurisdictions (China, Germany, Japan, Korea, India, Russia), assignment must happen BEFORE filing.

---
This is an automated message. Do not reply.
  `.trim();
}

/**
 * Get summary of overdue assignments by person
 */
export async function getOverdueByPerson(thresholdDays?: number) {
  const overdue = await findOverdueAssignments(thresholdDays);
  const byPerson = new Map<string, OverdueAssignment[]>();

  for (const item of overdue) {
    if (!byPerson.has(item.personName)) {
      byPerson.set(item.personName, []);
    }
    byPerson.get(item.personName)!.push(item);
  }

  return Array.from(byPerson.entries()).map(([name, items]) => ({
    personName: name,
    overdueCount: items.length,
    mostOverdueDays: Math.max(...items.map((i) => i.daysOverdue)),
    assignments: items,
  }));
}

/**
 * Get summary of critical jurisdiction violations
 * (Assignments created after filing in strict jurisdictions)
 */
export async function getCriticalComplianceViolations() {
  const violations = await prisma.assignmentAgreement.findMany({
    where: {
      deletedAt: null,
      status: "SIGNED",
      createdAt: { gt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // Last 90 days
    },
    include: {
      ipAsset: {
        select: {
          id: true,
          title: true,
          type: true,
          jurisdiction: true,
          filingDate: true,
          status: true,
        },
      },
      person: {
        select: {
          name: true,
        },
      },
    },
  });

  const criticalJurisdictions = ["CN", "DE", "JP", "KR", "IN", "RU"];

  return violations.filter((a) => {
    if (!a.ipAsset || !criticalJurisdictions.includes(a.ipAsset.jurisdiction)) {
      return false;
    }
    // Check if assignment was created after filing
    return (
      a.ipAsset.filingDate && a.createdAt > a.ipAsset.filingDate && a.ipAsset.status !== "DRAFT"
    );
  });
}
