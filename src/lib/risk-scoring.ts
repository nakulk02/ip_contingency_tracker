/**
 * Risk Scoring System for IP Ownership Gaps
 * 
 * Calculates risk scores (1-100) based on:
 * - Gap age (how long without signed agreement)
 * - Asset criticality (patent vs trademark, registration status)
 * - Person status (current vs former)
 * - Jurisdiction complexity
 */

export type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface RiskScoreResult {
  score: number;
  level: RiskLevel;
  breakdown: {
    baseScore: number;
    agePoints: number;
    assetTypePoints: number;
    assetStatusPoints: number;
    personStatusPoints: number;
    jurisdictionMultiplier: number;
  };
}

/**
 * Complex jurisdictions that require faster IP assignment turnaround
 */
const COMPLEX_JURISDICTIONS = new Set([
  "CN", // China
  "DE", // Germany
  "JP", // Japan
  "KR", // South Korea
  "RU", // Russia
  "IN", // India
]);

/**
 * Calculate days between two dates
 */
function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Get asset type weight
 * Patents are more critical than trademarks
 */
function getAssetTypeWeight(assetType?: string): number {
  if (assetType === "PATENT") return 20;
  if (assetType === "TRADEMARK") return 10;
  return 5; // Unknown types get minimal weight
}

/**
 * Get asset status weight
 * Registered/published assets are more at-risk than drafts
 */
function getAssetStatusWeight(assetStatus?: string): number {
  if (assetStatus === "REGISTERED") return 30;
  if (assetStatus === "PUBLISHED") return 20;
  if (assetStatus === "FILED") return 15;
  if (assetStatus === "DRAFT") return 5;
  return 0;
}

/**
 * Get person status weight
 * Current team members are higher priority than former
 */
function getPersonStatusWeight(endDate: Date | null): number {
  return endDate === null ? 20 : 10; // null endDate = current
}

/**
 * Get jurisdiction multiplier
 * Complex jurisdictions get a multiplier
 */
function getJurisdictionMultiplier(jurisdiction?: string): number {
  if (!jurisdiction) return 1;
  return COMPLEX_JURISDICTIONS.has(jurisdiction.toUpperCase()) ? 1.5 : 1;
}

/**
 * Calculate age points based on days since the gap started
 * More days = higher risk
 */
function getAgePoints(gapStartDate: Date): number {
  const days = daysBetween(gapStartDate, new Date());
  
  // Exponential scaling: 30 days = 10 pts, 90 days = 30 pts, 180 days = 50 pts
  if (days < 30) return Math.min(10, days / 3);
  if (days < 90) return 10 + Math.min(20, (days - 30) / 3);
  if (days < 180) return 30 + Math.min(20, (days - 90) / 3);
  return Math.min(50, 50 + (days - 180) / 10); // Cap at ~50 for extreme cases
}

/**
 * Calculate risk score for an IP asset without a signed assignment
 */
export function calculateAssetRiskScore(
  assetType: string,
  assetStatus: string,
  filingDate: Date | null,
  jurisdiction?: string
): RiskScoreResult {
  const baseScore = 10;
  const assetTypePoints = getAssetTypeWeight(assetType);
  const assetStatusPoints = getAssetStatusWeight(assetStatus);
  
  // If no filing date, assume recent (low age points)
  const agePoints = filingDate ? getAgePoints(filingDate) : 2;
  
  const jurisdictionMultiplier = getJurisdictionMultiplier(jurisdiction);
  
  const rawScore = (
    baseScore +
    agePoints +
    assetTypePoints +
    assetStatusPoints
  ) * jurisdictionMultiplier;
  
  const score = Math.min(100, Math.round(rawScore));
  
  return {
    score,
    level: getLevelFromScore(score),
    breakdown: {
      baseScore,
      agePoints: Math.round(agePoints),
      assetTypePoints,
      assetStatusPoints,
      personStatusPoints: 0,
      jurisdictionMultiplier,
    },
  };
}

/**
 * Calculate risk score for a person without a signed assignment
 */
export function calculatePersonRiskScore(
  startDate: Date,
  endDate: Date | null
): RiskScoreResult {
  const baseScore = 10;
  const personStatusPoints = getPersonStatusWeight(endDate);
  const agePoints = getAgePoints(startDate);
  
  const rawScore = baseScore + agePoints + personStatusPoints;
  const score = Math.min(100, Math.round(rawScore));
  
  return {
    score,
    level: getLevelFromScore(score),
    breakdown: {
      baseScore,
      agePoints: Math.round(agePoints),
      assetTypePoints: 0,
      assetStatusPoints: 0,
      personStatusPoints,
      jurisdictionMultiplier: 1,
    },
  };
}

/**
 * Calculate combined risk score for an assignment gap
 * Considers both the asset and person side
 */
export function calculateAssignmentRiskScore(
  personStartDate: Date,
  personEndDate: Date | null,
  assetType?: string,
  assetStatus?: string,
  assetFilingDate?: Date | null,
  jurisdiction?: string
): RiskScoreResult {
  const baseScore = 10;
  const personStatusPoints = getPersonStatusWeight(personEndDate);
  const agePoints = getAgePoints(personStartDate);
  const assetTypePoints = assetType ? getAssetTypeWeight(assetType) : 0;
  const assetStatusPoints = assetStatus ? getAssetStatusWeight(assetStatus) : 0;
  const jurisdictionMultiplier = getJurisdictionMultiplier(jurisdiction);
  
  const rawScore = (
    baseScore +
    agePoints +
    personStatusPoints +
    assetTypePoints +
    assetStatusPoints
  ) * jurisdictionMultiplier;
  
  const score = Math.min(100, Math.round(rawScore));
  
  return {
    score,
    level: getLevelFromScore(score),
    breakdown: {
      baseScore,
      agePoints: Math.round(agePoints),
      assetTypePoints,
      assetStatusPoints,
      personStatusPoints,
      jurisdictionMultiplier,
    },
  };
}

/**
 * Convert score to risk level
 */
function getLevelFromScore(score: number): RiskLevel {
  if (score >= 75) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 25) return "MEDIUM";
  return "LOW";
}

/**
 * Get color class for risk level (Tailwind)
 */
export function getRiskLevelColor(
  level: RiskLevel
): { bg: string; text: string; icon: string } {
  switch (level) {
    case "CRITICAL":
      return { bg: "bg-red-100", text: "text-red-700", icon: "text-red-600" };
    case "HIGH":
      return { bg: "bg-orange-100", text: "text-orange-700", icon: "text-orange-600" };
    case "MEDIUM":
      return { bg: "bg-yellow-100", text: "text-yellow-700", icon: "text-yellow-600" };
    case "LOW":
      return { bg: "bg-emerald-100", text: "text-emerald-700", icon: "text-emerald-600" };
  }
}
