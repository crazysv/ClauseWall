// ============================================
// LAW CHANGE CLASSIFIER
// Uses Groq to classify scraped law changes:
// what clause types, jurisdictions, and
// document types they affect.
// ============================================

import Groq from "groq-sdk";
import type { LawChange, LawChangeClassification, ImpactSeverity } from "@/types";
import { getLawChangeDB } from "./db";

// Rotate through Groq API keys
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

const VALID_CLAUSE_TYPES = new Set([
  "security_deposit", "rent", "notice_period", "termination", "auto_renewal",
  "penalty", "late_payment", "interest_rate", "non_compete", "ip_assignment",
  "confidentiality", "indemnity", "liability", "arbitration", "governing_law",
  "maintenance", "subletting", "insurance", "loan", "emi", "prepayment",
  "data_privacy", "refund", "cancellation", "force_majeure", "stamp_duty",
  "registration", "brokerage", "painting_charges", "other",
]);

const VALID_IMPACT_TYPES = new Set([
  "rights_gained", "rights_lost", "obligation_added", "obligation_removed",
  "limit_changed", "clause_voided", "protection_added", "protection_removed",
  "neutral_clarification",
]);

const VALID_DOC_TYPES = new Set([
  "rental", "employment", "tos", "loan", "freelance", "sale", "partnership",
  "insurance", "all",
]);

const LAW_CHANGE_CLASSIFICATION_PROMPT = `You are an Indian legal change classifier. Given a law change (court judgment, amendment, circular, notification), determine:

1. Which CONTRACT CLAUSE TYPES does this change affect?
   Choose from: security_deposit, rent, notice_period, termination, auto_renewal, penalty, late_payment, interest_rate, non_compete, ip_assignment, confidentiality, indemnity, liability, arbitration, governing_law, maintenance, subletting, insurance, loan, emi, prepayment, data_privacy, refund, cancellation, force_majeure, stamp_duty, registration, brokerage, painting_charges, other

2. Which JURISDICTIONS does this affect?
   If Supreme Court: ALL-INDIA
   If High Court: that state's code (KA, MH, DL, TN, UP, GJ, RJ, WB, AP, TS, KL, etc.)
   If state notification: that state's code
   If central regulation: ALL-INDIA

3. Which DOCUMENT TYPES does this affect?
   Choose from: rental, employment, tos, loan, freelance, sale, partnership, insurance, all

4. What is the IMPACT TYPE?
   Choose: rights_gained, rights_lost, obligation_added, obligation_removed, limit_changed, clause_voided, protection_added, protection_removed, neutral_clarification

5. How CONFIDENT are you in this classification?
   high: clearly about contract law, specific clause types mentioned
   medium: related to contract law, some interpretation needed
   low: tangentially related, may or may not affect contracts

6. Brief REASONING for your classification (1-2 sentences)

Respond in JSON only: { "clause_types": [...], "jurisdictions": [...], "document_types": [...], "impact_type": "...", "confidence": "...", "reasoning": "..." }`;

/**
 * Classify a single law change using Groq AI.
 */
export async function classifyLawChange(
  change: LawChange
): Promise<LawChangeClassification> {
  const groq = getGroqClient();

  const userMessage = `Law change:
Title: ${change.title}
Type: ${change.change_type}
Source: ${change.source}
Date: ${change.date_published}
Court/Authority: ${change.court_name || change.act_name || "Unknown"}
Summary: ${change.summary}
Section: ${change.section_affected || "Not specified"}

Classify this change.`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: LAW_CHANGE_CLASSIFICATION_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.0,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from Groq");
    }

    const parsed = JSON.parse(content);

    // Validate and sanitize
    const clauseTypes = (parsed.clause_types || [])
      .filter((t: string) => VALID_CLAUSE_TYPES.has(t));
    const jurisdictions = (parsed.jurisdictions || [])
      .filter((j: string) => typeof j === "string" && j.length <= 20);
    const documentTypes = (parsed.document_types || [])
      .filter((d: string) => VALID_DOC_TYPES.has(d));
    const impactType = VALID_IMPACT_TYPES.has(parsed.impact_type)
      ? (parsed.impact_type as ImpactSeverity)
      : "neutral_clarification";
    const confidence = ["high", "medium", "low"].includes(parsed.confidence)
      ? (parsed.confidence as "high" | "medium" | "low")
      : "low";

    return {
      clause_types: clauseTypes.length > 0 ? clauseTypes : ["other"],
      jurisdictions: jurisdictions.length > 0 ? jurisdictions : ["ALL-INDIA"],
      document_types: documentTypes.length > 0 ? documentTypes : ["all"],
      impact_type: impactType,
      confidence,
      reasoning: parsed.reasoning || "No reasoning provided",
    };
  } catch (error) {
    console.error(
      `[Classifier] Failed to classify "${change.title}":`,
      (error as Error).message
    );

    // Return low-confidence fallback
    return {
      clause_types: ["other"],
      jurisdictions: ["ALL-INDIA"],
      document_types: ["all"],
      impact_type: "neutral_clarification",
      confidence: "low",
      reasoning: `Classification failed: ${(error as Error).message}`,
    };
  }
}

/**
 * Classify multiple law changes with rate limiting.
 */
export async function classifyMultipleChanges(
  changes: LawChange[]
): Promise<Map<string, LawChangeClassification>> {
  const results = new Map<string, LawChangeClassification>();

  for (const change of changes) {
    const classification = await classifyLawChange(change);
    results.set(change.id, classification);

    // Rate limiting: 500ms between calls
    await new Promise((r) => setTimeout(r, 500));
  }

  return results;
}

/**
 * Classify all unclassified (status = 'scraped') law changes,
 * update their classification data & status in the database.
 */
export async function classifyPendingChanges(): Promise<{
  classified: number;
  failed: number;
}> {
  const db = getLawChangeDB();
  let classified = 0;
  let failed = 0;

  try {
    const { data: unclassified, error } = await db
      .from("law_changes")
      .select("*")
      .eq("status", "scraped")
      .limit(20);

    if (error || !unclassified || unclassified.length === 0) {

      return { classified: 0, failed: 0 };
    }


    for (const change of unclassified) {
      try {
        const classification = await classifyLawChange(change as LawChange);

        await db
          .from("law_changes")
          .update({
            affected_clause_types: classification.clause_types,
            affected_jurisdictions: classification.jurisdictions,
            affected_document_types: classification.document_types,
            impact_type: classification.impact_type,
            classification_confidence: classification.confidence,
            status: "classified",
          })
          .eq("id", change.id);

        classified++;

        // Rate limiting
        await new Promise((r) => setTimeout(r, 500));
      } catch (classifyError) {
        console.error(
          `[Classifier]   ❌ "${change.title}":`,
          (classifyError as Error).message
        );
        failed++;
      }
    }
  } catch (error) {
    console.error("[Classifier] Batch classification failed:", error);
  }

  return { classified, failed };
}
