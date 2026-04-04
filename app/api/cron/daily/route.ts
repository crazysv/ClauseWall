// ============================================
// GET /api/cron/daily
// Consolidated daily cron: deadline reminders
// + law change notifications. Called by Vercel
// Cron at 2:30 AM UTC (8:00 AM IST).
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

    const results: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
    };

    // ─── Job 1: Deadline reminders (existing) ───
    try {
      const { checkAndSendReminders } =
        await import("@/lib/timebomb/reminder-service");
      console.log("[Daily Cron] Starting deadline reminder check...");
      const deadlineResult = await checkAndSendReminders();
      console.log("[Daily Cron] Deadline reminders:", deadlineResult);
      results.deadlines = deadlineResult;
    } catch (deadlineError) {
      console.error("[Daily Cron] Deadline reminders failed:", deadlineError);
      results.deadlines = {
        error: (deadlineError as Error).message,
        sent: 0,
        failed: 0,
        skipped: 0,
      };
    }

    // ─── Job 2: Law change notifications (new) ───
    try {
      const { sendLawChangeNotifications } =
        await import("@/lib/lawchange/notification-sender");
      console.log("[Daily Cron] Starting law change notifications...");
      const lawChangeResult = await sendLawChangeNotifications();
      console.log("[Daily Cron] Law change notifications:", lawChangeResult);
      results.law_changes = lawChangeResult;
    } catch (lawChangeError) {
      console.error(
        "[Daily Cron] Law change notifications failed:",
        lawChangeError,
      );
      results.law_changes = {
        error: (lawChangeError as Error).message,
        sent: 0,
        failed: 0,
      };
    }

    // ─── Job 3: Complaint hearing reminders ───
    try {
      const { getUpcomingHearings } =
        await import("@/lib/complaint/case-tracker");
      console.log("[Daily Cron] Starting complaint hearing reminder check...");
      const hearings = await getUpcomingHearings();
      console.log(
        `[Daily Cron] Found ${hearings.length} upcoming complaint hearings`,
      );
      results.complaint_hearings = { count: hearings.length };
    } catch (hearingError) {
      console.error(
        "[Daily Cron] Complaint hearing check failed:",
        hearingError,
      );
      results.complaint_hearings = {
        error: (hearingError as Error).message,
        count: 0,
      };
    }

    // ─── Job 4: Contract Watchdog — ToS scrape + analysis ───
    try {
      const { runWatchdogCron } = await import("@/lib/watchdog/cron-handler");
      console.log("[Daily Cron] Starting Contract Watchdog scan...");
      const watchdogResult = await runWatchdogCron(10);
      console.log("[Daily Cron] Watchdog result:", watchdogResult);
      results.watchdog = watchdogResult;
    } catch (watchdogError) {
      console.error("[Daily Cron] Watchdog scan failed:", watchdogError);
      results.watchdog = {
        error: (watchdogError as Error).message,
        companies_processed: 0,
        changes_detected: 0,
      };
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("[Daily Cron] Error:", error);
    return NextResponse.json(
      {
        error: "Cron job failed",
        message: (error as Error).message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
