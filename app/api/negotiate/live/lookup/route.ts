// ============================================
// POST /api/negotiate/live/lookup
// Quick clause lookup endpoint
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { lookupClauseQuestion } from "@/lib/negotiate/quick-lookup";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, jurisdiction, document_type } = body;

    if (!query || !jurisdiction || !document_type) {
      return NextResponse.json(
        {
          error: "Missing required fields: query, jurisdiction, document_type",
        },
        { status: 400 },
      );
    }

    if (query.length > 500) {
      return NextResponse.json(
        { error: "Query too long. Maximum 500 characters." },
        { status: 400 },
      );
    }

    const result = await lookupClauseQuestion(
      query,
      jurisdiction,
      document_type,
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[ClauseWall] Lookup API error:", error);
    return NextResponse.json(
      { error: "Lookup failed. Please try again." },
      { status: 500 },
    );
  }
}
