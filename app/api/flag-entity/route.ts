// ============================================
// FLAG ENTITY API
// POST /api/flag-entity
// Creates or updates flagged entity record
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      documentId,
      entityName,
      entityType,
      jurisdiction,
      riskScore,
      violations,
    } = body as {
      documentId: string;
      entityName: string;
      entityType: string;
      jurisdiction: string;
      riskScore: number;
      violations: string[];
    };

    if (!entityName || !entityName.trim()) {
      return NextResponse.json(
        { error: "Entity name is required" },
        { status: 400 }
      );
    }

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const cleanName = entityName.trim().toLowerCase();

    // Check if entity already exists
    const { data: existing, error: fetchError } = await supabase
      .from("flagged_entities")
      .select("*")
      .ilike("entity_name", cleanName)
      .single();

    if (existing) {
      // Update existing entity
      const currentViolations = existing.common_violations || [];
      const newViolations = [...new Set([...currentViolations, ...violations])];
      const newFlagCount = (existing.total_flags || 0) + 1;
      const newAvgScore = Math.round(
        ((existing.avg_risk_score || 0) * existing.total_flags + riskScore) /
          newFlagCount
      );

      const { error: updateError } = await supabase
        .from("flagged_entities")
        .update({
          total_flags: newFlagCount,
          common_violations: newViolations.slice(0, 10),
          avg_risk_score: newAvgScore,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) {
        console.error("[FlagEntity] Update error:", updateError);
        return NextResponse.json(
          { error: "Failed to update flag" },
          { status: 500 }
        );
      }

      // Save report record
      await saveReport(supabase, documentId, null, entityName, violations);

      return NextResponse.json({
        success: true,
        action: "updated",
        totalFlags: newFlagCount,
        entityId: existing.id,
      });
    } else {
      // Create new flagged entity
      const { data: newEntity, error: insertError } = await supabase
        .from("flagged_entities")
        .insert({
          entity_name: entityName.trim(),
          entity_type: entityType || "other",
          jurisdiction: jurisdiction || null,
          total_flags: 1,
          common_violations: violations.slice(0, 10),
          avg_risk_score: riskScore,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("[FlagEntity] Insert error:", insertError);
        return NextResponse.json(
          { error: "Failed to flag entity" },
          { status: 500 }
        );
      }

      // Save report record
      await saveReport(supabase, documentId, null, entityName, violations);

      return NextResponse.json({
        success: true,
        action: "created",
        totalFlags: 1,
        entityId: newEntity?.id,
      });
    }
  } catch (error: any) {
    console.error("[FlagEntity] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Save to reports table
async function saveReport(
  supabase: any,
  documentId: string,
  clauseId: string | null,
  entityName: string,
  violations: string[]
) {
  try {
    await supabase.from("reports").insert({
      document_id: documentId,
      clause_id: clauseId,
      user_id: null,
      entity_name: entityName,
      report_type: "predatory",
      description: violations.join(", "),
    });
  } catch (err) {
    console.error("[FlagEntity] Failed to save report:", err);
  }
}

// GET — Check entity reputation
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entityName = searchParams.get("name");

    if (!entityName) {
      return NextResponse.json(
        { error: "Entity name is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Search for entity (case insensitive, partial match)
    const { data: entity, error } = await supabase
      .from("flagged_entities")
      .select("*")
      .ilike("entity_name", `%${entityName.trim()}%`)
      .order("total_flags", { ascending: false })
      .limit(1)
      .single();

    if (error || !entity) {
      return NextResponse.json({
        found: false,
        entity: null,
        percentile: null,
      });
    }

    // Calculate percentile — how bad is this entity compared to others
    const { count: totalEntities } = await supabase
      .from("flagged_entities")
      .select("*", { count: "exact", head: true });

    const { count: entitiesWithFewerFlags } = await supabase
      .from("flagged_entities")
      .select("*", { count: "exact", head: true })
      .lt("total_flags", entity.total_flags);

    const percentile =
      totalEntities && totalEntities > 0
        ? Math.round(
            ((entitiesWithFewerFlags || 0) / totalEntities) * 100
          )
        : null;

    return NextResponse.json({
      found: true,
      entity: entity,
      percentile: percentile,
      totalEntities: totalEntities,
    });
  } catch (error: any) {
    console.error("[FlagEntity GET] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}