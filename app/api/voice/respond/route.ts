import { NextRequest, NextResponse } from "next/server";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getHindiResponse } from "@/lib/ai/hindi-responder";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const rl = await rateLimit(request, "AI_HEAVY", user.id);
    if (!rl.success) return rateLimitResponse(rl);

    const body = await request.json();
    const { question, documentId, clauseId, language } = body;

    if (!question) {
      return NextResponse.json(
        { error: "question is required" },
        { status: 400 },
      );
    }

    let context: Record<string, any> = {};

    if (documentId) {
      

      const { data: doc } = await supabase
        .from("documents")
        .select(
          "document_type, jurisdiction, overall_risk_score, total_clauses, entity_name, summary",
        )
        .eq("id", documentId)
        .single();

      if (doc) {
        context.documentType = doc.document_type;
        context.jurisdiction = doc.jurisdiction;
        context.overallScore = doc.overall_risk_score;
        context.totalClauses = doc.total_clauses;
      }

      if (clauseId) {
        const { data: clause } = await supabase
          .from("clauses")
          .select("original_text, clause_type, risk_level, explanation")
          .eq("id", clauseId)
          .single();

        if (clause) {
          context.clauseText = clause.original_text;
          context.clauseType = clause.clause_type;
          context.riskLevel = clause.risk_level;
          context.explanation = clause.explanation;
        }
      }
    }

    const result = await getHindiResponse(question, context, language || "hi");

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[ClauseWall] [API] Voice respond failed:", error);
    return NextResponse.json(
      { error: "Failed to process voice query" },
      { status: 500 },
    );
  }
}
