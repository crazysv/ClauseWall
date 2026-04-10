// ============================================
// API: Generate Fair Contract
// POST /api/builder/generate
// ============================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateContract } from "@/lib/builder/contract-generator";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { BuilderGenerateSchema, type BuilderGenerateInput } from "@/lib/validation/schemas";

export const POST = withApiHandler<BuilderGenerateInput>(
  {
    module: "builder-generate",
    rateLimit: "AI_HEAVY",
    auth: true,
    schema: BuilderGenerateSchema,
  },
  async (ctx) => {
    const supabase = await createClient();
    const user = ctx.user!;

    const { template_type, jurisdiction, values } = ctx.body;

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
        user_id: user.id,
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
  }
);
