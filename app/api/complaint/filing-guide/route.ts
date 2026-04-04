// GET /api/complaint/filing-guide?authorityType=consumer_forum_district

import { NextRequest, NextResponse } from "next/server";
import { getFilingGuide } from "@/lib/complaint";
import type { AuthorityType } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authorityType = searchParams.get("authorityType") as AuthorityType;

    if (!authorityType) {
      return NextResponse.json(
        { error: "Missing authorityType" },
        { status: 400 },
      );
    }

    const guide = getFilingGuide(authorityType);
    return NextResponse.json(guide);
  } catch (error) {
    console.error("[ClauseWall] Filing guide error:", error);
    return NextResponse.json(
      { error: "Failed to get filing guide" },
      { status: 500 },
    );
  }
}
