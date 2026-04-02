// ============================================
// LAW CHANGE IMPACT ANALYZER
// Matches law changes to affected contracts
// and generates impact analysis using Groq.
// ============================================

import Groq from "groq-sdk";
import type { LawChange, LawChangeImpact } from "@/types";
import { getLawChangeDB } from "./db";

function getGroqClient(): Groq {
  const keys = [
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
    process.env.GROQ_API_KEY,
  ].filter(Boolean) as string[];

  if (keys.length === 0) {
    throw new Error("No Groq API keys configured");
  }

  const key = keys[Math.floor(Math.random() * keys.length)];
  return new Groq({ apiKey: key });
}

interface AffectedDocument {
  document_id: string;
  user_id: string;
  document_type: string;
  jurisdiction: string;
  clauses: {
    clause_id: string;
    clause_number: number;
    clause_type: string;
    original_text: string;
    risk_level: string;
    legal_citation: string | null;
  }[];
}

const IMPACT_ANALYSIS_PROMPT = `You are an Indian contract impact analyst. A legal change has occurred. Analyze how it affects the specific contract clauses below.

Be SPECIFIC. If the change makes a clause unenforceable, say so clearly.
If the user is owed money, calculate the amount if possible.
If the user should send a legal notice, say so.

For EACH affected clause, provide:
1. impact_description: How this law change affects this clause (2-3 sentences, plain language)
2. impact_severity: rights_gained / rights_lost / obligation_added / obligation_removed / limit_changed / clause_voided / protection_added / protection_removed / neutral_clarification
3. financial_impact: number in INR if quantifiable, null if not
4. financial_description: Explanation of financial impact
5. action_required: What the user should do NOW (specific, actionable)
6. new_legal_citation: The new law/judgment citation reference
7. old_legal_position: What the law said before (1 sentence)
8. new_legal_position: What the law says now (1 sentence)

Respond in JSON only: { "impacts": [{ "clause_number": ..., "clause_type": "...", "impact_description": "...", "impact_severity": "...", "financial_impact": null, "financial_description": "...", "action_required": "...", "new_legal_citation": "...", "old_legal_position": "...", "new_legal_position": "..." }] }`;

/**
 * Find all contracts affected by a law change (pure SQL, no AI).
 */
async function findAffectedDocuments(
  change: LawChange
): Promise<AffectedDocument[]> {
  const db = getLawChangeDB();

  try {
    // Build the query
    const { data, error } = await db.rpc("get_affected_documents_for_law_change", {
      p_clause_types: change.affected_clause_types,
      p_jurisdictions: change.affected_jurisdictions,
      p_document_types: change.affected_document_types,
    });

    // If the RPC doesn't exist, fallback to direct query
    if (error || !data) {
      // Direct query fallback
      let query = db
        .from("clauses")
        .select(`
          id,
          clause_number,
          clause_type,
          original_text,
          risk_level,
          legal_citation,
          document_id,
          documents!inner (
            id,
            user_id,
            document_type,
            jurisdiction,
            analysis_status
          )
        `)
        .in("clause_type", change.affected_clause_types)
        .eq("documents.analysis_status", "completed")
        .limit(50);

      const { data: clauseData, error: clauseError } = await query;

      if (clauseError || !clauseData) {
        console.warn("[ImpactAnalyzer] Query failed:", clauseError?.message);
        return [];
      }

      // Group by document
      const docMap = new Map<string, AffectedDocument>();

      for (const row of clauseData as any[]) {
        const doc = row.documents;
        if (!doc) continue;

        // Filter by jurisdiction
        const jurisdictionMatch =
          change.affected_jurisdictions.includes("ALL-INDIA") ||
          change.affected_jurisdictions.includes(doc.jurisdiction);
        if (!jurisdictionMatch) continue;

        // Filter by document type
        const docTypeMatch =
          change.affected_document_types.includes("all") ||
          change.affected_document_types.includes(doc.document_type);
        if (!docTypeMatch) continue;

        if (!docMap.has(doc.id)) {
          docMap.set(doc.id, {
            document_id: doc.id,
            user_id: doc.user_id,
            document_type: doc.document_type,
            jurisdiction: doc.jurisdiction,
            clauses: [],
          });
        }

        docMap.get(doc.id)!.clauses.push({
          clause_id: row.id,
          clause_number: row.clause_number,
          clause_type: row.clause_type,
          original_text: row.original_text,
          risk_level: row.risk_level,
          legal_citation: row.legal_citation,
        });
      }

      return Array.from(docMap.values());
    }

    return data as AffectedDocument[];
  } catch (err) {
    console.error("[ImpactAnalyzer] Find affected docs failed:", err);
    return [];
  }
}

/**
 * Analyze impact of a law change on a specific document's clauses.
 */
