import { NextRequest, NextResponse } from "next/server";
import { matchDocumentClauses } from "@/lib/core/legal-matcher";
import { createClient } from "@/lib/supabase/server";
import type { Clause } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { documentId, jurisdiction, documentType } = await request.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch clauses for this document
    const { data: clauses, error } = await supabase
      .from("clauses")
      .select("*")
      .eq("document_id", documentId)
      .order("clause_number", { ascending: true });

    if (error || !clauses) {
      return NextResponse.json(
        { error: "Failed to fetch clauses" },
        { status: 500 }
      );
    }

    // Run legal matching
    const matchResults = await matchDocumentClauses(
      clauses as Clause[],
      jurisdiction || "ALL-INDIA",
      documentType || "rental"
    );

    // Convert Map to serializable object
    const results: Record<string, any> = {};
    matchResults.forEach((value, key) => {
      results[key] = {
        ...value,
        matched_rules: value.matched_rules.map((rule) => ({
          id: rule.id,
          rule_title: rule.rule_title,
          statute_code: rule.statute_code,
          rule_description: rule.rule_description,
          what_makes_it_illegal: rule.what_makes_it_illegal,
          max_penalty: rule.max_penalty,
        })),
      };
    });

    // Count verification stats
    const totalClauses = clauses.length;
    const verifiedCount = Array.from(matchResults.values()).filter(
      (r) => r.confidence === "verified"
    ).length;
    const partialCount = Array.from(matchResults.values()).filter(
      (r) => r.confidence === "partial"
    ).length;
    const aiSuggestedCount = Array.from(matchResults.values()).filter(
      (r) => r.confidence === "ai_suggested"
    ).length;

    return NextResponse.json({
      results,
      stats: {
        total: totalClauses,
        verified: verifiedCount,
        partial: partialCount,
        ai_suggested: aiSuggestedCount,
        verification_rate: Math.round(
          ((verifiedCount + partialCount) / totalClauses) * 100
        ),
      },
    });
  } catch (error) {
    console.error("[ClauseWall] Verification error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}