// ============================================
// GET /api/watchdog/companies
// List all monitored companies
// POST — seed companies (admin)
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getCompanies, seedCompanies } from "@/lib/watchdog/company-registry";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sector = searchParams.get("sector") || undefined;

    const companies = await getCompanies({
      sector: sector as import("@/types").CompanySector | undefined,
      is_active: true,
    });

    return NextResponse.json({ companies });
  } catch (error) {
    console.error("[Watchdog API] Companies GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === "seed") {
      const result = await seedCompanies();
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("[Watchdog API] Companies POST error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
