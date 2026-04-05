// ============================================
// BOT ANALYSIS TRIGGER
// Runs full analysis and sends follow-up message to user
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { analyzeDocument } from "@/lib/core/analyzer";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMessage } from "@/lib/bot/telegram-client";
import { rateLimit, rateLimitResponse, verifyInternalSecret } from "@/lib/rate-limit";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  console.log("[ClauseWall] Trigger analysis route called");

  try {
    // ── Internal Secret Verification ──
    if (!verifyInternalSecret(request)) {
      console.warn("[ClauseWall] Trigger analysis rejected: invalid secret");
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }

    // ── Rate Limiting ──
    const rl = await rateLimit(request, "AI_HEAVY");
    if (!rl.success) return rateLimitResponse(rl);

    const body = await request.json();
    console.log("[ClauseWall] Trigger body received:", {
      documentId: body.documentId,
      textLength: body.text?.length,
      documentType: body.documentType,
      jurisdiction: body.jurisdiction,
      chatId: body.chatId,
    });

    const { documentId, text, documentType, jurisdiction, chatId } = body;

    if (!documentId || !text) {
      console.error("[ClauseWall] Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    console.log("[ClauseWall] Creating admin client...");
    const supabase = createAdminClient();
    console.log("[ClauseWall] Admin client created");

    // Update status
    await supabase
      .from("documents")
      .update({ analysis_status: "analyzing" })
      .eq("id", documentId);

    console.log(
      "[ClauseWall] Status updated. Running analysis synchronously...",
    );

    // Run analysis SYNCHRONOUSLY
    try {
      await analyzeDocument(
        documentId,
        text,
        documentType,
        jurisdiction,
        supabase,
      );
      console.log(`[ClauseWall] ✅ Analysis complete for ${documentId}`);

      // Fetch the completed document for results
      const { data: doc } = await supabase
        .from("documents")
        .select("*")
        .eq("id", documentId)
        .single();

      // Send follow-up message to user if chatId provided
      if (chatId && doc) {
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || "https://clause-wall.vercel.app";
        const resultUrl = `${appUrl}/results/${documentId}`;

        const riskEmoji = getRiskEmoji(doc.overall_risk_score);
        const riskLabel = getRiskLabel(doc.overall_risk_score);

        const followUpMessage = `✅ <b>Full Analysis Complete!</b>

━━━━━━━━━━━━━━━━━━━━

📊 <b>Verified Risk Score: ${doc.overall_risk_score}/100</b> ${riskEmoji} ${riskLabel}

📋 <b>Breakdown:</b>
├ Total clauses: ${doc.total_clauses}
├ ✅ Safe: ${doc.safe_count}
├ ⚠️ Warning: ${doc.warning_count}
├ 🔴 Dangerous: ${doc.dangerous_count}
└ ⛔ Illegal: ${doc.illegal_count}

━━━━━━━━━━━━━━━━━━━━

🔗 <b>Full Report:</b>
${resultUrl}

✨ Includes: Negotiation scripts • Penalty info • Fair alternatives • Verified citations`;

        try {
          await sendMessage(chatId, followUpMessage);
          console.log(`[ClauseWall] Follow-up message sent to chat ${chatId}`);
        } catch (msgError) {
          console.error(
            `[ClauseWall] Failed to send follow-up message:`,
            msgError,
          );
        }
      }
    } catch (analysisError) {
      console.error(
        `[ClauseWall] ❌ Analysis failed for ${documentId}:`,
        analysisError,
      );

      await supabase
        .from("documents")
        .update({
          analysis_status: "failed",
          summary: `Analysis failed: ${(analysisError as Error).message}`,
        })
        .eq("id", documentId);

      // Notify user of failure if chatId provided
      if (chatId) {
        try {
          await sendMessage(
            chatId,
            `❌ <b>Analysis Failed</b>\n\nSorry, we couldn't complete the full analysis. Please try again or paste the contract text directly.`,
          );
        } catch (msgError) {
          console.error(`[ClauseWall] Failed to send error message:`, msgError);
        }
      }
    }

    return NextResponse.json({
      status: "completed",
      documentId,
    });
  } catch (error) {
    console.error("[ClauseWall] Trigger analysis error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}

// Helper functions
function getRiskEmoji(score: number): string {
  if (score >= 80) return "⛔";
  if (score >= 60) return "🔴";
  if (score >= 30) return "🟡";
  return "🟢";
}

function getRiskLabel(score: number): string {
  if (score >= 80) return "Critical Risk";
  if (score >= 60) return "High Risk";
  if (score >= 30) return "Medium Risk";
  return "Low Risk";
}