async function analyzeDocumentImpact(
  change: LawChange,
  doc: AffectedDocument
): Promise<Partial<LawChangeImpact>[]> {
  const groq = getGroqClient();

  const clausesList = doc.clauses
    .map(
      (c) =>
        `Clause ${c.clause_number} [${c.clause_type}]: '${c.original_text.substring(0, 200)}' (Risk: ${c.risk_level}, Citation: ${c.legal_citation || "none"})`
    )
    .join("\n  ");

  const userMessage = `LAW CHANGE:
Title: ${change.title}
Summary: ${change.summary}
Court/Authority: ${change.court_name || change.act_name || "Unknown"}
Date: ${change.date_published}
Impact type: ${change.impact_type}

AFFECTED CONTRACT:
Document type: ${doc.document_type}
Jurisdiction: ${doc.jurisdiction}

Affected clauses:
  ${clausesList}

Analyze the impact on each clause.`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: IMPACT_ANALYSIS_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.1,
      max_tokens: 2048,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content);
    const impacts: Partial<LawChangeImpact>[] = [];

    for (const impact of parsed.impacts || []) {
      // Find the matching clause
      const matchedClause = doc.clauses.find(
        (c) =>
          c.clause_number === impact.clause_number ||
          c.clause_type === impact.clause_type
      );

      impacts.push({
        law_change_id: change.id,
        document_id: doc.document_id,
        user_id: doc.user_id,
        clause_id: matchedClause?.clause_id || null,
        clause_number: impact.clause_number || matchedClause?.clause_number,
        clause_type: impact.clause_type || matchedClause?.clause_type,
        impact_description: impact.impact_description || "",
        impact_severity: impact.impact_severity || "neutral_clarification",
        financial_impact: impact.financial_impact || null,
        financial_description: impact.financial_description || null,
        action_required: impact.action_required || "Review this clause with a legal professional",
        action_letter: null,
        new_legal_citation: impact.new_legal_citation || change.title,
        old_legal_position: impact.old_legal_position || "",
        new_legal_position: impact.new_legal_position || "",
        notified: false,
        notification_channels: [],
        user_acknowledged: false,
      });
    }

    return impacts;
  } catch (error) {
    console.error(
      `[ImpactAnalyzer] AI analysis failed for doc ${doc.document_id}:`,
      (error as Error).message
    );
    return [];
  }
}

/**
 * Analyze impact of a single law change on all affected contracts.
 */
export async function analyzeImpact(
  change: LawChange
): Promise<LawChangeImpact[]> {
  const db = getLawChangeDB();

  // Step 1: Find affected documents
  const affectedDocs = await findAffectedDocuments(change);

  if (affectedDocs.length === 0) {

    return [];
  }


  // Step 2: Analyze impact per document (max 5 per run)
  const docsToAnalyze = affectedDocs.slice(0, 5);
  const allImpacts: LawChangeImpact[] = [];

  for (const doc of docsToAnalyze) {
    try {
      const impacts = await analyzeDocumentImpact(change, doc);

      // Step 3: Store impacts
      for (const impact of impacts) {
        try {
          const { data, error } = await db
            .from("law_change_impacts")
            .insert(impact)
            .select("*")
            .single();

          if (error) {
            // Unique constraint = already analyzed
            if (error.code === "23505") {

            } else {
              console.warn(
                `[ImpactAnalyzer]   ⚠️ Insert failed:`,
                error.message
              );
            }
          } else if (data) {
            allImpacts.push(data as LawChangeImpact);
          }
        } catch (insertErr) {
          console.warn(
            `[ImpactAnalyzer]   Insert exception:`,
            (insertErr as Error).message
          );
        }
      }

      // Rate limiting between documents
      await new Promise((r) => setTimeout(r, 500));
    } catch (docError) {
      console.error(
        `[ImpactAnalyzer]   ❌ Doc ${doc.document_id} analysis failed:`,
        (docError as Error).message
      );
    }
  }

  return allImpacts;
}

/**
 * Analyze all pending (classified but not impact-analyzed) law changes.
 */
export async function analyzeAllPendingChanges(): Promise<{
  analyzed: number;
  impacts_created: number;
}> {
  const db = getLawChangeDB();
  let analyzed = 0;
  let impactsCreated = 0;

  try {
    const { data: pending, error } = await db
      .from("law_changes")
      .select("*")
      .eq("status", "classified")
      .in("classification_confidence", ["high", "medium"])
      .limit(10);

    if (error || !pending || pending.length === 0) {

      return { analyzed: 0, impacts_created: 0 };
    }


    for (const change of pending) {
      try {
        const impacts = await analyzeImpact(change as LawChange);
        impactsCreated += impacts.length;

        // Update status
        await db
          .from("law_changes")
          .update({ status: "impact_analyzed" })
          .eq("id", change.id);

        analyzed++;

      } catch (changeError) {
        console.error(
          `[ImpactAnalyzer]   ❌ "${change.title}":`,
          (changeError as Error).message
        );
      }
    }
  } catch (error) {
    console.error("[ImpactAnalyzer] Batch analysis failed:", error);
  }

  return { analyzed, impacts_created: impactsCreated };
}
