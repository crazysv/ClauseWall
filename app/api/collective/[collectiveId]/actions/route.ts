// ============================================
// GET/POST /api/collective/[collectiveId]/actions — List/Propose Actions
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { proposeAction } from "@/lib/collective";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ collectiveId: string }> }
) {
  try {
    const { collectiveId } = await params;
    const supabase = createAdminClient();

    const { data: actions, error } = await supabase
      .from("collective_actions")
      .select("*")
      .eq("collective_id", collectiveId)
      .order("proposed_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(actions || []);
  } catch (error) {
    console.error("[ClauseWall] [API] Get actions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch actions" },
      { status: 500 }
    );
  }
}

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

    const { collectiveId } = await params;
    const body = await request.json();
    const { actionType, title, description } = body;

    if (!actionType || !title) {
      return NextResponse.json(
        { error: "Action type and title required" },
        { status: 400 }
      );
    }

    const action = await proposeAction(
      collectiveId,
      user.id,
      actionType,
      title,
      description || ""
    );

    if (!action) {
      return NextResponse.json(
        { error: "Failed to propose action. Ensure you are a member." },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, action });
  } catch (error) {
    console.error("[ClauseWall] [API] Propose action error:", error);
    return NextResponse.json(
      { error: "Failed to propose action" },
      { status: 500 }
    );
  }
}
