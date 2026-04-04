// ============================================
// GET /api/collective/intelligence — Entity Intelligence Lookup
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getEntityIntelligence } from "@/lib/collective";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityName = searchParams.get("entity");
    const jurisdiction = searchParams.get("jurisdiction") || undefined;
    const documentType = searchParams.get("documentType") || undefined;

    if (!entityName) {
      return NextResponse.json(
        { error: "Entity name required" },
        { status: 400 },
      );
    }

    // Try to get authenticated user
    let userId: string | undefined;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id;
    } catch {
      // Anonymous access allowed
    }

    const intelligence = await getEntityIntelligence(
      entityName,
      userId,
      undefined,
      jurisdiction,
      documentType,
    );

    if (!intelligence) {
      return NextResponse.json({
        entity: null,
        collective: null,
        message: "No intelligence data found for this entity",
      });
    }

    return NextResponse.json(intelligence);
  } catch (error) {
    console.error("[ClauseWall] [API] Intelligence error:", error);
    return NextResponse.json(
      { error: "Failed to fetch entity intelligence" },
      { status: 500 },
    );
  }
}
