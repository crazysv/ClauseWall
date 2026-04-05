// ============================================
// POST /api/negotiate/live/camera-ocr
// Camera OCR endpoint — image → text → clause analysis
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { callGeminiVision } from "@/lib/bot/gemini-client";
import { processFrameForClauses } from "@/lib/negotiate/camera-processor";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const OCR_PROMPT = `Extract ALL visible text from this contract/document image. 
Return ONLY the raw text content, preserving the original structure, numbering, and formatting as closely as possible.
If there are numbered clauses or sections, keep those numbers.
If the text is in a mix of English and Hindi/other Indian languages, preserve both.
Do NOT add any commentary or analysis — just the raw text.
Return as JSON: { "extracted_text": "the full text here" }`;

export async function POST(request: NextRequest) {
  try {
    const rl = await rateLimit(request, "AI_MEDIUM");
    if (!rl.success) return rateLimitResponse(rl);

    const formData = await request.formData();
    const imageFile = formData.get("image") as Blob | null;
    const jurisdiction =
      (formData.get("jurisdiction") as string) || "ALL-INDIA";
    const documentType = (formData.get("document_type") as string) || "rental";

    if (!imageFile) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 },
      );
    }

    // Check file size (max 10MB)
    if (imageFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image too large. Maximum 10MB." },
        { status: 400 },
      );
    }

    // Convert image to base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = imageFile.type || "image/jpeg";

    // Step 1: Send to Gemini for OCR
    let extractedText = "";
    try {
      const ocrResponse = await callGeminiVision(OCR_PROMPT, base64, mimeType, {
        temperature: 0.1,
        maxTokens: 4096,
        retries: 2,
      });

      // Parse response
      try {
        const parsed = JSON.parse(ocrResponse);
        extractedText = parsed.extracted_text || ocrResponse;
      } catch {
        // If not valid JSON, use raw response
        extractedText = ocrResponse;
      }
    } catch (error: any) {
      console.error("[ClauseWall] Camera OCR failed:", error);
      return NextResponse.json(
        { error: "OCR failed. Try adjusting the angle or lighting." },
        { status: 500 },
      );
    }

    if (!extractedText || extractedText.trim().length < 20) {
      return NextResponse.json({
        extracted_text: "",
        clauses: [],
        timestamp: Date.now(),
        message:
          "No readable text detected. Try adjusting the angle or lighting.",
      });
    }

    // Step 2: Analyze extracted clauses
    const clauses = processFrameForClauses(
      extractedText,
      jurisdiction,
      documentType,
    );

    return NextResponse.json({
      extracted_text: extractedText,
      clauses,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("[ClauseWall] Camera OCR API error:", error);
    return NextResponse.json(
      { error: "Camera scan failed. Please try again." },
      { status: 500 },
    );
  }
}
