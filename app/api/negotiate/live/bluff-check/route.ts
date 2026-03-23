// ============================================
// POST /api/negotiate/live/bluff-check
// Bluff fact-checking endpoint
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { checkBluff } from "@/lib/negotiate/bluff-checker";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { claim_text, jurisdiction, document_type } = body;

    if (!claim_text || !jurisdiction || !document_type) {
      return NextResponse.json(
        { error: "Missing required fields: claim_text, jurisdiction, document_type" },
        { status: 400 }
      );
    }

    if (claim_text.length > 1000) {
      return NextResponse.json(
        { error: "Claim text too long. Maximum 1000 characters." },
        { status: 400 }
      );
    }

    const result = await checkBluff(claim_text, jurisdiction, document_type);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[ClauseWall] Bluff check API error:", error);
    return NextResponse.json(
      { error: "Bluff check failed. Please try again." },
      { status: 500 }
    );
  }
}
