// ============================================
// COMMUNITY DATABASE — Insert & Query operations
// Now with SEMANTIC SEARCH via pgvector embeddings
// ============================================

import { createClient } from "@supabase/supabase-js";
import { anonymizeClauseText, isOverlyPersonal } from "./anonymizer";
import { generatePatternHash } from "./pattern-hasher";
import {
  generateEmbedding,
  formatEmbeddingForPgvector,
} from "./embedder";
import type { CommunityMatch } from "@/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ClauseForCommunity {
  original_text: string;
  clause_type: string;
  risk_level: string;
  document_type: string;
  jurisdiction: string;
  legal_issue?: string | null;
  legal_citation?: string | null;
}

/**
 * Add a dangerous/illegal clause to community database
 * NOW: Also generates and stores embedding vector
 */
export async function addToCommunityDB(
  clause: ClauseForCommunity
): Promise<boolean> {
  try {
    if (clause.risk_level !== "dangerous" && clause.risk_level !== "illegal") {
      return false;
    }

    const anonymizedText = anonymizeClauseText(clause.original_text);

    if (isOverlyPersonal(clause.original_text) || anonymizedText.length < 50) {
      return false;
    }

    const patternHash = generatePatternHash(anonymizedText, clause.clause_type);

    // Generate embedding (non-blocking — don't fail if HF is down)
    const embedding = await generateEmbedding(anonymizedText).catch(() => null);
    const embeddingValue = embedding
      ? formatEmbeddingForPgvector(embedding)
      : null;

    // Check if exact hash exists
    const { data: existing, error: selectError } = await supabase
      .from("community_clauses")
      .select("id, occurrence_count, embedding")
      .eq("pattern_hash", patternHash)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      console.error("[Community] Select error:", selectError);
      return false;
    }

    if (existing) {
      // Increment count + update embedding if missing
      const updateData: Record<string, unknown> = {
        occurrence_count: existing.occurrence_count + 1,
        last_seen_at: new Date().toISOString(),
      };

      // Backfill embedding if it was missing
      if (!existing.embedding && embeddingValue) {
        updateData.embedding = embeddingValue;
      }

      const { error: updateError } = await supabase
        .from("community_clauses")
        .update(updateData)
        .eq("id", existing.id);

      if (updateError) {
        console.error("[Community] Update error:", updateError);
        return false;
      }

      console.log(
        `[Community] Pattern ${patternHash} count: ${existing.occurrence_count + 1}` +
          (embeddingValue && !existing.embedding ? " (embedding backfilled)" : "")
      );
      return true;
    }

    // Insert new entry with embedding
    const { error: insertError } = await supabase
      .from("community_clauses")
      .insert({
        pattern_hash: patternHash,
        anonymized_text: anonymizedText,
        clause_type: clause.clause_type,
        risk_level: clause.risk_level,
        document_type: clause.document_type,
        jurisdiction: clause.jurisdiction,
        common_legal_issue: clause.legal_issue || null,
        common_statute: clause.legal_citation || null,
        occurrence_count: 1,
        flag_count: 0,
        embedding: embeddingValue,
      });

    if (insertError) {
      if (insertError.code === "23505") {
        await supabase.rpc("increment_community_occurrence", {
          p_hash: patternHash,
        });
        return true;
      }
      console.error("[Community] Insert error:", insertError);
      return false;
    }

    console.log(
      `[Community] New pattern: ${patternHash}` +
        (embeddingValue ? " (with embedding)" : " (no embedding)")
    );
    return true;
  } catch (error) {
    console.error("[Community] Error:", error);
    return false;
  }
}

/**
 * Check if a clause matches community patterns
 * NOW: Uses SEMANTIC SEARCH first, falls back to hash matching
 */
