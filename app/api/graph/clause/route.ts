// ============================================
// GET graph context for a specific clause type + jurisdiction
// Used by clause cards to show "View Knowledge Map"
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getClauseContext } from "@/lib/graph";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clauseType = searchParams.get("clauseType");
    const jurisdiction = searchParams.get("jurisdiction");
    const documentType = searchParams.get("documentType") || undefined;

    if (!clauseType || !jurisdiction) {
      return NextResponse.json(
        { error: "clauseType and jurisdiction are required" },
        { status: 400 },
      );
    }

    const context = await getClauseContext(
      clauseType,
      jurisdiction,
      documentType,
    );

    return NextResponse.json({
      success: true,
      clauseType,
      jurisdiction,
      context,
    });
  } catch (error) {
    console.error("[ClauseWall] [API] Graph clause query failed:", error);
    return NextResponse.json(
      { error: "Failed to query knowledge graph" },
      { status: 500 },
    );
  }
}
