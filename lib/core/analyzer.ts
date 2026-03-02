// ============================================
// MAIN ANALYSIS ORCHESTRATOR
// Coordinates the entire analysis pipeline
// ============================================

import { extractClauses } from "@/lib/ai/clause-extractor";
import { analyzeClause } from "@/lib/ai/clause-analyzer";
import { calculateWeightedScore, generateSummary, getRiskCounts } from "@/lib/core/scorer";
import { createClient } from "@/lib/supabase/server";
import { ANALYSIS_CONFIG } from "@/lib/utils/constants";
import type { Clause } from "@/types";

/**
 * Analyze a complete document — the main pipeline
 * 1. Extract clauses from text
 * 2. Analyze each clause individually
 * 3. Calculate scores
 * 4. Save everything to database
 */
export async function analyzeDocument(
  documentId: string,
  rawText: string,
  documentType: string,
  jurisdiction: string
): Promise<void> {
  const supabase = await createClient();

  try {
    // ---- Update status to analyzing ----
    await supabase
      .from("documents")
      .update({ analysis_status: "analyzing" })
      .eq("id", documentId);

    // ---- Step 1: Extract clauses ----
    console.log(`[ClauseWall] Extracting clauses from document ${documentId}`);
    const extraction = await extractClauses(rawText);

    // Update document with detected entity name if found
    if (extraction.document_info.entity_name) {
      await supabase
        .from("documents")
        .update({ entity_name: extraction.document_info.entity_name })
        .eq("id", documentId);
    }

    // ---- Step 2: Analyze each clause ----
    console.log(
      `[ClauseWall] Analyzing ${extraction.clauses.length} clauses...`
    );

    const analyzedClauses: Omit<Clause, "id" | "created_at">[] = [];

    for (const extractedClause of extraction.clauses) {
      console.log(
        `[ClauseWall] Analyzing clause ${extractedClause.clause_number}/${extraction.clauses.length}: ${extractedClause.clause_type}`
      );

      const analysis = await analyzeClause(
        extractedClause.text,
        jurisdiction,
        documentType,
        extractedClause.clause_type
      );

      analyzedClauses.push({
        document_id: documentId,
        clause_number: extractedClause.clause_number,
        original_text: extractedClause.text,
        clause_type: extractedClause.clause_type,
        risk_level: analysis.risk_level,
        risk_score: analysis.risk_score,
        explanation: analysis.explanation,
        legal_issue: analysis.legal_issue || null,
        legal_citation: analysis.applicable_law || null,
        statute_code: analysis.applicable_law || null,
        fair_alternative: analysis.fair_alternative || null,
        red_flags: analysis.red_flags,
        percentile: null, // Will be calculated later with comparison engine
      });

      // Delay between requests to avoid rate limiting
      await new Promise((resolve) =>
        setTimeout(resolve, ANALYSIS_CONFIG.clauseDelayMs)
      );
    }

    // ---- Step 3: Save clauses to database ----
    const { error: clauseError } = await supabase
      .from("clauses")
      .insert(analyzedClauses);

    if (clauseError) {
      throw new Error(`Failed to save clauses: ${clauseError.message}`);
    }

    // ---- Step 4: Calculate scores ----
    const overallScore = calculateWeightedScore(analyzedClauses);
    const counts = getRiskCounts(analyzedClauses);

    // ---- Step 5: Generate summary ----
    const summary = generateSummary(
      analyzedClauses.length,
      counts.safe,
      counts.warning,
      counts.dangerous,
      counts.illegal,
      overallScore
    );

    // ---- Step 6: Update document with results ----
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        overall_risk_score: overallScore,
        total_clauses: analyzedClauses.length,
        safe_count: counts.safe,
        warning_count: counts.warning,
        dangerous_count: counts.dangerous,
        illegal_count: counts.illegal,
        summary,
        analysis_status: "completed",
      })
      .eq("id", documentId);

    if (updateError) {
      throw new Error(`Failed to update document: ${updateError.message}`);
    }

    console.log(
      `[ClauseWall] ✅ Analysis complete for document ${documentId}. Score: ${overallScore}/100`
    );
  } catch (error) {
    console.error(
      `[ClauseWall] ❌ Analysis failed for document ${documentId}:`,
      error
    );

    // Update status to failed
    await supabase
      .from("documents")
      .update({
        analysis_status: "failed",
        summary: `Analysis failed: ${(error as Error).message}`,
      })
      .eq("id", documentId);

    throw error;
  }
}