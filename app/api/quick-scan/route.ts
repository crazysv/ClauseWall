// ============================================
// QUICK SCAN API — Instant red flag detection
// Returns in 3-5 seconds
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { quickAnalyze } from "@/lib/bot/quick-analyzer";
import { parsePDF } from "@/lib/core/pdf-parser";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    // ── Rate Limiting ──
    const rl = await rateLimit(request, "AI_MEDIUM");
    if (!rl.success) return rateLimitResponse(rl);

    const contentType = request.headers.get("content-type") || "";

    let text: string;
    let documentType: string;
    let jurisdiction: string;

    if (contentType.includes("multipart/form-data")) {
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

      if (file.type === "application/pdf") {
        const buffer = Buffer.from(await file.arrayBuffer());
        text = await parsePDF(buffer);
      } else {
        text = await file.text();
      }
    } else {
      const body = await request.json();
      text = body.text;
      documentType = body.documentType;
      jurisdiction = body.jurisdiction;
    }

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        { error: "Text too short. Minimum 50 characters required." },
        { status: 400 },
      );
    }

    const result = await quickAnalyze(text, documentType, jurisdiction);

    return NextResponse.json({
      ...result,
      raw_text: text, // Pass text back for full analysis
    });
  } catch (error) {
    console.error("[ClauseWall] Quick scan error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Quick scan failed" },
      { status: 500 },
    );
  }
}
