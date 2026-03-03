// ============================================
// MAIN ANALYSIS ORCHESTRATOR — HYBRID VERSION
// Uses DB-first approach with AI fallback
// ============================================

import { extractClauses } from "@/lib/ai/clause-extractor";
import { hybridAnalyzeClause } from "@/lib/core/hybrid-analyzer";
import { calculateWeightedScore, generateSummary, getRiskCounts } from "@/lib/core/scorer";
import { createClient } from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { ANALYSIS_CONFIG } from "@/lib/utils/constants";

/**
 * Analyze a complete document — HYBRID pipeline
 * 1. Extract clauses from text (AI)
 * 2. For each clause: DB-first analysis with AI fallback
 * 3. Calculate scores
 * 4. Save everything to database
 */
export async function analyzeDocument(
  documentId: string,
  rawText: string,
  documentType: string,
  jurisdiction: string,
  externalSupabase?: SupabaseClient
): Promise<void> {
  const supabase = externalSupabase || (await createClient());

  try {
    console.log(`[ClauseWall] analyzeDocument started for ${documentId}`);
    console.log(`[ClauseWall] Text length: ${rawText?.length || 0}`);
    console.log(`[ClauseWall] Document type: ${documentType}, Jurisdiction: ${jurisdiction}`);

    // ---- Update status to analyzing ----
    const { error: statusError } = await supabase
      .from("documents")
      .update({ analysis_status: "analyzing" })
      .eq("id", documentId);

    if (statusError) {
      console.error(`[ClauseWall] Failed to update status:`, statusError);
    }

    // ---- Step 1: Extract clauses ----
    console.log(`[ClauseWall] Extracting clauses from document ${documentId}`);
    const extraction = await extractClauses(rawText);
    console.log(`[ClauseWall] Extraction complete. Found ${extraction.clauses?.length || 0} clauses`);

    // Update document with detected entity name if found
    if (extraction.document_info.entity_name) {
      await supabase
        .from("documents")
        .update({ entity_name: extraction.document_info.entity_name })
        .eq("id", documentId);
    }

    // ---- Step 2: Hybrid analysis for each clause ----
    console.log(
      `[ClauseWall] [Hybrid] Analyzing ${extraction.clauses.length} clauses...`
    );

    const analyzedClauses: any[] = [];
    let dbMatchCount = 0;
    let aiFallbackCount = 0;

    for (const extractedClause of extraction.clauses) {
      console.log(
        `[ClauseWall] Clause ${extractedClause.clause_number}/${extraction.clauses.length}: ${extractedClause.clause_type}`
      );

      // Use HYBRID analysis instead of pure AI
      const analysis = await hybridAnalyzeClause(
        extractedClause.text,
        jurisdiction,
        documentType,
        extractedClause.clause_type
      );

      // Track verification sources
      if (analysis.verification_source === "database") {
        dbMatchCount++;
      } else {
        aiFallbackCount++;
      }

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
        percentile: null,
        // NEW hybrid fields
        verification_source: analysis.verification_source,
        matched_rule_id: analysis.matched_rule_id || null,
        negotiation_script: analysis.negotiation_script || null,
        penalty_info: analysis.penalty_info || null,
        confidence: analysis.confidence,
      });

      // Delay between requests to avoid rate limiting
      await new Promise((resolve) =>
        setTimeout(resolve, ANALYSIS_CONFIG.clauseDelayMs)
      );
    }

    console.log(
      `[ClauseWall] [Hybrid] Results: ${dbMatchCount} DB-verified, ${aiFallbackCount} AI-analyzed`
    );

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

    // ---- Step 5: Generate summary with verification info ----
    const verificationRate = analyzedClauses.length > 0
      ? Math.round((dbMatchCount / analyzedClauses.length) * 100)
      : 0;

    let summary = generateSummary(
      analyzedClauses.length,
      counts.safe,
      counts.warning,
      counts.dangerous,
      counts.illegal,
      overallScore
    );

    // Append verification info to summary
    summary += ` | Verification: ${dbMatchCount} of ${analyzedClauses.length} clauses (${verificationRate}%) verified against ClauseWall Legal Database.`;

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
      `[ClauseWall] ✅ Hybrid analysis complete for document ${documentId}. Score: ${overallScore}/100 | DB: ${dbMatchCount} | AI: ${aiFallbackCount}`
    );
  } catch (error) {
    console.error(
      `[ClauseWall] ❌ Analysis failed for document ${documentId}:`,
      error
    );

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