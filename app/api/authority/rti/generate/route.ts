// ============================================
// POST /api/authority/rti/generate — Generate RTI Application
// ============================================

import { NextResponse } from "next/server";
import { generateRTI } from "@/lib/authority/rti-generator";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      applicant_name,
      applicant_address,
      target_authority,
      target_address,
      dispute_context,
      specific_questions,
    } = body;

    if (!applicant_name || !dispute_context) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: applicant_name, dispute_context" },
        { status: 400 }
      );
    }

    const rti = await generateRTI(
      applicant_name,
      applicant_address || "",
      target_authority || "Concerned Authority",
      target_address || "",
      dispute_context,
      specific_questions
    );

    return NextResponse.json({ success: true, rti });
  } catch (error) {
    console.error("[ClauseWall] RTI generation failed:", error);
    return NextResponse.json(
      { success: false, error: "RTI generation failed" },
      { status: 500 }
    );
  }
}
