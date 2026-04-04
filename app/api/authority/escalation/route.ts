// ============================================
// POST /api/authority/escalation — Compute Escalation Path
// ============================================

import { NextResponse } from "next/server";
import {
  computeEscalationPath,
  computeDeadlines,
} from "@/lib/authority/escalation-engine";
import type { DisputeCategory } from "@/types/authority";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dispute_category, document_type, start_date } = body;

    const path = computeEscalationPath(
      (dispute_category as DisputeCategory) || "consumer",
      document_type || "other",
      start_date,
    );

    const deadlines = start_date
      ? computeDeadlines(path.steps, path.current_step, start_date)
      : [];

    return NextResponse.json({ success: true, path, deadlines });
  } catch (error) {
    console.error("[ClauseWall] Escalation computation failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to compute escalation path" },
      { status: 500 },
    );
  }
}
