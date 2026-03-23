// ============================================
// POST /api/collective/join — Join a Collective
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { joinCollective } from "@/lib/collective";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to join a collective" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { collectiveId, documentId, financialExposure, violationTypes } = body;

    if (!collectiveId) {
      return NextResponse.json(
        { error: "Collective ID required" },
        { status: 400 }
      );
    }

    const result = await joinCollective(
      collectiveId,
      user.id,
      documentId,
      financialExposure,
      violationTypes
    );

    if (!result) {
      return NextResponse.json(
        { error: "Failed to join collective" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      membership: result.membership,
      anonymous_id: result.anonymous_id,
    });
  } catch (error) {
    console.error("[ClauseWall] [API] Join collective error:", error);
    return NextResponse.json(
      { error: "Failed to join collective" },
      { status: 500 }
    );
  }
}
