// ============================================
// API: Generate QR Badge / Update Settings
// POST /api/verify/generate
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateShareId, getVerificationTier } from "@/lib/qr";
import type { ShareSettings } from "@/lib/qr";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentId, settings } = body as {
      documentId: string;
      settings: ShareSettings;
    };

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Validate settings
    const validSettings: ShareSettings = {
      show_entity: Boolean(settings?.show_entity),
      show_summary: Boolean(settings?.show_summary),
      allow_full_analysis: Boolean(settings?.allow_full_analysis),
    };

    const supabase = createAdminClient();

    // Fetch document
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("id, overall_risk_score, public_share_id, analysis_status")
      .eq("id", documentId)
      .single();

    if (docError || !doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    if (doc.analysis_status !== "completed") {
      return NextResponse.json(
        { error: "Analysis must be completed before generating badge" },
        { status: 400 }
      );
    }

    // Use existing share ID or generate new one
    let shareId = doc.public_share_id;

    if (!shareId) {
      shareId = generateShareId();

      // Ensure uniqueness with retries
      let attempts = 0;
      while (attempts < 5) {
        const { data: existing } = await supabase
          .from("documents")
          .select("id")
          .eq("public_share_id", shareId)
          .single();

        if (!existing) break;
        shareId = generateShareId();
        attempts++;
      }

      if (attempts >= 5) {
        return NextResponse.json(
          { error: "Failed to generate unique ID. Try again." },
          { status: 500 }
        );
      }
    }

    const tier = getVerificationTier(doc.overall_risk_score);

    // Update document with QR data
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        public_share_id: shareId,
        verification_tier: tier,
        qr_generated_at: new Date().toISOString(),
        share_settings: validSettings,
      })
      .eq("id", documentId);

    if (updateError) {
      console.error("QR generation update error:", updateError);
      return NextResponse.json(
        { error: "Failed to generate badge" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      shareId,
      tier,
      verifyUrl: `https://clause-wall.vercel.app/verify/${shareId}`,
    });
  } catch (error) {
    console.error("QR generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}