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
import { extractPowerBalance } from "@/lib/ai/power-extractor";
import { determineJurisdiction } from "@/lib/authority/jurisdiction-router";
import type { SupportedLanguage } from "@/types/bhasha";
import { detectLanguage, detectLanguageQuick } from "@/lib/bhasha/language-detector";
import { preprocessDocumentNumerals } from "@/lib/bhasha/numeral-converter";
import { log } from "@/lib/logger";

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
  externalSupabase?: SupabaseClient,
  sourceLanguage?: SupportedLanguage | "auto",
  outputLanguage?: SupportedLanguage
): Promise<void> {
  const supabase = externalSupabase || (await createClient());

  try {
    log.info("analyzer", "analyzeDocument started", { docId: documentId, textLength: rawText?.length || 0 });

    // ---- Language Detection ----
    let detectedLang: SupportedLanguage = "en";
    let langConfidence = 1.0;
    const isAutoDetect = !sourceLanguage || sourceLanguage === "auto";
    const effectiveSourceLang: SupportedLanguage = (sourceLanguage && sourceLanguage !== "auto")
      ? sourceLanguage : "en";
    const effectiveOutputLang: SupportedLanguage = outputLanguage || effectiveSourceLang;

    if (isAutoDetect && rawText) {
      // Quick synchronous detection first
      const quickDetect = detectLanguageQuick(rawText.substring(0, 2000));
      detectedLang = quickDetect.language;
      langConfidence = quickDetect.confidence;
      log.debug("analyzer", "Quick language detection", { docId: documentId, lang: detectedLang, confidence: langConfidence });

      // Full async detection if not English and not very confident
      if (detectedLang !== "en" || langConfidence < 0.9) {
        try {
          const fullDetect = await detectLanguage(rawText.substring(0, 3000));
          detectedLang = fullDetect.primary_language;
          langConfidence = fullDetect.confidence;
          log.debug("analyzer", "Full language detection", { docId: documentId, lang: detectedLang, confidence: langConfidence });
        } catch {
          log.warn("analyzer", "Full language detection failed, using quick result", { docId: documentId });
        }
      }
    } else if (sourceLanguage && sourceLanguage !== "auto") {
      detectedLang = sourceLanguage;
      langConfidence = 1.0;
    }

    const isMultilingual = detectedLang !== "en";
    const finalSourceLang: SupportedLanguage = isAutoDetect ? detectedLang : effectiveSourceLang;
    const finalOutputLang: SupportedLanguage = outputLanguage || (isMultilingual ? detectedLang : "en");

    log.info("analyzer", "Language resolved", { docId: documentId, source: finalSourceLang, output: finalOutputLang, multilingual: isMultilingual });

    // Pre-process numerals for non-English text
    const processedText = isMultilingual ? preprocessDocumentNumerals(rawText) : rawText;

    // ---- Update status to analyzing ----
    await supabase
      .from("documents")
      .update({
        analysis_status: "analyzing",
        analysis_progress: 5,
        analysis_step: isMultilingual
          ? `Detected ${detectedLang.toUpperCase()} document. Preparing analysis...`
          : "Preparing document...",
        clauses_analyzed: 0,
        source_language: finalSourceLang,
        detected_language: detectedLang,
        output_language: finalOutputLang,
        language_confidence: langConfidence,
        is_multilingual: isMultilingual,
      })
      .eq("id", documentId);

    // ---- Step 1: Extract clauses ----
    await updateProgress(supabase, documentId, 10, "Extracting clauses from document...");
    
    log.info("analyzer", "Extracting clauses", { docId: documentId });
    const extraction = await extractClauses(processedText, isMultilingual ? finalSourceLang : undefined);
    log.info("analyzer", "Clauses extracted", { docId: documentId, clauseCount: extraction.clauses?.length || 0 });

    const totalClauses = extraction.clauses.length;

        // ---- Entity Extraction: AI first, regex fallback ----
    let entityName = extraction.document_info.entity_name || null;

        if (!entityName) {
      log.info("analyzer", "AI entity extraction missed, running regex fallback", { docId: documentId });
      const fallbackEntity = extractEntityFallback(rawText, documentType);
      
      if (fallbackEntity) {
        if (isValidEntityName(fallbackEntity, rawText)) {
          entityName = fallbackEntity;
          log.info("analyzer", "Regex fallback found valid entity", { docId: documentId });
        } else {
          log.info("analyzer", "Regex fallback entity rejected as invalid", { docId: documentId });
        }
      } else {
        log.info("analyzer", "No entity found by AI or regex fallback", { docId: documentId });
      }
    }

    // Normalize entity name for consistent matching
    if (entityName) {
      entityName = normalizeEntityName(entityName);
      log.info("analyzer", "Final entity resolved", { docId: documentId, hasEntity: true });
    } else {
      log.info("analyzer", "Final entity resolved", { docId: documentId, hasEntity: false });
    } 

            // Get AI-detected jurisdiction (may differ from user selection)
    const detectedJurisdiction = extraction.document_info.detected_jurisdiction || null;
    
    if (detectedJurisdiction && detectedJurisdiction !== jurisdiction) {
      log.warn("analyzer", "Jurisdiction mismatch", { docId: documentId, selected: jurisdiction, detected: detectedJurisdiction });
    }

    // Get AI-detected document type (may differ from user selection)
    const detectedDocType = extraction.document_info.detected_type || null;
    
    if (detectedDocType && detectedDocType !== documentType && detectedDocType !== "other") {
      log.warn("analyzer", "Document type mismatch", { docId: documentId, selected: documentType, detected: detectedDocType });
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
    log.info("analyzer", "Starting hybrid clause analysis", { docId: documentId, totalClauses });

    const analyzedClausesCurrent: any[] = new Array(totalClauses);
    let dbMatchCount = 0;
    let aiFallbackCount = 0;
    let clausesCompleted = 0;

    // Helper for bounded concurrency (limit = 3)
    const concurrencyLimit = 3;
    let currentIndex = 0;

    const worker = async () => {
      while (currentIndex < extraction.clauses.length) {
        const i = currentIndex++;
        const extractedClause = extraction.clauses[i];
        const clauseNum = i + 1;

        try {
          log.debug("analyzer", "Analyzing clause", { docId: documentId, clauseNum, totalClauses, clauseType: extractedClause.clause_type });

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

          // ---- NEW: Check community match BEFORE adding ----
          let communityMatch = null;
          if (analysis.risk_level === "dangerous" || analysis.risk_level === "illegal") {
            const { checkCommunityMatch } = await import("@/lib/community");
            try {
              communityMatch = await checkCommunityMatch(
                extractedClause.text,
                extractedClause.clause_type
              );
          
              if (communityMatch) {
                log.info("analyzer", "Community match found", { docId: documentId, clauseNum, matchType: communityMatch.match_type, matchPct: communityMatch.match_percentage });
              }
            } catch (err) {
              log.errorWithCause("analyzer", "Community match check failed", err, { docId: documentId, clauseNum });
            }
          }

          analyzedClausesCurrent[i] = {
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
            extracted_value: analysis.extracted_value ?? null,
            extracted_unit: analysis.extracted_unit ?? null,
            community_match: communityMatch ? JSON.stringify(communityMatch) : null,
            proof_data: analysis.proof_tree ? JSON.stringify(analysis.proof_tree) : null,
          };
        } catch (error) {
          log.errorWithCause("analyzer", "Clause analysis failed, skipping", error, { docId: documentId, clauseNum });
          analyzedClausesCurrent[i] = null; // Mark as failed
        } finally {
          clausesCompleted++;
          const analysisProgress = 15 + Math.round((clausesCompleted / totalClauses) * 70);
          
          // Fire-and-forget the progress update so we don't hold up the array
          updateProgress(
            supabase,
            documentId,
            analysisProgress,
            `Analyzing clauses... (${clausesCompleted}/${totalClauses})`,
            clausesCompleted
          ).catch((e) => log.errorWithCause("analyzer", "Progress update failed", e, { docId: documentId }));

          // Delay between requests to avoid rate limiting
          await new Promise((resolve) =>
            setTimeout(resolve, ANALYSIS_CONFIG.clauseDelayMs)
          );
        }
      }
    };

    // Run 3 workers in parallel
    const workers = Array.from({ length: Math.min(concurrencyLimit, totalClauses) }, () => worker());
    await Promise.all(workers);

    // Filter out any failed clauses (nulls) to maintain a dense array that preserves original temporal reading order
    const analyzedClauses = analyzedClausesCurrent.filter(c => c !== null);

    log.info("analyzer", "Hybrid analysis complete", { docId: documentId, dbMatches: dbMatchCount, aiAnalyzed: aiFallbackCount });

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
    
    log.info("analyzer", "Sharing predatory patterns to community DB", { docId: documentId });
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
    log.info("analyzer", "Community patterns shared", { docId: documentId, communityAdded });

    // ---- Step 3.55: Enrich clauses with Knowledge Graph ----
    await updateProgress(supabase, documentId, 91, "Enriching with legal knowledge graph...", totalClauses);

    try {
      const { enrichDocumentClauses } = await import("@/lib/graph");
      const enrichedCount = await enrichDocumentClauses(documentId, jurisdiction);
      log.info("analyzer", "Graph enrichment complete", { docId: documentId, enrichedCount });
    } catch (graphError) {
      log.errorWithCause("analyzer", "Graph enrichment failed (non-fatal)", graphError, { docId: documentId });
      // Non-fatal — analysis continues without graph enrichment
    }
    
    // ---- Step 4: Calculate Core Statistics (Synchronous) ----
    const overallScore = calculateWeightedScore(analyzedClauses);
    const counts = getRiskCounts(analyzedClauses);
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

    // ---- Step 5: Non-Blocking Secondary Subsystems ----
    // Enrichment tasks run with bounded concurrency (max 3) to avoid
    // overwhelming LLM rate limits and causing Vercel function timeouts.
    const ENRICHMENT_CONCURRENCY = 3;
    await updateProgress(supabase, documentId, 92, "Running parallel AI enrichments...", totalClauses);

    let powerBalance = null;
    let temporalData = null;
    let poisonPillData = null;
    let lawChangesData = null;
    
    let proofHash: string | null = null;
    let proofCid: string | null = null;
    let proofTimestamp: string | null = null;
    let proofStatus: string | null = null;
    let tsaToken: string | null = null;
    let tsaSerial: string | null = null;

    const enrichmentTasks: Array<() => Promise<void>> = [
      // 1. Power Balance extraction
      async () => {
        try {
          log.info("analyzer", "Extracting power balance", { docId: documentId });
          powerBalance = await extractPowerBalance(
            analyzedClauses.map((c) => ({
              clause_number: c.clause_number,
              clause_type: c.clause_type,
              risk_level: c.risk_level,
              risk_score: c.risk_score,
              explanation: c.explanation,
            })),
            documentType,
            jurisdiction,
            entityName
          );
          log.info("analyzer", "Power balance extracted", { docId: documentId });
        } catch (e) {
          log.errorWithCause("analyzer", "Power balance extraction failed", e, { docId: documentId });
        }
      },

      // 2. Blockchain Proof generation
      async () => {
        try {
          const { generateAndPinProof } = await import("@/lib/proof");
          const proofResult = await generateAndPinProof(
            {
              document_type: documentType,
              jurisdiction,
              overall_risk_score: overallScore,
              total_clauses: analyzedClauses.length,
              safe_count: counts.safe,
              warning_count: counts.warning,
              dangerous_count: counts.dangerous,
              illegal_count: counts.illegal,
            },
            analyzedClauses.map((c: any) => ({
              clause_number: c.clause_number,
              clause_type: c.clause_type,
              risk_level: c.risk_level,
              risk_score: c.risk_score,
              verification_source: c.verification_source,
              legal_citation: c.legal_citation,
            })),
            verificationRate
          );

          if (proofResult.success) {
            proofHash = proofResult.proof_hash;
            proofCid = proofResult.cid;
            proofTimestamp = proofResult.timestamp;
            proofStatus = proofResult.cid ? "pinned" : proofResult.tsa_token ? "verified" : "hash_only";
            tsaToken = proofResult.tsa_token;
            tsaSerial = proofResult.tsa_serial;
          }
        } catch (e) {
          log.errorWithCause("analyzer", "Proof generation failed", e, { docId: documentId });
        }
      },

      // 3. State Machine extraction
      async () => {
        try {
          const { extractAndAnalyzeStateMachine } = await import("@/lib/statemachine");
          const stateMachineReport = await extractAndAnalyzeStateMachine(
            rawText,
            documentType,
            jurisdiction,
            documentId,
            analyzedClauses.map((c: any) => ({
              text: c.original_text,
              type: c.clause_type,
              index: c.clause_number - 1,
            }))
          );

          if (stateMachineReport) {
            await supabase
              .from("documents")
              .update({ state_machine_data: stateMachineReport })
              .eq("id", documentId);
          }
        } catch (e) {
          log.errorWithCause("analyzer", "State machine extraction failed", e, { docId: documentId });
        }
      },

      // 4. Temporal extraction
      async () => {
        try {
          const { extractTemporalObligations } = await import("@/lib/timebomb");
          temporalData = await extractTemporalObligations(
            rawText,
            documentType,
            jurisdiction,
            analyzedClauses.map((c: any) => ({
              clause_number: c.clause_number,
              original_text: c.original_text,
              clause_type: c.clause_type,
            }))
          );
        } catch (e) {
          log.errorWithCause("analyzer", "Temporal extraction failed", e, { docId: documentId });
        }
      },

      // 5. Poison Pill detection
      async () => {
        try {
          const { analyzePoisonPills } = await import("@/lib/poisonpill");
          poisonPillData = await analyzePoisonPills(
            analyzedClauses.map((c: any) => ({
              clause_number: c.clause_number,
              original_text: c.original_text,
              clause_type: c.clause_type,
              risk_level: c.risk_level,
              risk_score: c.risk_score,
              explanation: c.explanation,
              legal_citation: c.legal_citation || null,
              extracted_value: c.extracted_value || null,
              extracted_unit: c.extracted_unit || null,
            })),
            documentType,
            jurisdiction,
            entityName || null
          );
        } catch (e) {
          log.errorWithCause("analyzer", "Poison pill detection failed", e, { docId: documentId });
        }
      },

      // 6. Retroactive Law Change check
      async () => {
        try {
          const { analyzeRetroactiveImpact } = await import("@/lib/lawchange");
          lawChangesData = await analyzeRetroactiveImpact(
            documentId,
            null, // signing date dynamically unknown inside the concurrent block context, using null fallback
            documentType,
            jurisdiction,
            analyzedClauses.map((c: any) => ({
              clause_type: c.clause_type,
              clause_number: c.clause_number,
              original_text: c.original_text,
            }))
          );
        } catch (e) {
          log.errorWithCause("analyzer", "Retroactive law change check failed", e, { docId: documentId });
        }
      },

      // 7. Collective Intelligence trigger
      async () => {
        if (!entityName) return;
        try {
          const { getEntityIntelligence } = await import("@/lib/collective");
          await getEntityIntelligence(entityName, undefined, documentId, jurisdiction, documentType);
        } catch (e) {
          log.errorWithCause("analyzer", "Collective intelligence fetch failed", e, { docId: documentId });
        }
      },

      // 8. Authority Routing
      async () => {
        try {
          const clauseTypes = analyzedClauses.map((c: any) => c.clause_type).filter(Boolean);
          const routingResult = await determineJurisdiction({
            document_type: documentType || "other",
            jurisdiction: jurisdiction || "general",
            clause_types: clauseTypes,
            entity_name: entityName || undefined,
          });
          await supabase
            .from("documents")
            .update({ authority_routing: routingResult })
            .eq("id", documentId);
        } catch (e) {
          log.errorWithCause("analyzer", "Authority routing failed", e, { docId: documentId });
        }
      },
    ];

    // Execute enrichment tasks with bounded concurrency pool
    {
      let taskIndex = 0;
      const runNextTask = async (): Promise<void> => {
        while (taskIndex < enrichmentTasks.length) {
          const idx = taskIndex++;
          await enrichmentTasks[idx]();
        }
      };
      const poolSize = Math.min(ENRICHMENT_CONCURRENCY, enrichmentTasks.length);
      await Promise.allSettled(
        Array.from({ length: poolSize }, () => runNextTask()),
      );
    }

    // ---- Step 5.97: Market Intelligence Benchmark Update (fire-and-forget) ----
    try {
      const { incrementalBenchmarkUpdate } = await import("@/lib/market/aggregator");
      incrementalBenchmarkUpdate(documentId).catch((marketErr: any) => {
        log.errorWithCause("analyzer", "Market incremental update failed", marketErr, { docId: documentId });
      });
    } catch (e) {
      log.errorWithCause("analyzer", "Market import failed", e, { docId: documentId });
    }

    // ---- Step 6: Update document with final gathered results ----
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
        power_balance: powerBalance,
        proof_hash: proofHash,
        proof_cid: proofCid,
        proof_timestamp: proofTimestamp,
        proof_status: proofStatus,
        tsa_token: tsaToken,
        tsa_serial: tsaSerial,
        temporal_data: temporalData,
        poison_pill_data: poisonPillData,
        law_changes_data: lawChangesData,
      })
      .eq("id", documentId);

    if (updateError) {
      throw new Error(`Failed to update document: ${updateError.message}`);
    }

    log.info("analyzer", "Analysis complete", { docId: documentId, score: overallScore, dbMatches: dbMatchCount, aiAnalyzed: aiFallbackCount, totalClauses: analyzedClauses.length });
  } catch (error) {
    log.errorWithCause("analyzer", "Analysis failed", error, { docId: documentId });

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