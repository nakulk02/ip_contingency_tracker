/**
 * Jurisdiction-Specific IP Compliance Rules
 * 
 * Different jurisdictions have different requirements for IP assignments:
 * - Some require assignment BEFORE filing
 * - Some allow assignment AFTER publication
 * - Some have inventor country-of-origin requirements
 */

export type ComplianceStatus = "COMPLIANT" | "AT_RISK" | "NON_COMPLIANT" | "UNKNOWN";

export interface ComplianceRule {
  jurisdiction: string;
  assetType: "PATENT" | "TRADEMARK";
  assignmentTiming: "BEFORE_FILING" | "BEFORE_PUBLICATION" | "FLEXIBLE";
  notes: string;
}

// Jurisdiction-specific rules
const COMPLIANCE_RULES: ComplianceRule[] = [
  // United States
  {
    jurisdiction: "US",
    assetType: "PATENT",
    assignmentTiming: "FLEXIBLE", // US allows assignment anytime
    notes: "US patents can be assigned before or after filing",
  },
  {
    jurisdiction: "US",
    assetType: "TRADEMARK",
    assignmentTiming: "FLEXIBLE",
    notes: "US trademarks can be assigned at any point",
  },

  // Europe
  {
    jurisdiction: "DE",
    assetType: "PATENT",
    assignmentTiming: "BEFORE_FILING",
    notes: "German law prefers assignment before filing for clarity",
  },
  {
    jurisdiction: "DE",
    assetType: "TRADEMARK",
    assignmentTiming: "FLEXIBLE",
    notes: "German trademarks can be assigned at any time",
  },

  // United Kingdom
  {
    jurisdiction: "GB",
    assetType: "PATENT",
    assignmentTiming: "FLEXIBLE",
    notes: "UK patents can be assigned before or after filing",
  },
  {
    jurisdiction: "GB",
    assetType: "TRADEMARK",
    assignmentTiming: "FLEXIBLE",
    notes: "UK trademarks can be assigned at any point",
  },

  // France
  {
    jurisdiction: "FR",
    assetType: "PATENT",
    assignmentTiming: "BEFORE_FILING",
    notes: "French law requires assignment before filing for employee inventions",
  },
  {
    jurisdiction: "FR",
    assetType: "TRADEMARK",
    assignmentTiming: "FLEXIBLE",
    notes: "French trademarks can be assigned at any time",
  },

  // China
  {
    jurisdiction: "CN",
    assetType: "PATENT",
    assignmentTiming: "BEFORE_FILING",
    notes: "CRITICAL: China requires assignment BEFORE filing (non-negotiable)",
  },
  {
    jurisdiction: "CN",
    assetType: "TRADEMARK",
    assignmentTiming: "BEFORE_FILING",
    notes: "China requires assignment before filing for ownership clarity",
  },

  // Japan
  {
    jurisdiction: "JP",
    assetType: "PATENT",
    assignmentTiming: "BEFORE_FILING",
    notes: "Japan prefers assignment before filing",
  },
  {
    jurisdiction: "JP",
    assetType: "TRADEMARK",
    assignmentTiming: "FLEXIBLE",
    notes: "Japanese trademarks can be assigned at any time",
  },

  // South Korea
  {
    jurisdiction: "KR",
    assetType: "PATENT",
    assignmentTiming: "BEFORE_FILING",
    notes: "Korea requires assignment before filing",
  },
  {
    jurisdiction: "KR",
    assetType: "TRADEMARK",
    assignmentTiming: "FLEXIBLE",
    notes: "Korean trademarks can be assigned at any time",
  },

  // India
  {
    jurisdiction: "IN",
    assetType: "PATENT",
    assignmentTiming: "BEFORE_FILING",
    notes: "India requires assignment before filing to establish ownership",
  },
  {
    jurisdiction: "IN",
    assetType: "TRADEMARK",
    assignmentTiming: "FLEXIBLE",
    notes: "Indian trademarks can be assigned at any time",
  },

  // Russia
  {
    jurisdiction: "RU",
    assetType: "PATENT",
    assignmentTiming: "BEFORE_FILING",
    notes: "Russia requires assignment before filing",
  },
  {
    jurisdiction: "RU",
    assetType: "TRADEMARK",
    assignmentTiming: "FLEXIBLE",
    notes: "Russian trademarks can be assigned at any time",
  },

  // Canada
  {
    jurisdiction: "CA",
    assetType: "PATENT",
    assignmentTiming: "FLEXIBLE",
    notes: "Canada allows assignment before or after filing",
  },
  {
    jurisdiction: "CA",
    assetType: "TRADEMARK",
    assignmentTiming: "FLEXIBLE",
    notes: "Canadian trademarks can be assigned at any time",
  },

  // Australia
  {
    jurisdiction: "AU",
    assetType: "PATENT",
    assignmentTiming: "FLEXIBLE",
    notes: "Australia allows assignment before or after filing",
  },
  {
    jurisdiction: "AU",
    assetType: "TRADEMARK",
    assignmentTiming: "FLEXIBLE",
    notes: "Australian trademarks can be assigned at any time",
  },
];

