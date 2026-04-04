// ============================================
// POST /api/authority/legal-aid — Legal Aid Eligibility + Providers
// ============================================

import { NextResponse } from "next/server";
import { findLegalAidProviders } from "@/lib/authority/legal-aid-router";
import type { LegalAidQuery } from "@/types/authority";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query: LegalAidQuery = {
      annual_income: body.annual_income,
      category: body.category,
      state: body.state || "general",
      city: body.city,
      gender: body.gender,
      age: body.age,
      is_disabled: body.is_disabled,
    };

    const result = await findLegalAidProviders(query);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("[ClauseWall] Legal aid routing failed:", error);
    return NextResponse.json(
      { success: false, error: "Legal aid check failed" },
      { status: 500 },
    );
  }
}
