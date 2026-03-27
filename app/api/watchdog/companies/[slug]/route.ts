// ============================================
// GET /api/watchdog/companies/[slug]
// Company detail with history and changes
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getCompanyBySlug } from "@/lib/watchdog/company-registry";
import { getCompanyChanges, getSnapshotHistory } from "@/lib/watchdog/snapshot-manager";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const company = await getCompanyBySlug(slug);

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const [changes, snapshots] = await Promise.all([
      getCompanyChanges(company.id, 50),
      getSnapshotHistory(company.id),
    ]);

    return NextResponse.json({ company, changes, snapshots });
  } catch (error) {
    console.error("[Watchdog API] Company detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch company details" },
      { status: 500 }
    );
  }
}
