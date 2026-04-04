// ============================================
// GET/POST /api/watchdog/campaigns
// Campaign management
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCampaigns, createCampaign } from "@/lib/watchdog/campaign-manager";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const companyId = searchParams.get("company_id") || undefined;

    const campaigns = await getCampaigns({ status, company_id: companyId });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("[Watchdog API] Campaigns GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const {
      company_id,
      change_id,
      title,
      description,
      legal_basis,
      company_email,
    } = body;

    if (!company_id || !change_id || !title || !description || !legal_basis) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const campaign = await createCampaign({
      company_id,
      change_id,
      title,
      description,
      legal_basis,
      created_by: user.id,
      company_email,
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Failed to create campaign" },
        { status: 500 },
      );
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("[Watchdog API] Campaigns POST error:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 },
    );
  }
}
