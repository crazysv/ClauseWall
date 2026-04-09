import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeDocument } from "@/lib/core/analyzer";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { documentId, newJurisdiction, newDocumentType } =
      await request.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "Missing documentId" },
        { status: 400 },
      );
    }

    if (!newJurisdiction && !newDocumentType) {
      return NextResponse.json(
        { error: "Missing newJurisdiction or newDocumentType" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch the document
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (fetchError || !document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    // 2. Enforce explicit ownership
    if (document.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this document" },
        { status: 403 }
      );
    }

    // Delete existing clauses
    const { error: deleteError } = await supabase
      .from("clauses")
      .delete()
      .eq("document_id", documentId);

    if (deleteError) {
      console.error("[ClauseWall] Failed to delete old clauses:", deleteError);
    }

    // Update document with new settings and reset status
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        jurisdiction: newJurisdiction || document.jurisdiction,
        document_type: newDocumentType || document.document_type,
        analysis_status: "analyzing",
        analysis_progress: 0,
        analysis_step: "Re-analyzing with correct settings...",
        overall_risk_score: 0,
        total_clauses: 0,
        safe_count: 0,
        warning_count: 0,
        dangerous_count: 0,
        illegal_count: 0,
        summary: null,
      })
      .eq("id", documentId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update document" },
        { status: 500 },
      );
    }

    console.log(
      `[ClauseWall] Re-analyzing document ${documentId} with jurisdiction: ${newJurisdiction}`,
    );

    // Run analysis (don't await — let it run in background)
    analyzeDocument(
      documentId,
      document.raw_text,
      newDocumentType || document.document_type,
      newJurisdiction || document.jurisdiction,
      supabase,
    ).catch((err) => {
      console.error("[ClauseWall] Re-analysis failed:", err);
    });

    return NextResponse.json({
      success: true,
      message: "Re-analysis started",
      documentId,
      newJurisdiction,
    });
  } catch (error) {
    console.error("[ClauseWall] Re-analyze API error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Re-analysis failed" },
      { status: 500 },
    );
  }
}
