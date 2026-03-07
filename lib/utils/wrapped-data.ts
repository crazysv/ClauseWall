// ============================================
// CONTRACT WRAPPED — Enhanced Data Aggregation
// With personality, humor, and deep insights
// ============================================

import { createClient } from "@/lib/supabase/client";
import { getDocumentTypeLabel, getStateName } from "@/lib/utils/constants";

// ============================================
// TYPES
// ============================================

export interface WrappedData {
  // Core stats
  totalContracts: number;
  totalClauses: number;
  illegalFound: number;
  dangerousFound: number;
  warningFound: number;
  safeFound: number;
  estimatedSavings: number;
  avgRiskScore: number;

  // Contracts
  riskiestContract: { name: string; score: number; type: string; jurisdiction: string } | null;
  safestContract: { name: string; score: number; type: string } | null;

  // Categories
  topDocumentType: string;
  topDocumentTypeLabel: string;
  topDocumentTypeCount: number;
  topJurisdiction: string;
  topJurisdictionName: string;

  // Enhanced data
  mostCommonRedFlag: { type: string; label: string; count: number; wittyComment: string } | null;
  mostCommonClauseType: { type: string; label: string; count: number } | null;
  entityMentions: string[];
  dateRange: { first: string; last: string; spanDays: number };
  documentTypeBreakdown: { type: string; label: string; count: number }[];
  personalityType: { name: string; icon: string; description: string };

  // Badge + ranking
  badge: { name: string; icon: string; description: string };
  percentile: number;
  period: string;
}

// ============================================
// MAIN DATA FETCHER
// ============================================

export async function getWrappedData(): Promise<WrappedData | null> {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      // Fallback: try all docs for demo
      const { data: allDocs } = await supabase
        .from("documents")
        .select("*")
        .eq("analysis_status", "completed")
        .order("created_at", { ascending: true })
        .limit(50);

      if (allDocs && allDocs.length > 0) {
        return await processDocuments(allDocs, supabase);
      }
      return null;
    }

    const { data: docs, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", user.id)
      .eq("analysis_status", "completed")
      .order("created_at", { ascending: true });

    if (error || !docs || docs.length === 0) return null;

    return await processDocuments(docs, supabase);
  } catch (err) {
    console.error("Wrapped - Error:", err);
    return null;
  }
}

// ============================================
// PROCESS DOCUMENTS INTO WRAPPED DATA
// ============================================

