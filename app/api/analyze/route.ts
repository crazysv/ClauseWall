import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeDocument } from "@/lib/core/analyzer";
import { parsePDF } from "@/lib/core/pdf-parser";
import { sanitizePlainTextBlock } from "@/lib/sanitize";

// Allow longer execution time for analysis
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to analyze documents" },
        { status: 401 },
      );
    }

    let text: string;
    let documentType: string;
    let jurisdiction: string;
    let filename: string;

    // Check if it's FormData (file upload) or JSON (pasted text)
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // ---- FILE UPLOAD ----
      const formData = await request.formData();
      const file = formData.get("file") as File;
      documentType = formData.get("documentType") as string;
      jurisdiction = formData.get("jurisdiction") as string;

      if (!file) {
        return NextResponse.json(
          { error: "No file provided" },
          { status: 400 },
        );
      }

      filename = file.name;

      // Extract text based on file type
      if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        text = await parsePDF(buffer);
      } else if (file.type === "text/plain") {
        text = await file.text();
      } else {
        return NextResponse.json(
          { error: "Unsupported file type. Please upload PDF or TXT." },
          { status: 400 },
        );
      }
    } else {
      // ---- PASTED TEXT ----
      const body = await request.json();
      text = body.text;
      documentType = body.documentType;
      jurisdiction = body.jurisdiction;
      filename = body.filename || "pasted-text.txt";
    }

    // ---- SANITIZATION ----
    text = sanitizePlainTextBlock(text, 100_000);

    // ---- VALIDATION ----
    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        {
          error:
            "Document text is too short. Please provide a complete contract (minimum 50 characters).",
        },
        { status: 400 },
      );
    }

    if (!documentType) {
      return NextResponse.json(
        { error: "Please select a document type" },
        { status: 400 },
      );
    }

    if (!jurisdiction) {
      return NextResponse.json(
        { error: "Please select your state" },
        { status: 400 },
      );
    }

    // ---- CREATE DOCUMENT RECORD ----
    const { data: document, error: insertError } = await supabase
      .from("documents")
      .insert({
        original_filename: filename,
        document_type: documentType,
        jurisdiction: jurisdiction,
        raw_text: text,
        analysis_status: "pending",
        user_id: user.id,
      })
      .select()
      .single();

    if (insertError || !document) {
      console.error("[ClauseWall] Failed to create document:", insertError);
      return NextResponse.json(
        { error: "Failed to save document. Please try again." },
        { status: 500 },
      );
    }

    console.log(`[ClauseWall] Document created: ${document.id}`);

    // ---- TRIGGER FULL ANALYSIS (server-side, fire-and-forget) ----
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl) {
      fetch(`${appUrl}/api/bot/trigger-analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.INTERNAL_API_SECRET
            ? { "x-internal-secret": process.env.INTERNAL_API_SECRET }
            : {}),
        },
        body: JSON.stringify({
          documentId: document.id,
          text,
          documentType,
          jurisdiction,
        }),
      }).catch((err) => {
        console.error("[ClauseWall] Trigger analysis failed:", err);
      });
    } else {
      console.warn("[ClauseWall] NEXT_PUBLIC_APP_URL not set, skipping trigger");
    }

    // Return immediately with document ID
    return NextResponse.json({
      documentId: document.id,
      status: "analyzing",
      message: "Analysis started. You will be redirected to results.",
    });
  } catch (error) {
    console.error("[ClauseWall] API error:", error);
    return NextResponse.json(
      {
        error:
          (error as Error).message ||
          "An unexpected error occurred. Please try again.",
      },
      { status: 500 },
    );
  }
}
