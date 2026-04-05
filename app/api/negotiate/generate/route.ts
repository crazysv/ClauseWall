import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateNegotiationPlaybook } from "@/lib/ai/negotiation-generator";
import { sanitizeLLMInput } from "@/lib/sanitize";
import { NegotiateGenerateSchema } from "@/lib/validation/schemas";
import { validateBody } from "@/lib/validation/middleware";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ── Schema Validation ──
    const parsed = validateBody(body, NegotiateGenerateSchema);
    if (!parsed.success) return parsed.response;
    const { documentId } = parsed.data;

    // Fetch document
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (docError || !doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    if (doc.analysis_status !== "completed") {
      return NextResponse.json(
        { error: "Analysis not complete. Please wait for analysis to finish." },
        { status: 400 },
      );
    }

    // Fetch clauses
    const { data: clauses, error: clauseError } = await supabase
      .from("clauses")
      .select("*")
      .eq("document_id", documentId)
      .order("clause_number", { ascending: true });

    if (clauseError || !clauses) {
      return NextResponse.json(
        { error: "Failed to fetch clauses" },
        { status: 500 },
      );
    }

    // Generate playbook
    const result = await generateNegotiationPlaybook(
      doc.document_type,
      doc.jurisdiction,
      doc.entity_name,
      clauses.map((c: any) => ({
        clause_number: c.clause_number,
        clause_type: c.clause_type,
        risk_level: c.risk_level,
        original_text: sanitizeLLMInput(c.original_text || "", 5000),
        explanation: sanitizeLLMInput(c.explanation || "", 2000),
        legal_citation: c.legal_citation,
        fair_alternative: c.fair_alternative ? sanitizeLLMInput(c.fair_alternative, 2000) : null,
        negotiation_script: c.negotiation_script ? sanitizeLLMInput(c.negotiation_script, 2000) : null,
      })),
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Generation failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      playbook: result.playbook,
    });
  } catch (error: any) {
    console.error("[Negotiate API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
