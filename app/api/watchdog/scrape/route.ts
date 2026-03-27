// ============================================
// POST /api/watchdog/scrape
// Trigger scrape for one/all companies
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { runWatchdogCron } from "@/lib/watchdog/cron-handler";
import { seedCompanies } from "@/lib/watchdog/company-registry";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // Verify authorization (CRON_SECRET or admin)
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await request.json().catch(() => ({}));

    // Optionally seed companies first
    if (body.seed) {
      await seedCompanies();
    }

    const maxCompanies = body.max_companies || 10;
    const result = await runWatchdogCron(maxCompanies);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Watchdog API] Scrape error:", error);
    return NextResponse.json(
      { error: "Scrape failed", message: (error as Error).message },
      { status: 500 }
    );
  }
}
