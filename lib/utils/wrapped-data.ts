// ============================================
// CONTRACT WRAPPED — Data Aggregation
// ============================================

import { createClient } from "@/lib/supabase/client";

export interface WrappedData {
  totalContracts: number;
  totalClauses: number;
  illegalFound: number;
  dangerousFound: number;
  warningFound: number;
  safeFound: number;
  estimatedSavings: number;
  riskiestContract: { name: string; score: number; type: string } | null;
  safestContract: { name: string; score: number; type: string } | null;
  avgRiskScore: number;
  topDocumentType: string;
  topJurisdiction: string;
  badge: { name: string; icon: string; description: string };
  percentile: number;
  period: string;
}

export async function getWrappedData(): Promise<WrappedData | null> {
  try {
    const supabase = createClient();

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log("Wrapped - Auth check:", { userId: user?.id, authError }); // Debug

    if (authError || !user) {
      console.log("Wrapped - No user logged in");
      
      // Try to get documents without user filter (for testing)
      // Remove this in production!
      const { data: allDocs, error: allDocsError } = await supabase
        .from("documents")
        .select("*")
        .eq("analysis_status", "completed")
        .order("created_at", { ascending: true })
        .limit(20);
      
      console.log("Wrapped - All docs (no user filter):", { 
        count: allDocs?.length, 
        error: allDocsError 
      });

      if (allDocs && allDocs.length > 0) {
        // Use all docs for demo purposes
        return processDocuments(allDocs);
      }
      
      return null;
    }

    // Get user's documents
    const { data: docs, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", user.id)
      .eq("analysis_status", "completed")
      .order("created_at", { ascending: true });

    console.log("Wrapped - User docs:", { 
      userId: user.id, 
      count: docs?.length, 
      error 
    }); // Debug

    if (error) {
      console.error("Wrapped - Query error:", error);
      return null;
    }

    if (!docs || docs.length === 0) {
      console.log("Wrapped - No documents found for user");
      
      // Check if there are ANY documents (might be user_id mismatch)
      const { data: anyDocs } = await supabase
        .from("documents")
        .select("id, user_id, analysis_status")
        .limit(5);
      
      console.log("Wrapped - Sample documents in DB:", anyDocs);
      
      return null;
    }

    return processDocuments(docs);
  } catch (err) {
    console.error("Wrapped - Error:", err);
    return null;
  }
}

function processDocuments(docs: any[]): WrappedData {
  const totalContracts = docs.length;
  const totalClauses = docs.reduce((s, d) => s + (d.total_clauses || 0), 0);
  const illegalFound = docs.reduce((s, d) => s + (d.illegal_count || 0), 0);
  const dangerousFound = docs.reduce((s, d) => s + (d.dangerous_count || 0), 0);
  const warningFound = docs.reduce((s, d) => s + (d.warning_count || 0), 0);
  const safeFound = docs.reduce((s, d) => s + (d.safe_count || 0), 0);
  const avgRiskScore = Math.round(
    docs.reduce((s, d) => s + (d.overall_risk_score || 0), 0) / totalContracts
  );

  // Estimated savings (rough calculation)
  const estimatedSavings =
    illegalFound * 25000 + dangerousFound * 10000 + warningFound * 2000;

  // Riskiest & Safest
  const sorted = [...docs].sort(
    (a, b) => (b.overall_risk_score || 0) - (a.overall_risk_score || 0)
  );
  const riskiest = sorted[0];
  const safest = sorted[sorted.length - 1];

  // Most common type
  const typeCounts: Record<string, number> = {};
  docs.forEach((d) => {
    typeCounts[d.document_type] = (typeCounts[d.document_type] || 0) + 1;
  });
  const topDocumentType =
    Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "other";

  // Most common jurisdiction
  const jurisCounts: Record<string, number> = {};
  docs.forEach((d) => {
    jurisCounts[d.jurisdiction] = (jurisCounts[d.jurisdiction] || 0) + 1;
  });
  const topJurisdiction =
    Object.entries(jurisCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "IN-MH";

  // Badge
  const badge = getBadge(totalContracts, illegalFound, dangerousFound, estimatedSavings);

  // Percentile (estimated based on contracts scanned)
  const percentile = Math.min(99, Math.round(50 + totalContracts * 3 + illegalFound * 2));

  return {
    totalContracts,
    totalClauses,
    illegalFound,
    dangerousFound,
    warningFound,
    safeFound,
    estimatedSavings,
    riskiestContract: riskiest
      ? {
          name: riskiest.original_filename || "Untitled",
          score: riskiest.overall_risk_score,
          type: riskiest.document_type,
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
    avgRiskScore,
    topDocumentType,
    topJurisdiction,
    badge,
    percentile,
    period: new Date().getFullYear().toString(),
  };
}

function getBadge(
  contracts: number,
  illegal: number,
  dangerous: number,
  savings: number
) {
  if (illegal >= 10)
    return {
      name: "Legal Eagle",
      icon: "🦅",
      description: "Found 10+ illegal clauses",
    };
  if (contracts >= 10)
    return {
      name: "Clause Century",
      icon: "💯",
      description: "Scanned 10+ contracts",
    };
  if (savings >= 100000)
    return {
      name: "Money Saver",
      icon: "💰",
      description: "Saved ₹1L+ in risky clauses",
    };
  if (dangerous >= 5)
    return {
      name: "Red Flag Master",
      icon: "🚩",
      description: "Caught 5+ dangerous clauses",
    };
  if (contracts >= 5)
    return {
      name: "Clause Hunter",
      icon: "🔍",
      description: "Scanned 5+ contracts",
    };
  return {
    name: "First Blood",
    icon: "⚔️",
    description: "Started your contract defense journey",
  };
}