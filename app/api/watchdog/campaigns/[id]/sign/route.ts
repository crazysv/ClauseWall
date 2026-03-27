// ============================================
// POST /api/watchdog/campaigns/[id]/sign
// Sign a campaign
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signCampaign } from "@/lib/watchdog/campaign-manager";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { display_name, email } = body;

    if (!display_name) {
      return NextResponse.json({ error: "Display name required" }, { status: 400 });
    }

    const result = await signCampaign({
      campaign_id: id,
      user_id: user.id,
      display_name,
      email,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Watchdog API] Campaign sign error:", error);
    return NextResponse.json(
      { error: "Failed to sign campaign" },
      { status: 500 }
    );
  }
}