/**
 * Get compliance rule for jurisdiction + asset type
 */
export function getComplianceRule(
  jurisdiction: string,
  assetType: "PATENT" | "TRADEMARK"
): ComplianceRule | null {
  return (
    COMPLIANCE_RULES.find(
      (r) => r.jurisdiction === jurisdiction.toUpperCase() && r.assetType === assetType
    ) || null
  );
}

/**
 * Check if assignment is compliant with jurisdiction rules
 *
 * @param jurisdiction ISO 3166-1 alpha-2 country code
 * @param assetType PATENT or TRADEMARK
 * @param assetStatus Current status of the asset (DRAFT, FILED, PUBLISHED, REGISTERED)
 * @param hasSignedAssignment Whether a signed assignment exists
 * @returns Compliance status and explanation
 */
export function checkJurisdictionCompliance(
  jurisdiction: string,
  assetType: "PATENT" | "TRADEMARK",
  assetStatus: string,
  hasSignedAssignment: boolean
): { status: ComplianceStatus; message: string } {
  const rule = getComplianceRule(jurisdiction, assetType);

  if (!rule) {
    return {
      status: "UNKNOWN",
      message: `No compliance rules defined for ${jurisdiction} ${assetType}`,
    };
  }

  // If no assignment, it's always at risk
  if (!hasSignedAssignment) {
    return {
      status: "AT_RISK",
      message: `Missing signed assignment. ${rule.notes}`,
    };
  }

  // Check timing requirements
  if (rule.assignmentTiming === "FLEXIBLE") {
    return {
      status: "COMPLIANT",
      message: `Assignment compliant. ${rule.notes}`,
    };
  }

  if (rule.assignmentTiming === "BEFORE_FILING") {
    if (assetStatus === "DRAFT") {
      return {
        status: "COMPLIANT",
        message: `Assignment before filing. ${rule.notes}`,
      };
    } else if (assetStatus === "FILED" || assetStatus === "PUBLISHED" || assetStatus === "REGISTERED") {
      return {
        status: "NON_COMPLIANT",
        message: `CRITICAL: Assignment should have been BEFORE filing. ${rule.notes}`,
      };
    }
  }

  if (rule.assignmentTiming === "BEFORE_PUBLICATION") {
    if (assetStatus === "DRAFT" || assetStatus === "FILED") {
      return {
        status: "COMPLIANT",
        message: `Assignment before publication. ${rule.notes}`,
      };
    } else if (assetStatus === "PUBLISHED" || assetStatus === "REGISTERED") {
      return {
        status: "NON_COMPLIANT",
        message: `CRITICAL: Assignment should have been BEFORE publication. ${rule.notes}`,
      };
    }
  }

  return {
    status: "UNKNOWN",
    message: "Unable to determine compliance status",
  };
}

/**
 * Validate if an assignment can be created for this asset
 * Returns true if assignment is allowed, false if it violates rules
 */
export function canCreateAssignment(
  jurisdiction: string,
  assetType: "PATENT" | "TRADEMARK",
  assetStatus: string
): { allowed: boolean; reason?: string } {
  const rule = getComplianceRule(jurisdiction, assetType);

  if (!rule) {
    // If no rule exists, allow it
    return { allowed: true };
  }

  // BEFORE_FILING: only allow on DRAFT
  if (rule.assignmentTiming === "BEFORE_FILING" && assetStatus !== "DRAFT") {
    return {
      allowed: false,
      reason: `${jurisdiction} requires assignment before filing. Asset is in ${assetStatus} status.`,
    };
  }

  // BEFORE_PUBLICATION: allow on DRAFT or FILED
  if (
    rule.assignmentTiming === "BEFORE_PUBLICATION" &&
    (assetStatus === "PUBLISHED" || assetStatus === "REGISTERED")
  ) {
    return {
      allowed: false,
      reason: `${jurisdiction} requires assignment before publication. Asset is already published.`,
    };
  }

  // FLEXIBLE allows anything
  return { allowed: true };
}

/**
 * Get all rules for a jurisdiction
 */
export function getJurisdictionRules(jurisdiction: string): ComplianceRule[] {
  return COMPLIANCE_RULES.filter((r) => r.jurisdiction === jurisdiction.toUpperCase());
}

/**
 * Get high-risk jurisdictions (those with strict BEFORE_FILING requirements)
 */
export function getHighRiskJurisdictions(): string[] {
  const highRisk = new Set<string>();
  COMPLIANCE_RULES.forEach((rule) => {
    if (rule.assignmentTiming === "BEFORE_FILING") {
      highRisk.add(rule.jurisdiction);
    }
  });
  return Array.from(highRisk);
}
