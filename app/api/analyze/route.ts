import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { analyzeDocument } from "@/lib/core/analyzer";
import { parsePDF } from "@/lib/core/pdf-parser";
import { sanitizePlainTextBlock } from "@/lib/sanitize";
import { AnalyzeJsonSchema } from "@/lib/validation/schemas";
import { validateBody, validateFileSize } from "@/lib/validation/middleware";
import { FILE_SIZE_LIMITS } from "@/lib/validation/enums";
import { log } from "@/lib/logger";

// Allow longer execution time for analysis
export const maxDuration = 60;

export const POST = withApiHandler(
  {
    module: "analyze",
    rateLimit: "AI_HEAVY",
    rateLimitIdentifier: "user",
    auth: true,
    // No schema — this route accepts both FormData and JSON
  },
  async (ctx) => {
    const { request, supabase, user } = ctx;

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

      // Validate file size
      const sizeError = validateFileSize(file, FILE_SIZE_LIMITS.CONTRACT_PDF_TXT, "Contract file");
      if (sizeError) return sizeError;

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

      // Validate extracted text + required fields for file path
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
    } else {
      // ---- PASTED TEXT ----
      const body = await request.json();

      // ── Schema Validation ──
      const parsed = validateBody(body, AnalyzeJsonSchema);
      if (!parsed.success) return parsed.response;

      text = parsed.data.text;
      documentType = parsed.data.documentType;
      jurisdiction = parsed.data.jurisdiction;
      filename = parsed.data.filename;
    }

    // ---- SANITIZATION ----
    text = sanitizePlainTextBlock(text, 100_000);

    // ---- POST-SANITIZATION CHECK ----
    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        {
          error:
            "Document text is too short. Please provide a complete contract (minimum 50 characters).",
        },
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
        user_id: user!.id,
      })
      .select()
      .single();

    if (insertError || !document) {
      log.errorWithCause("api.analyze", "Failed to create document record", insertError);
      return NextResponse.json(
        { error: "Failed to save document. Please try again." },
        { status: 500 },
      );
    }

    log.info("api.analyze", "Document created", { docId: document.id });

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
        log.errorWithCause("api.analyze", "Trigger analysis failed", err);
      });
    } else {
      log.warn("api.analyze", "NEXT_PUBLIC_APP_URL not set, skipping trigger");
    }

    // Return immediately with document ID
    return NextResponse.json({
      documentId: document.id,
      status: "analyzing",
      message: "Analysis started. You will be redirected to results.",
    });
  },
);
