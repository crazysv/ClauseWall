// ============================================
// GET /api/authority/search — Search Authorities
// ============================================

import { NextResponse } from "next/server";
import { searchAuthorities } from "@/lib/authority/authority-db";
import type { AuthoritySearchQuery } from "@/types/authority";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query: AuthoritySearchQuery = {
      search_text: searchParams.get("q") || undefined,
      authority_type: (searchParams.get("type") as any) || undefined,
      state: searchParams.get("state") || undefined,
      city: searchParams.get("city") || undefined,
      jurisdiction_level: (searchParams.get("level") as any) || undefined,
      has_e_filing: searchParams.get("e_filing") === "true" ? true : undefined,
      limit: parseInt(searchParams.get("limit") || "20"),
      offset: parseInt(searchParams.get("offset") || "0"),
    };

    const authorities = await searchAuthorities(query);
    return NextResponse.json({ success: true, authorities, count: authorities.length });
  } catch (error) {
    console.error("[ClauseWall] Authority search failed:", error);
    return NextResponse.json(
      { success: false, error: "Search failed" },
      { status: 500 }
    );
  }
}
