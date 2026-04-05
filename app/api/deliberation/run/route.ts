// ============================================
// API: POST /api/deliberation/run
// Run full deliberation on a document or single clause
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DeliberationRunSchema } from "@/lib/validation/schemas";
import { validateBody } from "@/lib/validation/middleware";
import { deliberateClause, deliberateDocument } from "@/lib/deliberation";
import type {
  DeliberationResult,
  ClauseDeliberation,
} from "@/lib/deliberation";

/**
 * Summarize a proof tree for the Arbiter's context.
 * Extracts the verdict and main statute from proof_data if it exists.
 */
function summarizeProofTree(proofData: unknown): string | undefined {
  try {
    if (!proofData || typeof proofData !== "object") return undefined;

    const proof = proofData as Record<string, unknown>;
    const verdict = proof.verdict as string | undefined;
    const conclusion = proof.conclusion as Record<string, unknown> | undefined;
    const rulesApplied = proof.rulesApplied as string[] | undefined;

    if (!verdict) return undefined;

    const parts: string[] = [];

    if (verdict === "proven_illegal") {
      parts.push("Formally PROVEN ILLEGAL by neurosymbolic reasoning engine.");
    } else if (verdict === "proven_dangerous") {
      parts.push(
        "Formally PROVEN DANGEROUS by neurosymbolic reasoning engine.",
      );
    } else if (verdict === "proven_warning") {
      parts.push("Formal analysis found WARNING-level concerns.");
    } else if (verdict === "proven_safe") {
      parts.push("Formal analysis found this clause COMPLIANT.");
    } else {
      parts.push(`Formal analysis verdict: ${verdict}.`);
    }

    if (conclusion && typeof conclusion.label === "string") {
      parts.push(`Conclusion: ${conclusion.label}`);
    }

    if (rulesApplied && rulesApplied.length > 0) {
      parts.push(`Rules applied: ${rulesApplied.join(", ")}`);
    }

    return parts.join(" ");
  } catch {
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ── Schema Validation ──
    const parsed = validateBody(body, DeliberationRunSchema);
    if (!parsed.success) return parsed.response;
    const { documentId, clauseText, documentType, jurisdiction } = parsed.data;

    // ── MODE 1: Full document deliberation ──
    if (documentId) {
      const supabase = await createClient();

      // Fetch document
      const { data: doc, error: docError } = await supabase
        .from("documents")
        .select("raw_text, document_type, jurisdiction")
        .eq("id", documentId)
        .single();

      if (docError || !doc) {
        return NextResponse.json(
          { success: false, error: "Document not found" },
          { status: 404 },
        );
      }

      // Fetch analyzed clauses
      const { data: clauseRows } = await supabase
        .from("clauses")
        .select(
          "id, clause_number, original_text, clause_type, risk_level, explanation, proof_data",
        )
        .eq("document_id", documentId)
        .order("clause_number", { ascending: true });

      if (!clauseRows || clauseRows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "No analyzed clauses found for this document",
          },
          { status: 400 },
        );
      }

      // Build clause array for deliberation engine
      const clausesForDeliberation = clauseRows.map(
        (c: {
          id: string;
          clause_number: number;
          original_text: string;
          clause_type: string;
          risk_level: string;
          explanation: string;
          proof_data: unknown;
        }) => ({
          text: c.original_text,
          type: c.clause_type,
          index: c.clause_number,
          id: c.id,
          riskLevel: c.risk_level,
          explanation: c.explanation,
          proofTreeSummary: c.proof_data
            ? summarizeProofTree(
                typeof c.proof_data === "string"
                  ? JSON.parse(c.proof_data)
                  : c.proof_data,
              )
            : undefined,
        }),
      );

      // Run deliberation
      const result: DeliberationResult = await deliberateDocument(
        clausesForDeliberation,
        doc.document_type,
        doc.jurisdiction,
        documentId,
      );

      // Store result in documents table
      const supabase2 = await createClient();
      await supabase2
        .from("documents")
        .update({
          deliberation_data: result as unknown as Record<string, unknown>,
        })
        .eq("id", documentId);

      return NextResponse.json({ success: true, result });
    }

    // ── MODE 2: Single clause deliberation (inline) ──
    if (clauseText) {
      if (!documentType || !jurisdiction) {
        return NextResponse.json(
          {
            success: false,
            error: "documentType and jurisdiction are required",
          },
          { status: 400 },
        );
      }

      const deliberation: ClauseDeliberation = await deliberateClause(
        clauseText,
        undefined,
        documentType,
        jurisdiction,
      );

      return NextResponse.json({ success: true, deliberation });
    }

    return NextResponse.json(
      { success: false, error: "Either documentId or clauseText is required" },
      { status: 400 },
    );
  } catch (error) {
    console.error("[ClauseWall] [API] Deliberation run failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Deliberation failed. Please try again.",
      },
      { status: 500 },
    );
  }
}
