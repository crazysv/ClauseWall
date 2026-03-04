// ============================================
// PORTFOLIO STATS — Compute from documents data
// ============================================

import type { Document, PortfolioStats, RiskDataPoint } from "@/types";

/**
 * Compute portfolio stats from a list of documents
 */
export function computePortfolioStats(
  documents: Document[],
  contractsBuilt: number
): PortfolioStats {
  const completed = documents.filter((d) => d.analysis_status === "completed");

  if (completed.length === 0) {
    return {
      totalContracts: 0,
      totalClauses: 0,
      safeClausesCount: 0,
      warningClausesCount: 0,
      dangerousClausesCount: 0,
      illegalClausesCount: 0,
      averageRiskScore: 0,
      estimatedSavings: 0,
      contractsBuilt,
      riskTrend: "stable",
      riskTrendPercentage: 0,
    };
  }

  // Sum up all clause counts
  const totalClauses = completed.reduce((sum, d) => sum + (d.total_clauses || 0), 0);
  const safeClausesCount = completed.reduce((sum, d) => sum + (d.safe_count || 0), 0);
  const warningClausesCount = completed.reduce((sum, d) => sum + (d.warning_count || 0), 0);
  const dangerousClausesCount = completed.reduce((sum, d) => sum + (d.dangerous_count || 0), 0);
  const illegalClausesCount = completed.reduce((sum, d) => sum + (d.illegal_count || 0), 0);

  // Average risk score
  const totalRisk = completed.reduce((sum, d) => sum + (d.overall_risk_score || 0), 0);
  const averageRiskScore = Math.round(totalRisk / completed.length);

  // Estimated savings (awareness value)
  // Illegal clause awareness ≈ ₹25,000 per clause
  // Dangerous clause awareness ≈ ₹10,000 per clause
  // Warning clause awareness ≈ ₹2,000 per clause
  const estimatedSavings =
    illegalClausesCount * 25000 +
    dangerousClausesCount * 10000 +
    warningClausesCount * 2000;

  // Risk trend — compare last 3 vs all-time average
  const { trend, percentage } = computeRiskTrend(completed);

  return {
    totalContracts: completed.length,
    totalClauses,
    safeClausesCount,
    warningClausesCount,
    dangerousClausesCount,
    illegalClausesCount,
    averageRiskScore,
    estimatedSavings,
    contractsBuilt,
    riskTrend: trend,
    riskTrendPercentage: percentage,
  };
}

/**
 * Compute risk trend by comparing recent vs overall
 */
function computeRiskTrend(
  documents: Document[]
): { trend: "improving" | "stable" | "worsening"; percentage: number } {
  if (documents.length < 2) {
    return { trend: "stable", percentage: 0 };
  }

  // Sort by date ascending
  const sorted = [...documents].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Get recent batch (last 3 or half, whichever is smaller)
  const recentCount = Math.min(3, Math.floor(sorted.length / 2));
  const recent = sorted.slice(-recentCount);
  const older = sorted.slice(0, -recentCount);

  if (older.length === 0) {
    return { trend: "stable", percentage: 0 };
  }

  const recentAvg =
    recent.reduce((sum, d) => sum + (d.overall_risk_score || 0), 0) / recent.length;
  const olderAvg =
    older.reduce((sum, d) => sum + (d.overall_risk_score || 0), 0) / older.length;

  const diff = olderAvg - recentAvg; // Positive = improving (lower recent scores)
  const percentage = olderAvg > 0 ? Math.round(Math.abs(diff / olderAvg) * 100) : 0;

  if (Math.abs(diff) < 5) {
    return { trend: "stable", percentage };
  }

  return {
    trend: diff > 0 ? "improving" : "worsening",
    percentage,
  };
}

/**
 * Build chart data points from documents
 */
export function buildRiskChartData(documents: Document[]): RiskDataPoint[] {
  const completed = documents.filter((d) => d.analysis_status === "completed");

  // Sort by date ascending
  const sorted = [...completed].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Take last 20 for chart readability
  const recent = sorted.slice(-20);

  return recent.map((doc) => ({
    date: formatShortDate(doc.created_at),
    score: doc.overall_risk_score || 0,
    label: doc.original_filename || "Untitled",
    documentType: doc.document_type,
  }));
}

/**
 * Get document type breakdown
 */
export function getDocTypeBreakdown(
  documents: Document[]
): { type: string; count: number; avgRisk: number }[] {
  const completed = documents.filter((d) => d.analysis_status === "completed");
  const groups: Record<string, { count: number; totalRisk: number }> = {};

  for (const doc of completed) {
    const type = doc.document_type;
    if (!groups[type]) {
      groups[type] = { count: 0, totalRisk: 0 };
    }
    groups[type].count++;
    groups[type].totalRisk += doc.overall_risk_score || 0;
  }

  return Object.entries(groups)
    .map(([type, data]) => ({
      type,
      count: data.count,
      avgRisk: Math.round(data.totalRisk / data.count),
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get jurisdiction breakdown
 */
export function getJurisdictionBreakdown(
  documents: Document[]
): { jurisdiction: string; count: number }[] {
  const completed = documents.filter((d) => d.analysis_status === "completed");
  const groups: Record<string, number> = {};

  for (const doc of completed) {
    const j = doc.jurisdiction;
    groups[j] = (groups[j] || 0) + 1;
  }

  return Object.entries(groups)
    .map(([jurisdiction, count]) => ({ jurisdiction, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Format date to short format for chart
 */
function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate();
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${day} ${months[date.getMonth()]}`;
}

/**
 * Format currency in Indian notation
 */
export function formatIndianCurrency(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount}`;
}