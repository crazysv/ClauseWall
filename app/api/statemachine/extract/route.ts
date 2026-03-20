import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractAndAnalyzeStateMachine } from "@/lib/statemachine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, contractText, documentType, jurisdiction } = body;

    let rawText = contractText || "";
    let docType = documentType || "";
    let docJurisdiction = jurisdiction || "";
    let docId = documentId || "";
    let clauseData: Array<{ text: string; type: string; index: number }> = [];

    // If documentId provided, fetch from Supabase
    if (documentId) {
      const supabase = await createClient();

      const { data: doc, error: docError } = await supabase
        .from("documents")
        .select("raw_text, document_type, jurisdiction")
        .eq("id", documentId)
        .single();

      if (docError || !doc) {
        return NextResponse.json(
          { success: false, error: "Document not found" },
          { status: 404 }
        );
      }

      rawText = doc.raw_text;
      docType = doc.document_type;
      docJurisdiction = doc.jurisdiction;
      docId = documentId;

      // Fetch analyzed clauses for context
      const { data: clauses } = await supabase
        .from("clauses")
        .select("original_text, clause_type, clause_number")
        .eq("document_id", documentId)
        .order("clause_number", { ascending: true });

      if (clauses) {
        clauseData = clauses.map(
          (c: { original_text: string; clause_type: string; clause_number: number }) => ({
            text: c.original_text,
            type: c.clause_type,
            index: c.clause_number - 1,
          })
        );
      }
    }

    // Validate required fields
    if (!rawText || rawText.trim().length < 50) {
      return NextResponse.json(
        { success: false, error: "Contract text too short for analysis" },
        { status: 400 }
      );
    }

    if (!docType) {
      return NextResponse.json(
        { success: false, error: "Missing documentType" },
        { status: 400 }
      );
    }

    // Extract and analyze
    const report = await extractAndAnalyzeStateMachine(
      rawText,
      docType,
      docJurisdiction || "general",
      docId,
      clauseData.length > 0 ? clauseData : undefined
    );

    if (!report) {
      return NextResponse.json(
        { success: false, error: "State machine extraction failed. The contract may be too short or unstructured." },
        { status: 500 }
      );
    }

    // Store result if documentId was provided
    if (documentId) {
      const supabase = await createClient();
      await supabase
        .from("documents")
        .update({ state_machine_data: report })
        .eq("id", documentId);
    }

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("[ClauseWall] State machine extract API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to extract state machine. Please try again." },
      { status: 500 }
    );
  }
}
