// ============================================
// COMPARE API — Compares two contracts
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { compareContracts } from "@/lib/bot/compare-analyzer";
import { parsePDF } from "@/lib/core/pdf-parser";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let textA: string;
    let textB: string;
    let documentType: string;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const fileA = formData.get("fileA") as File | null;
      const fileB = formData.get("fileB") as File | null;
      const pastedA = formData.get("textA") as string | null;
      const pastedB = formData.get("textB") as string | null;
      documentType = (formData.get("documentType") as string) || "other";

      // Extract text from Contract A
      if (fileA && fileA.size > 0) {
        if (fileA.type === "application/pdf") {
          const buffer = Buffer.from(await fileA.arrayBuffer());
          textA = await parsePDF(buffer);
        } else {
          textA = await fileA.text();
        }
      } else if (pastedA) {
        textA = pastedA;
      } else {
        return NextResponse.json(
          { error: "Contract A is required" },
          { status: 400 }
        );
      }

      // Extract text from Contract B
      if (fileB && fileB.size > 0) {
        if (fileB.type === "application/pdf") {
          const buffer = Buffer.from(await fileB.arrayBuffer());
          textB = await parsePDF(buffer);
        } else {
          textB = await fileB.text();
        }
      } else if (pastedB) {
        textB = pastedB;
      } else {
        return NextResponse.json(
          { error: "Contract B is required" },
          { status: 400 }
        );
      }
    } else {
      const body = await request.json();
      textA = body.textA;
      textB = body.textB;
      documentType = body.documentType || "other";
    }

    // Validation
    if (!textA || textA.trim().length < 50) {
      return NextResponse.json(
        { error: "Contract A text is too short (minimum 50 characters)" },
        { status: 400 }
      );
    }

    if (!textB || textB.trim().length < 50) {
      return NextResponse.json(
        { error: "Contract B text is too short (minimum 50 characters)" },
        { status: 400 }
      );
    }

    // Compare
    const result = await compareContracts(textA, textB, documentType);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ClauseWall] Compare API error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Comparison failed" },
      { status: 500 }
    );
  }
}