export async function checkCommunityMatch(
  clauseText: string,
  clauseType: string
): Promise<CommunityMatch | null> {
  try {
    const anonymizedText = anonymizeClauseText(clauseText);
    const patternHash = generatePatternHash(anonymizedText, clauseType);

    // ============================
    // STRATEGY 1: Exact hash match (fastest)
    // ============================
    const { data: exactMatch, error: exactError } = await supabase
      .from("community_clauses")
      .select("*")
      .eq("pattern_hash", patternHash)
      .single();

    if (exactMatch && !exactError) {
      const { data: jurisdictions } = await supabase
        .from("community_clauses")
        .select("jurisdiction")
        .eq("clause_type", clauseType)
        .eq("risk_level", exactMatch.risk_level);

      const uniqueJurisdictions = [
        ...new Set((jurisdictions || []).map((j) => j.jurisdiction)),
      ];

      return {
        found: true,
        pattern_hash: exactMatch.pattern_hash,
        occurrence_count: exactMatch.occurrence_count,
        jurisdictions_seen: uniqueJurisdictions,
        first_seen_at: exactMatch.first_seen_at || exactMatch.created_at,
        common_legal_issue: exactMatch.common_legal_issue,
        match_percentage: 100,
        match_type: "exact",
      };
    }

    // ============================
    // STRATEGY 2: Semantic search via embedding (NEW)
    // ============================
    const embedding = await generateEmbedding(anonymizedText).catch(() => null);

    if (embedding) {
      const embeddingStr = formatEmbeddingForPgvector(embedding);

      const { data: semanticMatches, error: semanticError } = await supabase
        .rpc("search_similar_clauses", {
          query_embedding: embeddingStr,
          similarity_threshold: 0.80,
          max_results: 5,
          filter_clause_type: null,
        });

      if (semanticMatches && semanticMatches.length > 0 && !semanticError) {
        const best = semanticMatches[0];
        const matchPercentage = Math.round(best.similarity * 100);

        // Get aggregate stats for richer insight
        const { data: stats } = await supabase.rpc(
          "get_similar_clause_stats",
          {
            query_embedding: embeddingStr,
            similarity_threshold: 0.80,
          }
        );

        const totalSimilar = stats?.[0]?.total_similar || 1;
        const illegalCount = stats?.[0]?.illegal_count || 0;
        const dangerousCount = stats?.[0]?.dangerous_count || 0;
        const allJurisdictions = stats?.[0]?.jurisdictions || [
          best.jurisdiction,
        ];

        // Calculate total occurrences across all similar patterns
        const totalOccurrences = semanticMatches.reduce(
          (sum: number, m: { occurrence_count: number }) =>
            sum + m.occurrence_count,
          0
        );

        return {
          found: true,
          pattern_hash: best.pattern_hash,
          occurrence_count: totalOccurrences,
          jurisdictions_seen: allJurisdictions,
          first_seen_at: best.first_seen_at,
          common_legal_issue: best.common_legal_issue,
          match_percentage: matchPercentage,
          match_type: "semantic",
          semantic_stats: {
            total_similar_patterns: totalSimilar,
            illegal_percentage: Math.round(
              (illegalCount / totalSimilar) * 100
            ),
            dangerous_percentage: Math.round(
              (dangerousCount / totalSimilar) * 100
            ),
          },
        };
      }
    }

    // ============================
    // STRATEGY 3: Fuzzy clause type match (fallback)
    // ============================
    const { data: similarMatches, error: similarError } = await supabase
      .from("community_clauses")
      .select("*")
      .eq("clause_type", clauseType)
      .gte("occurrence_count", 3)
      .order("occurrence_count", { ascending: false })
      .limit(1);

    if (similarMatches && similarMatches.length > 0 && !similarError) {
      const best = similarMatches[0];
      return {
        found: true,
        pattern_hash: best.pattern_hash,
        occurrence_count: best.occurrence_count,
        jurisdictions_seen: [best.jurisdiction],
        first_seen_at: best.first_seen_at || best.created_at,
        common_legal_issue: best.common_legal_issue,
        match_percentage: 60,
        match_type: "fuzzy",
      };
    }

    return null;
  } catch (error) {
    console.error("[Community] Match error:", error);
    return null;
  }
}

/**
 * Get overall community stats
 */
export async function getCommunityStats(jurisdiction?: string) {
  try {
    let query = supabase
      .from("community_clauses")
      .select("clause_type, occurrence_count, risk_level");

    if (jurisdiction) {
      query = query.eq("jurisdiction", jurisdiction);
    }

    const { data, error } = await query;

    if (error || !data) {
      return { total_patterns: 0, total_occurrences: 0, top_clause_types: [] };
    }

    const total_patterns = data.length;
    const total_occurrences = data.reduce(
      (sum, r) => sum + r.occurrence_count,
      0
    );

    const typeMap: Record<string, number> = {};
    for (const row of data) {
      typeMap[row.clause_type] =
        (typeMap[row.clause_type] || 0) + row.occurrence_count;
    }

    const top_clause_types = Object.entries(typeMap)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { total_patterns, total_occurrences, top_clause_types };
  } catch (error) {
    console.error("[Community] Stats error:", error);
    return { total_patterns: 0, total_occurrences: 0, top_clause_types: [] };
  }
}