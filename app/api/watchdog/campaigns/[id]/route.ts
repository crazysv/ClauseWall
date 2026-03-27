// ============================================
// GET /api/watchdog/campaigns/[id]
// Campaign detail
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getCampaignById, getCampaignSignatories } from "@/lib/watchdog/campaign-manager";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [campaign, signatories] = await Promise.all([
      getCampaignById(id),
      getCampaignSignatories(id),
    ]);

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ campaign, signatories });
  } catch (error) {
    console.error("[Watchdog API] Campaign detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign details" },
      { status: 500 }
    );
  }
}
