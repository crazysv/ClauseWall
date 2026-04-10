// ============================================
// POST /api/collective/[collectiveId]/generate — Generate Legal Documents
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getCollective, generateCollectiveDocument } from "@/lib/collective";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ collectiveId: string }> },
) {
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

    const { collectiveId } = await params;

    // Verify membership
    const { data: membership } = await supabase
      .from("collective_memberships")
      .select("id")
      .eq("collective_id", collectiveId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "You must be a member to generate documents" },
        { status: 403 },
      );
    }

    const collective = await getCollective(collectiveId);
    if (!collective) {
      return NextResponse.json(
        { error: "Collective not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { actionType, additionalContext } = body;

    if (!actionType) {
      return NextResponse.json(
        { error: "Action type required" },
        { status: 400 },
      );
    }

    const document = await generateCollectiveDocument(
      collective,
      actionType,
      additionalContext,
    );

    return NextResponse.json({
      success: true,
      document: JSON.parse(document),
      raw: document,
    });
  } catch (error) {
    console.error("[ClauseWall] [API] Generate document error:", error);
    return NextResponse.json(
      { error: "Failed to generate document" },
      { status: 500 },
    );
  }
}
