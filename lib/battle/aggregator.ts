// ============================================
// CONTRACT BATTLE — DATA AGGREGATOR
// Fetches comparison data from database
// ============================================

import { SupabaseClient } from "@supabase/supabase-js";
import type { Clause, Document } from "@/types";
import {
  BattleData,
  BattleScores,
  BattleScope,
  ClauseComparison,
  ScoreComparison,
  CLAUSE_LABELS,
} from "./types";

const MINIMUM_CONTRACTS = 10;

/**
 * Get document counts for state and India
 */
async function getCounts(
  supabase: SupabaseClient,
  docType: string,
  jurisdiction: string
): Promise<{ stateCount: number; indiaCount: number }> {
  // State count
  const { count: stateCount } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("document_type", docType)
    .eq("jurisdiction", jurisdiction)
    .eq("analysis_status", "completed");

  // India count
  const { count: indiaCount } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("document_type", docType)
    .eq("analysis_status", "completed");

  return {
    stateCount: stateCount || 0,
    indiaCount: indiaCount || 0,
  };
}

/**
 * Determine available scopes
 */
export async function getAvailableScopes(
  supabase: SupabaseClient,
  docType: string,
  jurisdiction: string
): Promise<{ state: BattleScope; india: BattleScope }> {
  const { stateCount, indiaCount } = await getCounts(supabase, docType, jurisdiction);

  const stateLabel = jurisdiction.charAt(0).toUpperCase() + jurisdiction.slice(1).replace(/_/g, " ");

  return {
    state: {
      type: "state",
      label: stateLabel,
      count: stateCount,
      available: stateCount >= MINIMUM_CONTRACTS,
    },
    india: {
      type: "india",
      label: "All India",
      count: indiaCount,
      available: indiaCount >= MINIMUM_CONTRACTS,
    },
  };
}

/**
 * Get comparison document IDs based on scope
 */
