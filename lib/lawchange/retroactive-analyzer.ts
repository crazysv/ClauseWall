// ============================================
// RETROACTIVE LAW CHANGE ANALYZER
// Checks if any law changes since a contract's
// signing date affect it. Called during analysis
// pipeline and from the results page.
// ============================================

import type { LawChangeImpact, RetroactiveAnalysis } from "@/types";
import { getLawChangeDB } from "./db";

/**
 * Analyze retroactive impact of law changes on a document.
 * Returns changes that happened after the signing date.
 */
export async function analyzeRetroactiveImpact(
  documentId: string,
  signingDate: string | null,
  documentType: string,
  jurisdiction: string,
  clauses: Array<{
    clause_type: string;
    clause_number: number;
    original_text: string;
  }>
): Promise<RetroactiveAnalysis> {
  const db = getLawChangeDB();

  // Default to 2 years ago if no signing date
  const effectiveDate =
    signingDate || new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const clauseTypes = [...new Set(clauses.map((c) => c.clause_type))];

  try {
    // Step 1: Check for existing impacts in the database
    const { data: existingImpacts } = await db
      .from("law_change_impacts")
      .select("*, law_changes!inner(*)")
      .eq("document_id", documentId);

    // Step 2: Find law changes that could affect this contract
    const { data: matchingChanges, error: changesError } = await db
      .from("law_changes")
      .select("*")
      .gte("date_published", effectiveDate)
      .in("classification_confidence", ["high", "medium"])
      .in("status", ["classified", "impact_analyzed", "notifications_sent"])
      .overlaps("affected_clause_types", clauseTypes)
      .order("date_published", { ascending: false })
      .limit(20);

    if (changesError || !matchingChanges) {
      return createEmptyAnalysis(documentId, effectiveDate);
    }

    // Filter by jurisdiction
    const relevantChanges = matchingChanges.filter((change) => {
      const jurMatch =
        change.affected_jurisdictions?.includes("ALL-INDIA") ||
        change.affected_jurisdictions?.includes(jurisdiction);
      const docMatch =
        change.affected_document_types?.includes("all") ||
        change.affected_document_types?.includes(documentType);
      return jurMatch && docMatch;
    });

    if (relevantChanges.length === 0) {
      return createEmptyAnalysis(documentId, effectiveDate);
    }

    // Step 3: Build impacts from existing data + quick summaries
    const impacts: LawChangeImpact[] = [];

    for (const change of relevantChanges) {
      // Check if we already have an impact for this change + document
      const existing = existingImpacts?.find(
        (imp: any) => imp.law_change_id === change.id
      );

      if (existing) {
        impacts.push(existing as LawChangeImpact);
      } else {
        // Create a lightweight summary (no Groq call — keep it fast)
        const affectedClauses = clauses.filter((c) =>
          change.affected_clause_types?.includes(c.clause_type)
        );

        for (const clause of affectedClauses.slice(0, 3)) {
          impacts.push({
            id: `retro-${change.id}-${clause.clause_number}`,
            law_change_id: change.id,
            document_id: documentId,
            user_id: "",
            clause_id: null,
            clause_number: clause.clause_number,
            clause_type: clause.clause_type,
            impact_description: `${change.title} — This ${change.change_type} may affect your ${clause.clause_type} clause. ${change.summary}`,
            impact_severity: change.impact_type || "neutral_clarification",
            financial_impact: null,
            financial_description: null,
            action_required:
              "Review this law change and consult a legal professional if needed.",
            action_letter: null,
            new_legal_citation: change.title,
            old_legal_position: "",
            new_legal_position: change.summary,
            notified: false,
            notified_at: null,
            notification_channels: [],
            user_acknowledged: false,
            acknowledged_at: null,
            created_at: change.date_published,
          });
        }
      }
    }

    // Step 4: Aggregate
    const rightsGained = impacts.filter(
      (i) =>
        i.impact_severity === "rights_gained" ||
        i.impact_severity === "clause_voided" ||
        i.impact_severity === "protection_added"
    ).length;

    const rightsLost = impacts.filter(
      (i) =>
        i.impact_severity === "rights_lost" ||
        i.impact_severity === "obligation_added" ||
        i.impact_severity === "protection_removed"
    ).length;

    const totalFinancial = impacts.reduce(
      (sum, i) => sum + (i.financial_impact || 0),
      0
    );

    // Generate summary
    let summary = `Since ${formatDate(effectiveDate)}, `;
    if (impacts.length === 0) {
      summary += "no law changes have affected this contract.";
    } else {
      summary += `${relevantChanges.length} law change${
        relevantChanges.length !== 1 ? "s" : ""
      } ${relevantChanges.length !== 1 ? "have" : "has"} potentially affected this contract.`;
      if (rightsGained > 0)
        summary += ` ${rightsGained} in your favor.`;
      if (rightsLost > 0)
        summary += ` ${rightsLost} against your interests.`;
      if (totalFinancial > 0)
        summary += ` Potential financial impact: ₹${totalFinancial.toLocaleString("en-IN")}.`;
    }

    return {
      document_id: documentId,
      signing_date: effectiveDate,
      changes_since_signing: impacts,
      total_changes: relevantChanges.length,
      rights_gained: rightsGained,
      rights_lost: rightsLost,
      total_financial_impact: totalFinancial,
      summary,
    };
  } catch (error) {
    console.error("[RetroactiveAnalyzer] Error:", (error as Error).message);
    return createEmptyAnalysis(documentId, effectiveDate);
  }
}

function createEmptyAnalysis(
  documentId: string,
  signingDate: string
): RetroactiveAnalysis {
  return {
    document_id: documentId,
    signing_date: signingDate,
    changes_since_signing: [],
    total_changes: 0,
    rights_gained: 0,
    rights_lost: 0,
    total_financial_impact: 0,
    summary: "No law changes have affected this contract since signing.",
  };
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}
