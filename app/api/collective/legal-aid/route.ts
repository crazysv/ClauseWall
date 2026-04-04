// ============================================
// GET /api/collective/legal-aid — Legal Aid Matching
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { matchLegalAidOrganizations } from "@/lib/collective";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType") || "other";
    const jurisdiction = searchParams.get("jurisdiction") || "pan_india";
    const documentType = searchParams.get("documentType") || "other";

    const organizations = await matchLegalAidOrganizations(
      entityType,
      jurisdiction,
      documentType,
    );

    return NextResponse.json(organizations);
  } catch (error) {
    console.error("[ClauseWall] [API] Legal aid error:", error);
    return NextResponse.json(
      { error: "Failed to match legal aid organizations" },
      { status: 500 },
    );
  }
}
