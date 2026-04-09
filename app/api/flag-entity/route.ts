// ============================================
// FLAG ENTITY API
// POST /api/flag-entity
// Creates or updates flagged entity record
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeEntityName, sanitizeStringArray } from "@/lib/sanitize";
import { safeErrorResponse } from "@/lib/api/error-response";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to flag entities" },
        { status: 401 },
      );
    }

    const rl = await rateLimit(req, "DB_WRITE", user.id);
    if (!rl.success) return rateLimitResponse(rl);

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

    // Sanitize user-controlled inputs
    const cleanViolations = sanitizeStringArray(violations || [], 20, 300);

    if (!entityName || !entityName.trim()) {
      return NextResponse.json(
        { error: "Entity name is required" },
        { status: 400 },
      );
    }

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 },
      );
    }

    const cleanName = sanitizeEntityName(entityName).toLowerCase();

    // Check if entity already exists
    const { data: existing } = await supabase
      .from("flagged_entities")
      .select("*")
      .ilike("entity_name", cleanName)
      .single();

    if (existing) {
      // Update existing entity
      const currentViolations = existing.common_violations || [];
      const newViolations = [...new Set([...currentViolations, ...cleanViolations])];
      const newFlagCount = (existing.total_flags || 0) + 1;
      const newAvgScore = Math.round(
        ((existing.avg_risk_score || 0) * existing.total_flags + riskScore) /
          newFlagCount,
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
        return safeErrorResponse("flag-entity", updateError, "Failed to update flag");
      }

      // Save report record
      await saveReport(supabase, documentId, null, entityName, cleanViolations, user.id);

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
          common_violations: cleanViolations.slice(0, 10),
          avg_risk_score: riskScore,
        })
        .select("id")
        .single();

      if (insertError) {
        return safeErrorResponse("flag-entity", insertError, "Failed to flag entity");
      }

      // Save report record
      await saveReport(supabase, documentId, null, entityName, cleanViolations, user.id);

      return NextResponse.json({
        success: true,
        action: "created",
        totalFlags: 1,
        entityId: newEntity?.id,
      });
    }
  } catch (error) {
    return safeErrorResponse("flag-entity", error, "Failed to flag entity");
  }
}

async function saveReport(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  documentId: string,
  clauseId: string | null,
  entityName: string,
  // Note: violations are already sanitized at the route handler level
  violations: string[],
  userId: string,
) {
  try {
    await supabase.from("reports").insert({
      document_id: documentId,
      clause_id: clauseId,
      user_id: userId,
      entity_name: entityName,
      report_type: "predatory",
      description: violations.join(", "),
    });
  } catch {
    // Report insertion is best-effort — don't fail the main operation
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
        { status: 400 },
      );
    }

    const supabase = await createClient();

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
        ? Math.round(((entitiesWithFewerFlags || 0) / totalEntities) * 100)
        : null;

    return NextResponse.json({
      found: true,
      entity: entity,
      percentile: percentile,
      totalEntities: totalEntities,
    });
  } catch (error) {
    return safeErrorResponse("flag-entity-get", error, "Failed to fetch entity flags");
  }
}
