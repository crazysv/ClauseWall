// ============================================
// ONE-TIME WEBHOOK SETUP
// Visit: /api/bot/telegram/setup?action=set
// Check: /api/bot/telegram/setup?action=info
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { setWebhook, getWebhookInfo } from "@/lib/bot/telegram-client";

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get("action") || "info";

  try {
    if (action === "set") {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
      const webhookUrl = `${baseUrl}/api/bot/telegram`;

      const result = await setWebhook(webhookUrl);

      return NextResponse.json({
        success: true,
        action: "set",
        webhookUrl,
        telegramResponse: result,
      });
    }

    if (action === "info") {
      const result = await getWebhookInfo();
      return NextResponse.json({
        success: true,
        action: "info",
        telegramResponse: result,
      });
    }

    return NextResponse.json({
      error:
        "Use ?action=set to register webhook or ?action=info to check status",
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
