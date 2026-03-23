// ============================================
// GET /api/collective/[collectiveId] — Collective Details
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getCollective } from "@/lib/collective";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ collectiveId: string }> }
) {
  try {
    const { collectiveId } = await params;

    if (!collectiveId) {
      return NextResponse.json(
        { error: "Collective ID required" },
        { status: 400 }
      );
    }

    const collective = await getCollective(collectiveId);

    if (!collective) {
      return NextResponse.json(
        { error: "Collective not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(collective);
  } catch (error) {
    console.error("[ClauseWall] [API] Get collective error:", error);
    return NextResponse.json(
      { error: "Failed to fetch collective" },
      { status: 500 }
    );
  }
}
