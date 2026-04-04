import { NextRequest, NextResponse } from "next/server";
import { analyzeAdversarial } from "@/lib/ai/adversarial-analyzer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clauseText, clauseType, jurisdiction, documentType } = body;

    if (!clauseText || !clauseType) {
      return NextResponse.json(
        { error: "clauseText and clauseType are required" },
        { status: 400 },
      );
    }

    const result = await analyzeAdversarial(
      clauseText,
      clauseType,
      jurisdiction || "ALL-INDIA",
      documentType || "rental",
    );

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("[ClauseWall] [API] Adversarial analysis failed:", error);
    return NextResponse.json(
      { error: "Failed to analyze clause for deception" },
      { status: 500 },
    );
  }
}
