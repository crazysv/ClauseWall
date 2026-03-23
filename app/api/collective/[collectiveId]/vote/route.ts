// ============================================
// POST /api/collective/[collectiveId]/vote — Cast Vote
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { castVote } from "@/lib/collective";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ collectiveId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { actionId, vote } = body;

    if (!actionId || !vote) {
      return NextResponse.json(
        { error: "Action ID and vote required" },
        { status: 400 }
      );
    }

    if (!["yes", "no", "abstain"].includes(vote)) {
      return NextResponse.json(
        { error: "Vote must be 'yes', 'no', or 'abstain'" },
        { status: 400 }
      );
    }

    const result = await castVote(actionId, user.id, vote);

    if (!result) {
      return NextResponse.json(
        { error: "Failed to cast vote. Ensure you are a member." },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("[ClauseWall] [API] Vote error:", error);
    return NextResponse.json(
      { error: "Failed to cast vote" },
      { status: 500 }
    );
  }
}
