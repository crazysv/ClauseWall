// ============================================
// GET /api/authority/fees — Filing Fee Calculator
// ============================================

import { NextResponse } from "next/server";
import { calculateFilingFee } from "@/lib/authority/fee-calculator";
import type { AuthorityType } from "@/types/authority";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authorityType = searchParams.get("authority_type") as AuthorityType;
    const claimAmount = parseInt(searchParams.get("claim_amount") || "0");

    if (!authorityType) {
      return NextResponse.json(
        { success: false, error: "authority_type is required" },
        { status: 400 },
      );
    }

    const result = calculateFilingFee(authorityType, claimAmount);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("[ClauseWall] Fee calculation failed:", error);
    return NextResponse.json(
      { success: false, error: "Fee calculation failed" },
      { status: 500 },
    );
  }
}
