// ============================================
// MAIN ANALYSIS ORCHESTRATOR — HYBRID VERSION
// Uses DB-first approach with AI fallback
// WITH REAL-TIME PROGRESS TRACKING
// ============================================

import { extractClauses } from "@/lib/ai/clause-extractor";
import { hybridAnalyzeClause } from "@/lib/core/hybrid-analyzer";
import { calculateWeightedScore, generateSummary, getRiskCounts } from "@/lib/core/scorer";
import { createClient } from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { ANALYSIS_CONFIG } from "@/lib/utils/constants";
import { addToCommunityDB } from "@/lib/community";
import { extractEntityFallback, normalizeEntityName, isValidEntityName } from "@/lib/core/entity-extractor";

/**
 * Update analysis progress in database
 */
async function updateProgress(
  supabase: SupabaseClient,
  documentId: string,
  progress: number,
  step: string,
  clausesAnalyzed: number = 0
): Promise<void> {
  await supabase
    .from("documents")
    .update({
      analysis_progress: progress,
      analysis_step: step,
      clauses_analyzed: clausesAnalyzed,
    })
    .eq("id", documentId);
}

/**
 * Analyze a complete document — HYBRID pipeline with progress tracking
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

    // ---- Update status to analyzing ----
    await supabase
      .from("documents")
      .update({
        analysis_status: "analyzing",
        analysis_progress: 5,
        analysis_step: "Preparing document...",
        clauses_analyzed: 0,
      })
      .eq("id", documentId);

    // ---- Step 1: Extract clauses ----
    await updateProgress(supabase, documentId, 10, "Extracting clauses from document...");
    
    console.log(`[ClauseWall] Extracting clauses...`);
    const extraction = await extractClauses(rawText);
    console.log(`[ClauseWall] Found ${extraction.clauses?.length || 0} clauses`);

    const totalClauses = extraction.clauses.length;

        // ---- Entity Extraction: AI first, regex fallback ----
    let entityName = extraction.document_info.entity_name || null;

        if (!entityName) {
      console.log(
        `[ClauseWall] AI entity extraction missed. Running regex fallback...`
      );
      const fallbackEntity = extractEntityFallback(rawText, documentType);
      
      if (fallbackEntity) {
        // Validate the regex-extracted entity too
        if (isValidEntityName(fallbackEntity, rawText)) {
          entityName = fallbackEntity;
          console.log(
            `[ClauseWall] ✅ Regex fallback found valid entity: ${entityName}`
          );
        } else {
          console.log(
            `[ClauseWall] ⚠️ Regex fallback found "${fallbackEntity}" but rejected as invalid`
          );
        }
      } else {
        console.log(
          `[ClauseWall] ⚠️ No entity found by AI or regex fallback`
        );
      }
    }

    // Normalize entity name for consistent matching
    if (entityName) {
      entityName = normalizeEntityName(entityName);
      console.log(`[ClauseWall] Final entity (normalized): ${entityName}`);
    } else {
      console.log(`[ClauseWall] Final entity: none`);
    } 

            // Get AI-detected jurisdiction (may differ from user selection)
    const detectedJurisdiction = extraction.document_info.detected_jurisdiction || null;
    
    if (detectedJurisdiction && detectedJurisdiction !== jurisdiction) {
      console.log(
        `[ClauseWall] ⚠️ Jurisdiction mismatch: User selected "${jurisdiction}", AI detected "${detectedJurisdiction}"`
      );
    }

    // Get AI-detected document type (may differ from user selection)
    const detectedDocType = extraction.document_info.detected_type || null;
    
    if (detectedDocType && detectedDocType !== documentType && detectedDocType !== "other") {
      console.log(
        `[ClauseWall] ⚠️ Document type mismatch: User selected "${documentType}", AI detected "${detectedDocType}"`
      );
    }

    // Update document with detected entity name, jurisdiction, document type, and total clauses
    await supabase
      .from("documents")
      .update({
        entity_name: entityName,
        detected_jurisdiction: detectedJurisdiction,
        detected_document_type: detectedDocType,
        total_clauses: totalClauses,
        analysis_progress: 15,
        analysis_step: `Found ${totalClauses} clauses. Starting analysis...`,
      })
      .eq("id", documentId);

    // ---- Step 2: Hybrid analysis for each clause ----
    console.log(`[ClauseWall] [Hybrid] Analyzing ${totalClauses} clauses...`);

    const analyzedClauses: any[] = [];
    let dbMatchCount = 0;
    let aiFallbackCount = 0;

    for (let i = 0; i < extraction.clauses.length; i++) {
      const extractedClause = extraction.clauses[i];
      const clauseNum = i + 1;

      // Calculate progress: 15% (extraction) + 70% (analysis) = 85% when done
      const analysisProgress = 15 + Math.round((clauseNum / totalClauses) * 70);

      // Update progress for each clause
      await updateProgress(
        supabase,
        documentId,
        analysisProgress,
        `Analyzing clause ${clauseNum}/${totalClauses}: ${extractedClause.clause_type}`,
        clauseNum
      );

      console.log(`[ClauseWall] Clause ${clauseNum}/${totalClauses}: ${extractedClause.clause_type}`);

      // Use HYBRID analysis
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
    await updateProgress(supabase, documentId, 88, "Saving analysis results...", totalClauses);

    const { error: clauseError } = await supabase
      .from("clauses")
      .insert(analyzedClauses);

    if (clauseError) {
      throw new Error(`Failed to save clauses: ${clauseError.message}`);
    }

    // ---- Step 3.5: Add dangerous/illegal clauses to community DB ----
    await updateProgress(supabase, documentId, 90, "Updating community database...", totalClauses);
    
    console.log(`[ClauseWall] [Community] Sharing predatory patterns...`);
    let communityAdded = 0;
    for (const clause of analyzedClauses) {
      if (clause.risk_level === "dangerous" || clause.risk_level === "illegal") {
        const added = await addToCommunityDB({
          original_text: clause.original_text,
          clause_type: clause.clause_type,
          risk_level: clause.risk_level,
          document_type: documentType,
          jurisdiction: jurisdiction,
          legal_issue: clause.legal_issue,
          legal_citation: clause.legal_citation,
        });
        if (added) communityAdded++;
      }
    }
    console.log(`[ClauseWall] [Community] ${communityAdded} patterns shared`);

    // ---- Step 4: Calculate scores ----
    await updateProgress(supabase, documentId, 95, "Calculating final score...", totalClauses);

    const overallScore = calculateWeightedScore(analyzedClauses);
    const counts = getRiskCounts(analyzedClauses);

    // ---- Step 5: Generate summary ----
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
        analysis_progress: 100,
        analysis_step: "Analysis complete!",
        clauses_analyzed: analyzedClauses.length,
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
        analysis_progress: 0,
        analysis_step: "Analysis failed",
        summary: `Analysis failed: ${(error as Error).message}`,
      })
      .eq("id", documentId);

    throw error;
  }
}