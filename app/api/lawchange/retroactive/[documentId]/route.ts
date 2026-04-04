// ============================================
// GET /api/lawchange/retroactive/[documentId]
// Get retroactive law changes for a document
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  try {
    const { documentId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch document and verify ownership
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

    // Check if cached and fresh (< 7 days old)
    if (doc.law_changes_data) {
      const cached = doc.law_changes_data as any;
      if (cached._cached_at) {
        const cacheAge = Date.now() - new Date(cached._cached_at).getTime();
        if (cacheAge < 7 * 24 * 60 * 60 * 1000) {
          return NextResponse.json({ analysis: cached, cached: true });
        }
      }
    }

    // Fetch clauses
    const { data: clauses } = await supabase
      .from("clauses")
      .select("clause_type, clause_number, original_text")
      .eq("document_id", documentId);

    // Run retroactive analysis
    const { analyzeRetroactiveImpact } =
      await import("@/lib/lawchange/retroactive-analyzer");

    const signingDate =
      (doc.temporal_data as any)?.signing_date_detected || null;

    const analysis = await analyzeRetroactiveImpact(
      documentId,
      signingDate,
      doc.document_type,
      doc.jurisdiction,
      (clauses || []).map((c: any) => ({
        clause_type: c.clause_type,
        clause_number: c.clause_number,
        original_text: c.original_text,
      })),
    );

    // Cache result
    await supabase
      .from("documents")
      .update({
        law_changes_data: {
          ...analysis,
          _cached_at: new Date().toISOString(),
        },
      })
      .eq("id", documentId);

    return NextResponse.json({ analysis, cached: false });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
