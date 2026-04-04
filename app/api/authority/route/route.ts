// ============================================
// POST /api/authority/route — Jurisdiction Routing
// ============================================

import { NextResponse } from "next/server";
import { determineJurisdiction } from "@/lib/authority/jurisdiction-router";
import type { JurisdictionQuery } from "@/types/authority";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query: JurisdictionQuery = {
      document_type: body.document_type || "other",
      jurisdiction: body.jurisdiction || "general",
      claim_amount: body.claim_amount,
      counterparty_type: body.counterparty_type,
      clause_types: body.clause_types,
      entity_name: body.entity_name,
    };

    const result = await determineJurisdiction(query);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("[ClauseWall] Authority routing failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to determine jurisdiction" },
      { status: 500 },
    );
  }
}