async function processDocuments(docs: any[], supabase: any): Promise<WrappedData> {
  const totalContracts = docs.length;
  const totalClauses = docs.reduce((s: number, d: any) => s + (d.total_clauses || 0), 0);
  const illegalFound = docs.reduce((s: number, d: any) => s + (d.illegal_count || 0), 0);
  const dangerousFound = docs.reduce((s: number, d: any) => s + (d.dangerous_count || 0), 0);
  const warningFound = docs.reduce((s: number, d: any) => s + (d.warning_count || 0), 0);
  const safeFound = docs.reduce((s: number, d: any) => s + (d.safe_count || 0), 0);
  const avgRiskScore = Math.round(
    docs.reduce((s: number, d: any) => s + (d.overall_risk_score || 0), 0) / totalContracts
  );

  const estimatedSavings =
    illegalFound * 25000 + dangerousFound * 10000 + warningFound * 2000;

  // ── Riskiest & Safest ──
  const sorted = [...docs].sort(
    (a: any, b: any) => (b.overall_risk_score || 0) - (a.overall_risk_score || 0)
  );
  const riskiest = sorted[0];
  const safest = sorted[sorted.length - 1];

  // ── Document Type Breakdown ──
  const typeCounts: Record<string, number> = {};
  docs.forEach((d: any) => {
    typeCounts[d.document_type] = (typeCounts[d.document_type] || 0) + 1;
  });
  const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  const topDocumentType = sortedTypes[0]?.[0] || "other";
  const topDocumentTypeCount = sortedTypes[0]?.[1] || 0;

  const documentTypeBreakdown = sortedTypes.map(([type, count]) => ({
    type,
    label: getDocumentTypeLabel(type),
    count,
  }));

  // ── Jurisdiction ──
  const jurisCounts: Record<string, number> = {};
  docs.forEach((d: any) => {
    jurisCounts[d.jurisdiction] = (jurisCounts[d.jurisdiction] || 0) + 1;
  });
  const topJurisdiction =
    Object.entries(jurisCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "IN-MH";

  // ── Entity Mentions ──
  const entities: string[] = [];
  docs.forEach((d: any) => {
    if (d.entity_name && !entities.includes(d.entity_name)) {
      entities.push(d.entity_name);
    }
  });

  // ── Date Range ──
  const firstDate = new Date(docs[0].created_at);
  const lastDate = new Date(docs[docs.length - 1].created_at);
  const spanDays = Math.max(
    1,
    Math.round((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  // ── Most Common Red Flag (from clauses) ──
  let mostCommonRedFlag: WrappedData["mostCommonRedFlag"] = null;
  let mostCommonClauseType: WrappedData["mostCommonClauseType"] = null;

  try {
    const docIds = docs.map((d: any) => d.id);

    // Fetch dangerous/illegal clauses for red flag analysis
    const { data: riskyClauseData } = await supabase
      .from("clauses")
      .select("clause_type, risk_level")
      .in("document_id", docIds)
      .in("risk_level", ["dangerous", "illegal"]);

    if (riskyClauseData && riskyClauseData.length > 0) {
      // Count by clause type
      const clauseTypeCounts: Record<string, number> = {};
      riskyClauseData.forEach((c: any) => {
        clauseTypeCounts[c.clause_type] = (clauseTypeCounts[c.clause_type] || 0) + 1;
      });

      const topRedFlag = Object.entries(clauseTypeCounts).sort(
        (a, b) => b[1] - a[1]
      )[0];

      if (topRedFlag) {
        const [type, count] = topRedFlag;
        mostCommonRedFlag = {
          type,
          label: formatClauseTypeLabel(type),
          count,
          wittyComment: getRedFlagComment(type, count, topJurisdiction),
        };
      }
    }

    // Most common clause type overall
    const { data: allClauseData } = await supabase
      .from("clauses")
      .select("clause_type")
      .in("document_id", docIds);

    if (allClauseData && allClauseData.length > 0) {
      const allTypeCounts: Record<string, number> = {};
      allClauseData.forEach((c: any) => {
        allTypeCounts[c.clause_type] = (allTypeCounts[c.clause_type] || 0) + 1;
      });

      const topType = Object.entries(allTypeCounts).sort(
        (a, b) => b[1] - a[1]
      )[0];

      if (topType) {
        mostCommonClauseType = {
          type: topType[0],
          label: formatClauseTypeLabel(topType[0]),
          count: topType[1],
        };
      }
    }
  } catch {
    // Non-fatal — wrapped works without clause data
  }

  // ── Personality Type ──
  const personalityType = getPersonalityType(
    totalContracts,
    avgRiskScore,
    illegalFound,
    dangerousFound,
    topDocumentType
  );

  // ── Badge ──
  const badge = getBadge(totalContracts, illegalFound, dangerousFound, estimatedSavings);

  // ── Percentile ──
  const percentile = Math.min(
    99,
    Math.round(50 + totalContracts * 3 + illegalFound * 2)
  );

  // ── Period Label ──
  const period = buildPeriodLabel(firstDate, lastDate);

  return {
    totalContracts,
    totalClauses,
    illegalFound,
    dangerousFound,
    warningFound,
    safeFound,
    estimatedSavings,
    avgRiskScore,
    riskiestContract: riskiest
      ? {
          name: riskiest.original_filename || "Untitled",
          score: riskiest.overall_risk_score,
          type: riskiest.document_type,
          jurisdiction: riskiest.jurisdiction,
        }
      : null,
    safestContract:
      safest && safest.id !== riskiest?.id
        ? {
            name: safest.original_filename || "Untitled",
            score: safest.overall_risk_score,
            type: safest.document_type,
          }
        : null,
    topDocumentType,
    topDocumentTypeLabel: getDocumentTypeLabel(topDocumentType),
    topDocumentTypeCount,
    topJurisdiction,
    topJurisdictionName: getStateName(topJurisdiction),
    mostCommonRedFlag,
    mostCommonClauseType,
    entityMentions: entities.slice(0, 5),
    dateRange: {
      first: formatDate(firstDate),
      last: formatDate(lastDate),
      spanDays,
    },
    documentTypeBreakdown,
    personalityType,
    badge,
    percentile,
    period,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatDate(date: Date): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function buildPeriodLabel(first: Date, last: Date): string {
  const year = last.getFullYear();
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  if (first.getFullYear() === last.getFullYear()) {
    if (first.getMonth() === last.getMonth()) {
      return `${months[first.getMonth()]} ${year}`;
    }
    return `${months[first.getMonth()]}–${months[last.getMonth()]} ${year}`;
  }
  return `${months[first.getMonth()]} ${first.getFullYear()}–${months[last.getMonth()]} ${year}`;
}

function formatClauseTypeLabel(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getRedFlagComment(
  type: string,
  count: number,
  jurisdiction: string
): string {
  const comments: Record<string, string[]> = {
    security_deposit: [
      "Mumbai landlords, am I right? 🙄",
      "Someone really loves collecting your money 💸",
      "Deposits bigger than your dreams 😅",
    ],
    lock_in_period: [
      "They want commitment? Give them a talking-to first 😤",
      "Trapped like a Monday morning meeting 📅",
      "Lock-in tighter than Mumbai traffic 🚗",
    ],
    termination_notice: [
      "They can leave, you can't. Classic. 🎭",
      "One-sided breakup energy 💔",
    ],
    non_compete: [
      "Section 27 says hi 👋",
      "They want you to not work... anywhere? Bold. 😂",
    ],
    penalties: [
      "Penalties that need their own EMI plan 📊",
      "Penalty amount: basically your kidney 🫘",
    ],
    late_fees: [
      "Late by 1 day? That'll be your firstborn please 👶",
      "Late fees with compound interest? That's not a clause, that's a loan 🏦",
    ],
    painting_charges: [
      "The eternal painting scam continues 🎨",
      "Mandatory painting = mandatory robbery 🖌️",
    ],
    rent_payment: [
      "Rent goes up, salary stays the same 📈📉",
    ],
    liability_waiver: [
      "You waive everything, they waive nothing. Fair? 🤷",
    ],
    confidentiality: [
      "NDA so strict you can't even think about them 🤐",
    ],
    training_bond: [
      "Training bond > actual training cost. Always. 🎓",
    ],
    notice_period: [
      "3 months notice? That's not notice, that's a jail sentence ⛓️",
    ],
  };

  const pool = comments[type] || [
    "This keeps showing up. Take the hint. 👀",
    `Found in ${count} contracts. Someone's got a pattern 🔄`,
  ];

  return pool[Math.floor(Math.random() * pool.length)];
}

function getPersonalityType(
  contracts: number,
  avgRisk: number,
  illegal: number,
  dangerous: number,
  topType: string
): { name: string; icon: string; description: string } {
  // High risk contracts
  if (avgRisk >= 70) {
    return {
      name: "The Survivor",
      icon: "🛡️",
      description:
        "You deal with seriously risky contracts. But you check them — and that makes all the difference.",
    };
  }

  // Lots of illegal findings
  if (illegal >= 8) {
    return {
      name: "The Whistleblower",
      icon: "📢",
      description:
        "You've uncovered more illegal clauses than most lawyers see in a month. Respect.",
    };
  }

  // Many contracts scanned
  if (contracts >= 15) {
    return {
      name: "The Paranoid Pro",
      icon: "🔍",
      description:
        "You check EVERYTHING. And honestly? That's the smartest thing you can do.",
    };
  }

  // Mostly rental
  if (topType === "rental") {
    return {
      name: "The Tenant Warrior",
      icon: "🏠",
      description:
        "You fight back against landlord overreach. Every tenant deserves someone like you.",
    };
  }

  // Mostly employment
  if (topType === "employment") {
    return {
      name: "The Career Guardian",
      icon: "💼",
      description:
        "You read the fine print before saying yes to HR. Smart move — most people don't.",
    };
  }

  // Mostly loan
  if (topType === "loan") {
    return {
      name: "The Money Mind",
      icon: "🏦",
      description:
        "You don't just take loans — you understand them. Banks love people who don't do this.",
    };
  }

  // Low risk contracts
  if (avgRisk <= 30) {
    return {
      name: "The Lucky One",
      icon: "🍀",
      description:
        "Your contracts are surprisingly fair. Either you choose well, or you have great karma.",
    };
  }

  // Default
  return {
    name: "The Aware Citizen",
    icon: "⚖️",
    description:
      "You don't sign blind. In a country where most do, that puts you ahead of the game.",
  };
}

function getBadge(
  contracts: number,
  illegal: number,
  dangerous: number,
  savings: number
): { name: string; icon: string; description: string } {
  if (illegal >= 15)
    return {
      name: "Supreme Court",
      icon: "⚖️",
      description: "Found 15+ illegal clauses. You ARE the law.",
    };
  if (illegal >= 10)
    return {
      name: "Legal Eagle",
      icon: "🦅",
      description: "Found 10+ illegal clauses. Nothing gets past you.",
    };
  if (contracts >= 20)
    return {
      name: "Contract Machine",
      icon: "⚙️",
      description: "Scanned 20+ contracts. You're on autopilot.",
    };
  if (savings >= 500000)
    return {
      name: "Lakhpati Saver",
      icon: "💎",
      description: "Saved over ₹5L in risky clauses. That's a car.",
    };
  if (contracts >= 10)
    return {
      name: "Clause Century",
      icon: "💯",
      description: "Scanned 10+ contracts. Double digits!",
    };
  if (savings >= 100000)
    return {
      name: "Money Saver",
      icon: "💰",
      description: "Saved ₹1L+ in risky clauses. Treat yourself.",
    };
  if (dangerous >= 5)
    return {
      name: "Red Flag Master",
      icon: "🚩",
      description: "Caught 5+ dangerous clauses. Sharp eyes.",
    };
  if (contracts >= 5)
    return {
      name: "Clause Hunter",
      icon: "🔍",
      description: "Scanned 5+ contracts. Building the habit.",
    };
  if (contracts >= 3)
    return {
      name: "Getting Serious",
      icon: "📋",
      description: "3+ contracts scanned. You're committed now.",
    };
  return {
    name: "First Blood",
    icon: "⚔️",
    description: "Started your contract defense journey.",
  };
}