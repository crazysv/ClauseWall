// ============================================
// ACHIEVEMENTS — Gamification system
// Computed client-side from portfolio stats
// ============================================

import type { PortfolioStats, Achievement } from "@/types";

interface AchievementDef {
  code: string;
  name: string;
  description: string;
  icon: string;
  check: (stats: PortfolioStats) => { unlocked: boolean; progress: number; target: number };
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    code: "first_blood",
    name: "First Blood",
    description: "Analyzed your first contract",
    icon: "🎯",
    check: (s) => ({
      unlocked: s.totalContracts >= 1,
      progress: Math.min(s.totalContracts, 1),
      target: 1,
    }),
  },
  {
    code: "getting_started",
    name: "Getting Started",
    description: "Analyzed 3 contracts",
    icon: "📄",
    check: (s) => ({
      unlocked: s.totalContracts >= 3,
      progress: Math.min(s.totalContracts, 3),
      target: 3,
    }),
  },
  {
    code: "clause_hunter",
    name: "Clause Hunter",
    description: "Found 20+ dangerous or illegal clauses",
    icon: "🔍",
    check: (s) => ({
      unlocked: s.dangerousClausesCount + s.illegalClausesCount >= 20,
      progress: Math.min(s.dangerousClausesCount + s.illegalClausesCount, 20),
      target: 20,
    }),
  },
  {
    code: "red_flag_master",
    name: "Red Flag Master",
    description: "Found 50+ risky clauses total",
    icon: "🚩",
    check: (s) => ({
      unlocked:
        s.warningClausesCount + s.dangerousClausesCount + s.illegalClausesCount >= 50,
      progress: Math.min(
        s.warningClausesCount + s.dangerousClausesCount + s.illegalClausesCount,
        50
      ),
      target: 50,
    }),
  },
  {
    code: "legal_eagle",
    name: "Legal Eagle",
    description: "Analyzed 10+ contracts",
    icon: "⚖️",
    check: (s) => ({
      unlocked: s.totalContracts >= 10,
      progress: Math.min(s.totalContracts, 10),
      target: 10,
    }),
  },
  {
    code: "safe_player",
    name: "Safe Player",
    description: "Average risk score below 30",
    icon: "🛡️",
    check: (s) => ({
      unlocked: s.totalContracts >= 3 && s.averageRiskScore < 30,
      progress: s.totalContracts >= 3 ? (s.averageRiskScore < 30 ? 1 : 0) : 0,
      target: 1,
    }),
  },
  {
    code: "money_saver",
    name: "Money Saver",
    description: "Estimated savings crossed ₹1 Lakh",
    icon: "💰",
    check: (s) => ({
      unlocked: s.estimatedSavings >= 100000,
      progress: Math.min(s.estimatedSavings, 100000),
      target: 100000,
    }),
  },
  {
    code: "contract_builder",
    name: "Contract Builder",
    description: "Built your first fair contract",
    icon: "🔨",
    check: (s) => ({
      unlocked: s.contractsBuilt >= 1,
      progress: Math.min(s.contractsBuilt, 1),
      target: 1,
    }),
  },
  {
    code: "expert_analyzer",
    name: "Expert Analyzer",
    description: "Analyzed 25+ contracts",
    icon: "🏆",
    check: (s) => ({
      unlocked: s.totalContracts >= 25,
      progress: Math.min(s.totalContracts, 25),
      target: 25,
    }),
  },
  {
    code: "clause_century",
    name: "Clause Century",
    description: "Scanned 100+ total clauses",
    icon: "💯",
    check: (s) => ({
      unlocked: s.totalClauses >= 100,
      progress: Math.min(s.totalClauses, 100),
      target: 100,
    }),
  },
  {
    code: "improving",
    name: "Learning Curve",
    description: "Your recent contracts are safer than earlier ones",
    icon: "📈",
    check: (s) => ({
      unlocked: s.riskTrend === "improving" && s.riskTrendPercentage >= 10,
      progress: s.riskTrend === "improving" ? 1 : 0,
      target: 1,
    }),
  },
  {
    code: "big_saver",
    name: "Big Saver",
    description: "Estimated savings crossed ₹5 Lakhs",
    icon: "🏦",
    check: (s) => ({
      unlocked: s.estimatedSavings >= 500000,
      progress: Math.min(s.estimatedSavings, 500000),
      target: 500000,
    }),
  },
];

/**
 * Compute all achievements from stats
 */
export function computeAchievements(stats: PortfolioStats): Achievement[] {
  return ACHIEVEMENT_DEFS.map((def) => {
    const result = def.check(stats);
    return {
      code: def.code,
      name: def.name,
      description: def.description,
      icon: def.icon,
      unlocked: result.unlocked,
      progress: result.progress,
      target: result.target,
    };
  });
}

/**
 * Get count of unlocked achievements
 */
export function getUnlockedCount(achievements: Achievement[]): number {
  return achievements.filter((a) => a.unlocked).length;
}

/**
 * Get total achievements count
 */
export function getTotalAchievements(): number {
  return ACHIEVEMENT_DEFS.length;
}