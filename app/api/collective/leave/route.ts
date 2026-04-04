// ============================================
// POST /api/collective/leave — Leave a Collective
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { leaveCollective } from "@/lib/collective";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { collectiveId } = body;

    if (!collectiveId) {
      return NextResponse.json(
        { error: "Collective ID required" },
        { status: 400 },
      );
    }

    const success = await leaveCollective(collectiveId, user.id);

    return NextResponse.json({ success });
  } catch (error) {
    console.error("[ClauseWall] [API] Leave collective error:", error);
    return NextResponse.json(
      { error: "Failed to leave collective" },
      { status: 500 },
    );
  }
}
