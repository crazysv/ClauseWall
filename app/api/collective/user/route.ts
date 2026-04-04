// ============================================
// GET /api/collective/user — User's Collectives
// ============================================

import { NextResponse } from "next/server";
import { getUserCollectives } from "@/lib/collective";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
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

    const collectives = await getUserCollectives(user.id);

    return NextResponse.json(collectives);
  } catch (error) {
    console.error("[ClauseWall] [API] Get user collectives error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user collectives" },
      { status: 500 },
    );
  }
}
