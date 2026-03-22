// ============================================
// GET /api/poisonpill/[documentId]
// Fetch or run poison pill analysis for a document
// ============================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const supabase = await createClient();
    const { documentId } = await params;

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Fetch document
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("id, poison_pill_data, analysis_status, document_type, jurisdiction, entity_name")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // If poison_pill_data already exists, return it
    if (document.poison_pill_data) {
      return NextResponse.json(document.poison_pill_data);
    }

    // Otherwise, run analysis on the spot
    if (document.analysis_status !== "completed") {
      return NextResponse.json(
        { error: "Document analysis must be completed first" },
        { status: 400 }
      );
    }

    // Fetch clauses
    const { data: clauses, error: clauseError } = await supabase
      .from("clauses")
      .select(
        "clause_number, original_text, clause_type, risk_level, risk_score, explanation, legal_citation, extracted_value, extracted_unit"
      )
      .eq("document_id", documentId)
      .order("clause_number", { ascending: true });

    if (clauseError || !clauses || clauses.length < 3) {
      return NextResponse.json({
        traps: [],
        graph: { nodes: [], edges: [], clusters: [] },
        combined_trap_score: 0,
        trap_density: 0,
        most_dangerous_trap: null,
        most_connected_clause: null,
        risk_amplification_summary: "Not enough clauses for interconnection analysis.",
        negotiation_roadmap: [],
      });
    }

    // Run poison pill analysis
    const { analyzePoisonPills } = await import("@/lib/poisonpill");
    const result = await analyzePoisonPills(
      clauses.map((c) => ({
        clause_number: c.clause_number,
        original_text: c.original_text,
        clause_type: c.clause_type,
        risk_level: c.risk_level,
        risk_score: c.risk_score,
        explanation: c.explanation || "",
        legal_citation: c.legal_citation || null,
        extracted_value: c.extracted_value || null,
        extracted_unit: c.extracted_unit || null,
      })),
      document.document_type || "other",
      document.jurisdiction || "india",
      document.entity_name || null
    );

    // Save result to document
    await supabase
      .from("documents")
      .update({ poison_pill_data: result })
      .eq("id", documentId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[PoisonPill API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
