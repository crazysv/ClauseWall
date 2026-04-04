// ============================================
// API: Generate Fair Contract
// POST /api/builder/generate
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateContract } from "@/lib/builder/contract-generator";
import { ContractTemplateType } from "@/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const VALID_TYPES: ContractTemplateType[] = [
  "rental",
  "employment",
  "freelance",
  "nda",
  "loan",
  "partnership",
  "sale",
  "service",
  "mou",
  "poa",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { template_type, jurisdiction, values } = body;

    // Validate inputs
    if (!template_type || !jurisdiction || !values) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: template_type, jurisdiction, values",
        },
        { status: 400 },
      );
    }

    if (!VALID_TYPES.includes(template_type)) {
      return NextResponse.json(
        { success: false, error: `Invalid template type: ${template_type}` },
        { status: 400 },
      );
    }

    // Generate contract
    const result = await generateContract(template_type, jurisdiction, values);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    // Save to database
    const { data: saved, error: dbError } = await supabase
      .from("generated_contracts")
      .insert({
        template_type,
        jurisdiction,
        input_values: values,
        generated_text: result.formatted_text,
        generated_clauses: result.clauses,
        title: result.title,
        stamp_paper_note: result.stamp_paper_note,
        user_id: null, // TODO: Extract from auth if logged in
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("[ClauseWall Builder] DB save error:", dbError);
      // Still return the contract even if save fails
      return NextResponse.json({
        success: true,
        contract_id: null,
        title: result.title,
        generated_text: result.formatted_text,
        generated_clauses: result.clauses,
        stamp_paper_note: result.stamp_paper_note,
        warning: "Contract generated but could not be saved to history.",
      });
    }

    return NextResponse.json({
      success: true,
      contract_id: saved.id,
      title: result.title,
      generated_text: result.formatted_text,
      generated_clauses: result.clauses,
      stamp_paper_note: result.stamp_paper_note,
    });
  } catch (error: any) {
    console.error("[ClauseWall Builder] API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
