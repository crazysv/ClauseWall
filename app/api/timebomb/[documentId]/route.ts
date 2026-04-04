// ============================================
// GET /api/timebomb/[documentId]
// Fetch all deadlines for a document
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildTimelineEvents,
  getDeadlineStats,
  calculateDaysUntil,
  getUrgencyFromDays,
} from "@/lib/timebomb/date-calculator";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  try {
    const { documentId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch deadlines
    const { data: deadlines, error } = await supabase
      .from("contract_deadlines")
      .select("*")
      .eq("document_id", documentId)
      .eq("user_id", user.id)
      .order("deadline_date", { ascending: true });

    if (error) {
      console.error("[TimeBomb API] Fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch deadlines" },
        { status: 500 },
      );
    }

    if (!deadlines || deadlines.length === 0) {
      return NextResponse.json({
        deadlines: [],
        timeline: [],
        stats: getDeadlineStats([]),
        activated: false,
      });
    }

    // Recalculate urgency (may have changed since last check)
    const updates: Array<{ id: string; urgency: string; status: string }> = [];

    for (const d of deadlines) {
      if (d.status === "defused" || d.status === "action_taken") continue;

      const daysUntil = calculateDaysUntil(d.deadline_date);
      const newUrgency = getUrgencyFromDays(daysUntil);
      let newStatus = d.status;

      if (daysUntil < 0 && d.status !== "missed") {
        newStatus = "missed";
      } else if (daysUntil <= 7 && d.status !== "urgent") {
        newStatus = "urgent";
      } else if (daysUntil <= 30 && d.status === "upcoming") {
        newStatus = "warning";
      }

      if (newUrgency !== d.urgency || newStatus !== d.status) {
        d.urgency = newUrgency;
        d.status = newStatus;
        updates.push({ id: d.id, urgency: newUrgency, status: newStatus });
      }
    }

    // Batch update changed urgencies
    if (updates.length > 0) {
      for (const u of updates) {
        await supabase
          .from("contract_deadlines")
          .update({
            urgency: u.urgency,
            status: u.status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", u.id);
      }
    }

    const timeline = buildTimelineEvents(deadlines);
    const stats = getDeadlineStats(deadlines);

    return NextResponse.json({
      deadlines,
      timeline,
      stats,
      activated: true,
    });
  } catch (error) {
    console.error("[TimeBomb API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
