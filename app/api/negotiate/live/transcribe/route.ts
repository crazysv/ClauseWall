// ============================================
// POST /api/negotiate/live/transcribe
// Audio transcription + tactic detection endpoint
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/negotiate/whisper-client";
import { detectAllTactics } from "@/lib/negotiate/pressure-tactics";
import { quickFactCheck } from "@/lib/negotiate/bluff-checker";
import type { BluffAnalysis, DetectedTactic } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob | null;
    const language = (formData.get("language") as string) || "en";
    const jurisdiction =
      (formData.get("jurisdiction") as string) || "ALL-INDIA";
    const documentType = (formData.get("document_type") as string) || "rental";

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    // Check file size (max 25MB — Whisper API limit)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Audio file too large. Maximum 25MB." },
        { status: 400 },
      );
    }

    // Step 1: Transcribe audio
    const transcription = await transcribeAudio(audioFile, language);

    if (!transcription.text || transcription.text.trim().length === 0) {
      return NextResponse.json({
        transcription: "",
        detected_tactics: [],
        bluff_checks: [],
        timestamp: Date.now(),
      });
    }

    // Step 2: Detect pressure tactics
    const detected_tactics: DetectedTactic[] = detectAllTactics(
      transcription.text,
    );

    // Step 3: If false_legal_claim detected, quick fact check
    const bluff_checks: BluffAnalysis[] = [];
    for (const tactic of detected_tactics) {
      if (tactic.tactic_type === "false_legal_claim") {
        try {
          const bluff = await quickFactCheck(
            transcription.text,
            jurisdiction,
            documentType,
          );
          if (bluff) {
            bluff_checks.push(bluff);
          }
        } catch (error) {
          console.error("[ClauseWall] Quick fact check failed:", error);
        }
      }
    }

    return NextResponse.json({
      transcription: transcription.text,
      detected_tactics,
      bluff_checks,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("[ClauseWall] Transcribe API error:", error);
    return NextResponse.json(
      { error: "Transcription failed. Please try again." },
      { status: 500 },
    );
  }
}