async function getComparisonDocIds(
  supabase: SupabaseClient,
  docType: string,
  jurisdiction: string | null,
  excludeDocId: string
): Promise<string[]> {
  let query = supabase
    .from("documents")
    .select("id")
    .eq("document_type", docType)
    .eq("analysis_status", "completed")
    .neq("id", excludeDocId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (jurisdiction) {
    query = query.eq("jurisdiction", jurisdiction);
  }

  const { data } = await query;
  return data?.map((d) => d.id) || [];
}

/**
 * Get legal limits from structured_rules
 */
async function getLegalLimits(
  supabase: SupabaseClient,
  jurisdiction: string,
  docType: string
): Promise<
  Map<string, { value: number; unit: string; statute: string }>
> {
  const { data } = await supabase
    .from("structured_rules")
    .select("clause_type, limit_value, limit_unit, statute_code")
    .eq("jurisdiction", jurisdiction)
    .eq("document_type", docType)
    .eq("is_active", true)
    .in("rule_type", ["max_value", "min_value"])
    .not("limit_value", "is", null);

  const limits = new Map<string, { value: number; unit: string; statute: string }>();

  if (data) {
    for (const rule of data) {
      if (rule.limit_value != null) {
        limits.set(rule.clause_type, {
          value: Number(rule.limit_value),
          unit: rule.limit_unit || "",
          statute: rule.statute_code || "",
        });
      }
    }
  }

  return limits;
}

/**
 * Calculate percentile (what % of values are LOWER than yours)
 */
function calculatePercentile(yourValue: number, allValues: number[]): number {
  if (allValues.length === 0) return 50;
  const sorted = [...allValues].sort((a, b) => a - b);
  const lowerCount = sorted.filter((v) => v < yourValue).length;
  return Math.round((lowerCount / sorted.length) * 100);
}

/**
 * Generate insight text
 */
function generateInsight(
  ratio: number,
  clauseLabel: string,
  yourValue: number,
  yourUnit: string,
  avgValue: number,
  legalLimit: number | null
): { text: string; severity: "better" | "average" | "worse" | "critical" } {
  if (legalLimit && yourValue > legalLimit) {
    const overBy = (yourValue / legalLimit).toFixed(1);
    return {
      text: `${overBy}x over the legal limit! Likely illegal.`,
      severity: "critical",
    };
  }

  if (ratio <= 0.8) {
    return {
      text: `Better than average. This clause is fair.`,
      severity: "better",
    };
  }

  if (ratio <= 1.2) {
    return {
      text: `About average for this type of contract.`,
      severity: "average",
    };
  }

  if (ratio <= 2) {
    return {
      text: `${ratio.toFixed(1)}x higher than average. Consider negotiating.`,
      severity: "worse",
    };
  }

  return {
    text: `${ratio.toFixed(1)}x higher than average! This is very aggressive.`,
    severity: "critical",
  };
}

/**
 * Get FULL battle data with extracted values
 */
export async function getBattleData(
  supabase: SupabaseClient,
  doc: Document,
  clauses: Clause[],
  scope: "state" | "india"
): Promise<BattleData | null> {
  const jurisdiction = scope === "state" ? doc.jurisdiction : null;

  // Get comparison document IDs
  const compDocIds = await getComparisonDocIds(
    supabase,
    doc.document_type,
    jurisdiction,
    doc.id
  );

  if (compDocIds.length < MINIMUM_CONTRACTS) return null;

  // Get all clauses with extracted values from comparison docs
  // Batch in chunks of 100 to avoid query limits
  const allCompClauses: any[] = [];
  for (let i = 0; i < compDocIds.length; i += 100) {
    const batch = compDocIds.slice(i, i + 100);
    const { data } = await supabase
      .from("clauses")
      .select("clause_type, extracted_value, extracted_unit, risk_score")
      .in("document_id", batch)
      .not("extracted_value", "is", null);

    if (data) allCompClauses.push(...data);
  }

  // Get legal limits
  const legalLimits = await getLegalLimits(
    supabase,
    doc.jurisdiction,
    doc.document_type
  );

  // Group comparison clauses by type
  const compByType = new Map<string, { values: number[]; units: string[]; scores: number[] }>();
  for (const c of allCompClauses) {
    if (!compByType.has(c.clause_type)) {
      compByType.set(c.clause_type, { values: [], units: [], scores: [] });
    }
    const group = compByType.get(c.clause_type)!;
    group.values.push(Number(c.extracted_value));
    if (c.extracted_unit) group.units.push(c.extracted_unit);
    if (c.risk_score != null) group.scores.push(c.risk_score);
  }

  // Build comparisons for clauses that have extracted values
  const comparisons: ClauseComparison[] = [];

  for (const clause of clauses) {
    if (clause.extracted_value == null) continue;

    const compGroup = compByType.get(clause.clause_type);
    if (!compGroup || compGroup.values.length < 3) continue;

    const yourValue = Number(clause.extracted_value);
    const avgValue = compGroup.values.reduce((a, b) => a + b, 0) / compGroup.values.length;
    const ratio = avgValue > 0 ? yourValue / avgValue : 1;
    const percentile = calculatePercentile(yourValue, compGroup.values);

    const legal = legalLimits.get(clause.clause_type);
    const unit = clause.extracted_unit || compGroup.units[0] || "";

    const clauseLabel = CLAUSE_LABELS[clause.clause_type] || clause.clause_type;

    const { text: insight, severity } = generateInsight(
      ratio,
      clauseLabel,
      yourValue,
      unit,
      avgValue,
      legal?.value ?? null
    );

    comparisons.push({
      clauseType: clause.clause_type,
      clauseLabel,
      yourValue,
      yourUnit: unit,
      yourRiskLevel: clause.risk_level,
      avgValue: Math.round(avgValue * 10) / 10,
      avgUnit: unit,
      sampleCount: compGroup.values.length,
      legalLimit: legal?.value ?? null,
      legalUnit: legal?.unit ?? null,
      statuteCode: legal?.statute ?? null,
      percentile,
      ratio: Math.round(ratio * 10) / 10,
      insight,
      severity,
    });
  }

  // Sort: critical first, then worse, average, better
  const severityOrder = { critical: 0, worse: 1, average: 2, better: 3 };
  comparisons.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Overall percentile based on risk scores
  const overallPercentile = await getOverallPercentile(
    supabase,
    doc,
    scope
  );

  // Generate insights
  const insights: string[] = [];
  const criticalCount = comparisons.filter((c) => c.severity === "critical").length;
  const worseCount = comparisons.filter((c) => c.severity === "worse").length;
  const betterCount = comparisons.filter((c) => c.severity === "better").length;

  if (criticalCount > 0) {
    insights.push(
      `🚨 ${criticalCount} clause${criticalCount > 1 ? "s" : ""} ${criticalCount > 1 ? "are" : "is"} significantly worse than average or over legal limits`
    );
  }
  if (worseCount > 0) {
    insights.push(
      `⚠️ ${worseCount} clause${worseCount > 1 ? "s" : ""} ${worseCount > 1 ? "are" : "is"} harsher than average — worth negotiating`
    );
  }
  if (betterCount > 0) {
    insights.push(
      `✅ ${betterCount} clause${betterCount > 1 ? "s" : ""} ${betterCount > 1 ? "are" : "is"} fair or better than average`
    );
  }
  if (comparisons.length === 0) {
    insights.push("📊 No numeric values available for detailed comparison. Showing risk score comparison instead.");
  }

  const stateLabel = doc.jurisdiction.charAt(0).toUpperCase() + doc.jurisdiction.slice(1).replace(/_/g, " ");

  return {
    scope: {
      type: scope,
      label: scope === "state" ? stateLabel : "All India",
      count: compDocIds.length,
      available: true,
    },
    overallPercentile,
    overallVerdict: getVerdict(overallPercentile),
    comparisons,
    insights,
    totalContractsAnalyzed: compDocIds.length,
  };
}

/**
 * Get risk-score-based battle (fallback when no extracted values)
 */
export async function getBattleScores(
  supabase: SupabaseClient,
  doc: Document,
  clauses: Clause[],
  scope: "state" | "india"
): Promise<BattleScores | null> {
  const jurisdiction = scope === "state" ? doc.jurisdiction : null;

  const compDocIds = await getComparisonDocIds(
    supabase,
    doc.document_type,
    jurisdiction,
    doc.id
  );

  if (compDocIds.length < MINIMUM_CONTRACTS) return null;

  // Get all clauses from comparison docs (risk scores only)
  const allCompClauses: any[] = [];
  for (let i = 0; i < compDocIds.length; i += 100) {
    const batch = compDocIds.slice(i, i + 100);
    const { data } = await supabase
      .from("clauses")
      .select("clause_type, risk_score")
      .in("document_id", batch);

    if (data) allCompClauses.push(...data);
  }

  // Group by clause type
  const compByType = new Map<string, number[]>();
  for (const c of allCompClauses) {
    if (c.risk_score == null) continue;
    if (!compByType.has(c.clause_type)) compByType.set(c.clause_type, []);
    compByType.get(c.clause_type)!.push(c.risk_score);
  }

  const scoreComparisons: ScoreComparison[] = [];

  for (const clause of clauses) {
    const compScores = compByType.get(clause.clause_type);
    if (!compScores || compScores.length < 3) continue;

    const avgScore = Math.round(compScores.reduce((a, b) => a + b, 0) / compScores.length);
    const percentile = calculatePercentile(clause.risk_score, compScores);

    const clauseLabel = CLAUSE_LABELS[clause.clause_type] || clause.clause_type;

    let insight: string;
    let severity: "better" | "average" | "worse" | "critical";

    if (clause.risk_score <= avgScore * 0.7) {
      insight = "This clause is safer than average.";
      severity = "better";
    } else if (clause.risk_score <= avgScore * 1.3) {
      insight = "About average risk for this clause type.";
      severity = "average";
    } else if (clause.risk_score <= avgScore * 2) {
      insight = "Riskier than average. Worth reviewing.";
      severity = "worse";
    } else {
      insight = "Significantly riskier than average!";
      severity = "critical";
    }

    scoreComparisons.push({
      clauseType: clause.clause_type,
      clauseLabel,
      yourScore: clause.risk_score,
      avgScore,
      yourRiskLevel: clause.risk_level,
      sampleCount: compScores.length,
      percentile,
      insight,
      severity,
    });
  }

  // Sort by severity
  const severityOrder = { critical: 0, worse: 1, average: 2, better: 3 };
  scoreComparisons.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const overallPercentile = await getOverallPercentile(supabase, doc, scope);

  const stateLabel = doc.jurisdiction.charAt(0).toUpperCase() + doc.jurisdiction.slice(1).replace(/_/g, " ");

  return {
    scope: {
      type: scope,
      label: scope === "state" ? stateLabel : "All India",
      count: compDocIds.length,
      available: true,
    },
    overallPercentile,
    overallVerdict: getVerdict(overallPercentile),
    scoreComparisons,
    insights: generateScoreInsights(scoreComparisons),
    totalContractsAnalyzed: compDocIds.length,
  };
}

/**
 * Get overall document percentile
 */
async function getOverallPercentile(
  supabase: SupabaseClient,
  doc: Document,
  scope: "state" | "india"
): Promise<number> {
  let query = supabase
    .from("documents")
    .select("overall_risk_score")
    .eq("document_type", doc.document_type)
    .eq("analysis_status", "completed")
    .neq("id", doc.id)
    .not("overall_risk_score", "is", null);

  if (scope === "state") {
    query = query.eq("jurisdiction", doc.jurisdiction);
  }

  const { data } = await query;
  if (!data || data.length === 0) return 50;

  const allScores = data.map((d) => d.overall_risk_score as number);
  return calculatePercentile(doc.overall_risk_score, allScores);
}

/**
 * Generate verdict text
 */
function getVerdict(percentile: number): string {
  if (percentile >= 90) return "Extremely harsh — among the worst";
  if (percentile >= 75) return "Significantly harsher than most";
  if (percentile >= 60) return "Harsher than average";
  if (percentile >= 40) return "About average";
  if (percentile >= 25) return "Better than most";
  if (percentile >= 10) return "Significantly fairer than most";
  return "Among the fairest contracts";
}

/**
 * Generate insights for score-based comparison
 */
function generateScoreInsights(comparisons: ScoreComparison[]): string[] {
  const insights: string[] = [];
  const critical = comparisons.filter((c) => c.severity === "critical");
  const worse = comparisons.filter((c) => c.severity === "worse");
  const better = comparisons.filter((c) => c.severity === "better");

  if (critical.length > 0) {
    const names = critical.slice(0, 3).map((c) => c.clauseLabel).join(", ");
    insights.push(`🚨 ${names} — significantly riskier than average`);
  }
  if (worse.length > 0) {
    insights.push(`⚠️ ${worse.length} clauses are harsher than typical contracts`);
  }
  if (better.length > 0) {
    insights.push(`✅ ${better.length} clauses are fairer than average`);
  }

  return insights;
}