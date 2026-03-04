import { NextRequest, NextResponse } from "next/server";
import { checkCommunityMatch } from "@/lib/community/community-db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clauseText, clauseType } = body;

    if (!clauseText || !clauseType) {
      return NextResponse.json(
        { error: "Missing clauseText or clauseType" },
        { status: 400 }
      );
    }

    const match = await checkCommunityMatch(clauseText, clauseType);

    return NextResponse.json({
      success: true,
      match: match || null,
    });
  } catch (error) {
    console.error("[Community API] Check error:", error);
    return NextResponse.json(
      { error: "Failed to check community database" },
      { status: 500 }
    );
  }
}