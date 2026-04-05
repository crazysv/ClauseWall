import { NextResponse } from "next/server";

/**
 * GET /api/health
 * Shallow health check — confirms the app is running.
 * No auth required. Target: <100ms response.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}
