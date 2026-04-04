// ============================================
// GET court cases for a clause type + jurisdiction
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getCourtCasesForClause, getAuthoritiesForClause } from "@/lib/graph";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clauseType = searchParams.get("clauseType");
    const jurisdiction = searchParams.get("jurisdiction") || "ALL-INDIA";

    if (!clauseType) {
      return NextResponse.json(
        { error: "clauseType is required" },
        { status: 400 },
      );
    }

    const [cases, authorities] = await Promise.all([
      getCourtCasesForClause(clauseType, jurisdiction),
      getAuthoritiesForClause(clauseType, jurisdiction),
    ]);

    // Calculate win rate
    const consumerWinOutcomes = [
      "tenant_won",
      "employee_won",
      "consumer_won",
      "borrower_won",
    ];
    const totalCases = cases.length;
    const wins = cases.filter((c) =>
      consumerWinOutcomes.includes(c.outcome || ""),
    ).length;
    const winRate =
      totalCases > 0 ? Math.round((wins / totalCases) * 100) : null;

    return NextResponse.json({
      success: true,
      clauseType,
      jurisdiction,
      cases: cases.map((c) => ({
        id: c.id,
        case_name: c.case_name,
        citation: c.citation,
        year: c.year,
        court: c.court,
        outcome: c.outcome,
        key_ruling: c.key_ruling,
        is_landmark: c.is_landmark,
        laws_cited: c.laws_cited,
      })),
      authorities: authorities.map((a) => ({
        id: a.id,
        name: a.authority_name,
        type: a.authority_type,
        jurisdiction: a.jurisdiction,
        how_to_file: a.how_to_file,
        filing_fee: a.filing_fee,
        timeline: a.typical_timeline,
        website: a.website,
        phone: a.phone,
      })),
      stats: {
        total_cases: totalCases,
        win_rate: winRate,
        landmark_cases: cases.filter((c) => c.is_landmark).length,
        total_authorities: authorities.length,
      },
    });
  } catch (error) {
    console.error("[ClauseWall] [API] Graph cases failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch cases and authorities" },
      { status: 500 },
    );
  }
}
