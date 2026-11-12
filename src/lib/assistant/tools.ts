import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import type { IntelligenceGap } from "@/lib/queries/intelligence-gaps";

/**
 * The 8 ip-contingency-mcp tools as the assistant model sees them.
 *
 * The model never handles raw gap records. Portfolio tools take optional
 * filters, gap tools take a gapId, and the server loads the matching gaps from
 * the database and passes them to processTool(). This keeps tool calls small,
 * stops the model inventing data, and means every gap a tool sees is real.
 */

const RiskLevel = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const GapFiltersSchema = z
  .object({
    riskLevel: z.array(RiskLevel).optional().describe("Only gaps at these risk levels"),
    jurisdiction: z
      .array(z.string())
      .optional()
      .describe("Only gaps in these jurisdictions (codes such as US, CN, DE)"),
    assetType: z.array(z.enum(["PATENT", "TRADEMARK"])).optional(),
    personStatus: z
      .enum(["current", "former"])
      .optional()
      .describe("current = still at the company, former = has left"),
  })
  .strict();

const PortfolioInput = z.object({ filters: GapFiltersSchema.optional() }).strict();
const GapInput = z
  .object({ gapId: z.string().min(1).describe("Gap id from an earlier tool result") })
  .strict();
const QueryInput = z
  .object({ question: z.string().min(1).max(500).describe("Natural-language filter question") })
  .strict();

export type GapFilters = z.infer<typeof GapFiltersSchema>;

export const ASSISTANT_TOOLS = {
  analyzeGaps: {
    kind: "portfolio",
    schema: PortfolioInput,
    description:
      "Find patterns, root causes and risk areas across the open IP assignment gaps (optionally filtered). Use for 'what is going wrong overall' questions.",
  },
  rankPriorities: {
    kind: "portfolio",
    schema: PortfolioInput,
    description:
      "Rank open gaps by strategic priority, returning a 1-100 priority score, urgency factors and estimated resolution time per gap. Use to decide what to fix first. Returns gap ids you can pass to the single-gap tools.",
  },
  detectAnomalies: {
    kind: "portfolio",
    schema: PortfolioInput,
    description:
      "Flag unusual delays, compliance violations and risk spikes across open gaps, with evidence.",
  },
  generateAdvisory: {
    kind: "portfolio",
    schema: PortfolioInput,
    description:
      "Write an executive advisory report (summary, risk narrative, prioritised actions, timeline). Use only when the user asks for a report or briefing.",
  },
  queryAssignments: {
    kind: "query",
    schema: QueryInput,
    description:
      "Find the gaps that match a natural-language description, e.g. 'former contractors with Chinese patents'. Returns matching gap ids and details.",
  },
  recommendActions: {
    kind: "gap",
    schema: GapInput,
    description: "Concrete next steps, priority and timeline to resolve one specific gap.",
  },
  checkCompliance: {
    kind: "gap",
    schema: GapInput,
    description: "Check one gap against its jurisdiction's IP assignment rules.",
  },
  predictRisk: {
    kind: "gap",
    schema: GapInput,
    description: "Predict whether one gap is likely to be resolved, at risk, or likely to fail.",
  },
} as const;

export type AssistantToolName = keyof typeof ASSISTANT_TOOLS;

export function isAssistantTool(name: string): name is AssistantToolName {
  return Object.prototype.hasOwnProperty.call(ASSISTANT_TOOLS, name);
}

/** Tool definitions for the Messages API, with JSON Schema generated from the Zod schemas. */
export function anthropicToolDefinitions(): Anthropic.Beta.BetaTool[] {
  return (
    Object.entries(ASSISTANT_TOOLS) as [
      AssistantToolName,
      (typeof ASSISTANT_TOOLS)[AssistantToolName],
    ][]
  ).map(([name, def]) => {
    const schema = z.toJSONSchema(def.schema) as Record<string, unknown>;
    delete schema.$schema;
    return {
      name,
      description: def.description,
      input_schema: schema as Anthropic.Beta.BetaTool.InputSchema,
    };
  });
}

/** Portfolio tools see at most this many gaps (highest risk first) to bound prompt size. */
export const MAX_GAPS_PER_TOOL = 40;

export function filterGaps(gaps: IntelligenceGap[], filters: GapFilters = {}): IntelligenceGap[] {
  return gaps.filter((g) => {
    if (filters.riskLevel?.length && !filters.riskLevel.includes(g.riskLevel)) return false;
    if (
      filters.jurisdiction?.length &&
      !filters.jurisdiction.map((j) => j.toUpperCase()).includes(g.jurisdiction.toUpperCase())
    )
      return false;
    if (
      filters.assetType?.length &&
      !filters.assetType.includes(g.assetType as "PATENT" | "TRADEMARK")
    )
      return false;
    if (filters.personStatus === "current" && g.personEndDate) return false;
    if (filters.personStatus === "former" && !g.personEndDate) return false;
    return true;
  });
}

export function topByRisk(gaps: IntelligenceGap[], limit = MAX_GAPS_PER_TOOL): IntelligenceGap[] {
  return [...gaps].sort((a, b) => b.riskScore - a.riskScore).slice(0, limit);
}

/** The fields of a gap the model needs to talk about it. Email is left out. */
export function compactGap(g: IntelligenceGap) {
  return {
    gapId: g.id,
    person: g.personName,
    role: g.personRole,
    current: !g.personEndDate,
    asset: g.assetTitle ?? "Company-wide",
    assetType: g.assetType,
    assetStatus: g.assetStatus,
    jurisdiction: g.jurisdiction,
    riskLevel: g.riskLevel,
    riskScore: g.riskScore,
    daysOutstanding: g.daysOverdue,
  };
}

/** Aggregate, name-free view of the portfolio given to the model up front. */
export function portfolioSummary(gaps: IntelligenceGap[]) {
  const count = (key: (g: IntelligenceGap) => string) =>
    gaps.reduce<Record<string, number>>((acc, g) => {
      const k = key(g);
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});
  return {
    openGaps: gaps.length,
    byRiskLevel: count((g) => g.riskLevel),
    byJurisdiction: count((g) => g.jurisdiction),
    byAssetType: count((g) => g.assetType),
    byPersonStatus: count((g) => (g.personEndDate ? "former" : "current")),
  };
}
