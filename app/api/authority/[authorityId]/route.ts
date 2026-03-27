// ============================================
// GET /api/authority/[authorityId] — Authority Detail
// ============================================

import { NextResponse } from "next/server";
import { getAuthorityById } from "@/lib/authority/authority-db";
import { generateConnectivityLinks } from "@/lib/authority/connectivity";
import { computeEscalationPath } from "@/lib/authority/escalation-engine";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ authorityId: string }> }
) {
  try {
    const { authorityId } = await params;
    const authority = await getAuthorityById(authorityId);

    if (!authority) {
      return NextResponse.json(
        { success: false, error: "Authority not found" },
        { status: 404 }
      );
    }

    const connectivity = generateConnectivityLinks(authority);

    return NextResponse.json({
      success: true,
      authority,
      connectivity,
    });
  } catch (error) {
    console.error("[ClauseWall] Authority detail failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch authority" },
      { status: 500 }
    );
  }
}
