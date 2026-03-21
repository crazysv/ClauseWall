// ============================================
// POST /api/timebomb/activate
// Activates the Time Bomb Defuser for a document
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  calculateAbsoluteDates,
  buildTimelineEvents,
  getDeadlineStats,
} from "@/lib/timebomb/date-calculator";
import { extractTemporalObligations } from "@/lib/timebomb/temporal-extractor";
import type { TemporalExtractionResult } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { document_id, signing_date, timezone } = body as {
      document_id: string;
      signing_date: string;
      timezone?: string;
    };

    if (!document_id || !signing_date) {
      return NextResponse.json(
        { error: "document_id and signing_date are required" },
        { status: 400 }
      );
    }

    const signingDate = new Date(signing_date);
    if (isNaN(signingDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid signing_date format" },
        { status: 400 }
      );
    }

    // Fetch document
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("id, temporal_data, raw_text, document_type, jurisdiction, entity_name")
      .eq("id", document_id)
      .single();

    if (docError || !doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Get temporal data — use cached or extract fresh
    let temporalData: TemporalExtractionResult;

    if (doc.temporal_data && (doc.temporal_data as TemporalExtractionResult).deadlines?.length > 0) {
      temporalData = doc.temporal_data as TemporalExtractionResult;
      console.log("[TimeBomb API] Using cached temporal data:", temporalData.deadlines.length, "deadlines");
    } else {
      // Extract on the spot
      console.log("[TimeBomb API] No cached temporal data, extracting...");

      // Fetch clauses for context
      const { data: clauses } = await supabase
        .from("clauses")
        .select("clause_number, original_text, clause_type")
        .eq("document_id", document_id)
        .order("clause_number", { ascending: true });

      temporalData = await extractTemporalObligations(
        doc.raw_text || "",
        doc.document_type || "other",
        doc.jurisdiction || "ALL-INDIA",
        clauses || []
      );

      // Cache the temporal data on the document
      await supabase
        .from("documents")
        .update({ temporal_data: temporalData })
        .eq("id", document_id);
    }

    if (temporalData.deadlines.length === 0) {
      return NextResponse.json({
        deadlines: [],
        timeline: [],
        stats: getDeadlineStats([]),
        temporal_risk: temporalData.overall_temporal_risk,
        message: "No temporal deadlines found in this contract.",
      });
    }

    // Calculate absolute dates
    const calculatedDeadlines = calculateAbsoluteDates(
      temporalData.deadlines,
      signingDate
    );

    // Set document_id and user_id on each deadline
    for (const d of calculatedDeadlines) {
      d.document_id = document_id;
      d.user_id = user.id;
    }

    // Delete existing deadlines for this document (re-activation scenario)
    await supabase
      .from("contract_deadlines")
      .delete()
      .eq("document_id", document_id)
      .eq("user_id", user.id);

    // Insert all deadlines
    const { error: insertError } = await supabase
      .from("contract_deadlines")
      .insert(
        calculatedDeadlines.map((d) => ({
          document_id: d.document_id,
          user_id: d.user_id,
          clause_id: d.clause_id,
          deadline_date: d.deadline_date,
          warning_start_date: d.warning_start_date,
          deadline_type: d.deadline_type,
          title: d.title,
          description: d.description,
          financial_impact: d.financial_impact,
          financial_description: d.financial_description,
          consequence_if_missed: d.consequence_if_missed,
          consequence_severity: d.consequence_severity,
          action_required: d.action_required,
          action_template: d.action_template,
          status: d.status,
          urgency: d.urgency,
          is_recurring: d.is_recurring,
          recurrence_interval_days: d.recurrence_interval_days,
          next_occurrence_date: d.next_occurrence_date,
          reminder_30d_sent: false,
          reminder_14d_sent: false,
          reminder_7d_sent: false,
          reminder_3d_sent: false,
          reminder_1d_sent: false,
          reminder_today_sent: false,
        }))
      );

    if (insertError) {
      console.error("[TimeBomb API] Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save deadlines: " + insertError.message },
        { status: 500 }
      );
    }

    // Re-fetch inserted deadlines (to get server-generated IDs)
    const { data: savedDeadlines } = await supabase
      .from("contract_deadlines")
      .select("*")
      .eq("document_id", document_id)
      .eq("user_id", user.id)
      .order("deadline_date", { ascending: true });

    const deadlines = savedDeadlines || calculatedDeadlines;
    const timeline = buildTimelineEvents(deadlines);
    const stats = getDeadlineStats(deadlines);

    console.log("[TimeBomb API] Activated:", deadlines.length, "deadlines for document", document_id);

    return NextResponse.json({
      deadlines,
      timeline,
      stats,
      temporal_risk: temporalData.overall_temporal_risk,
      temporal_risk_summary: temporalData.temporal_risk_summary,
      deadline_chains: temporalData.deadline_chains,
    });
  } catch (error) {
    console.error("[TimeBomb API] Activate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
