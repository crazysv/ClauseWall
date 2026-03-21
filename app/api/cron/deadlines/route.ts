// ============================================
// GET /api/cron/deadlines
// Daily cron job for sending deadline reminders
// Called by Vercel Cron at 2:30 AM UTC (8:00 AM IST)
// ============================================

import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Dynamic import to avoid cold start issues
    const { checkAndSendReminders } = await import(
      "@/lib/timebomb/reminder-service"
    );

    console.log("[TimeBomb Cron] Starting daily reminder check...");
    const result = await checkAndSendReminders();
    console.log("[TimeBomb Cron] Complete:", result);

    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[TimeBomb Cron] Error:", error);
    return NextResponse.json(
      {
        error: "Cron job failed",
        message: (error as Error).message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
