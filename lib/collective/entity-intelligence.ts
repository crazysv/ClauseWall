// ============================================
// ENTITY INTELLIGENCE — Pattern Detection & Collective Discovery
// Detects when multiple users share an entity with similar violations
// ============================================

import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeEntityName, detectEntityType } from "@/lib/core/entity-extractor";
import { calculateLeverage } from "@/lib/collective/leverage-calculator";
import { matchLegalAidOrganizations } from "@/lib/collective/legal-aid-matcher";
import type {
  EntityPattern,
  EntityIntelligence,
  Collective,
  CollectiveMembership,
  CommonViolation,
} from "@/types";

// Entity type → minimum flags to auto-create collective
const AUTO_COLLECTIVE_THRESHOLDS: Record<string, number> = {
  landlord: 3,
  employer: 5,
  company: 10,
  bank: 10,
  telecom: 15,
  insurance: 10,
  other: 5,
};

// Entity type → threshold for collective to unlock actions
const ACTION_THRESHOLDS: Record<string, number> = {
  landlord: 5,
  employer: 10,
  company: 20,
  bank: 20,
  telecom: 25,
  insurance: 20,
  other: 10,
};

/**
 * Get comprehensive intelligence about an entity — patterns, collectives, leverage
 */
export async function getEntityIntelligence(
  entityName: string,
  userId?: string,
  documentId?: string,
  jurisdiction?: string,
  documentType?: string
): Promise<EntityIntelligence | null> {
  try {
    const supabase = createAdminClient();
    const normalized = entityName.trim().toLowerCase();

    if (!normalized || normalized.length < 2) return null;

    // ── Step 1: Get flagged entity data ──
    const { data: flaggedEntity } = await supabase
      .from("flagged_entities")
      .select("*")
      .ilike("entity_name", normalized)
      .maybeSingle();

    // ── Step 2: Get all documents mentioning this entity ──
    const { data: relatedDocs } = await supabase
      .from("documents")
      .select("id, document_type, jurisdiction, overall_risk_score, created_at, entity_name")
      .ilike("entity_name", `%${normalized}%`)
      .eq("analysis_status", "completed")
      .limit(100);

    const totalDocuments = relatedDocs?.length || 0;
    const totalFlags = flaggedEntity?.total_flags || 0;

    if (totalFlags === 0 && totalDocuments === 0) return null;

    // ── Step 3: Aggregate common violations from clauses ──
    const documentIds = relatedDocs?.map((d) => d.id) || [];
    let violationMap: Record<string, CommonViolation> = {};

    if (documentIds.length > 0) {
      const { data: dangerousClauses } = await supabase
        .from("clauses")
        .select("clause_type, explanation, legal_citation, risk_score, risk_level")
        .in("document_id", documentIds.slice(0, 50))
        .in("risk_level", ["dangerous", "illegal"]);

      if (dangerousClauses) {
        for (const clause of dangerousClauses) {
          const key = clause.clause_type || "unknown";
          if (!violationMap[key]) {
            violationMap[key] = {
              clause_type: key,
              violation_description: clause.explanation?.substring(0, 200) || "",
              occurrence_count: 0,
              occurrence_percentage: 0,
              legal_citation: clause.legal_citation,
              severity: clause.risk_level,
              avg_financial_impact: null,
            };
          }
          violationMap[key].occurrence_count++;
        }

        // Calculate percentages
        const totalViolations = Object.values(violationMap).reduce(
          (sum, v) => sum + v.occurrence_count, 0
        );
        for (const key in violationMap) {
          violationMap[key].occurrence_percentage = Math.round(
            (violationMap[key].occurrence_count / Math.max(totalViolations, 1)) * 100
          );
        }
      }
    }

    const commonViolations = Object.values(violationMap)
      .sort((a, b) => b.occurrence_count - a.occurrence_count)
      .slice(0, 10);

    // ── Step 4: Determine entity type ──
    const entityType = flaggedEntity?.entity_type ||
      detectEntityType(entityName, documentType || "other");

    // ── Step 5: Build entity pattern ──
    const jurisdictions = [...new Set(
      (relatedDocs || []).map((d) => d.jurisdiction).filter(Boolean)
    )] as string[];

    const documentTypes = [...new Set(
      (relatedDocs || []).map((d) => d.document_type).filter(Boolean)
    )] as string[];

    const avgRiskScore = flaggedEntity?.avg_risk_score ||
      (relatedDocs && relatedDocs.length > 0
        ? Math.round(
            relatedDocs.reduce((sum, d) => sum + (d.overall_risk_score || 0), 0) /
            relatedDocs.length
          )
        : 0);

    // ── Step 6: Find or auto-create collective ──
    let { data: collective } = await supabase
      .from("collectives")
      .select("*")
      .eq("normalized_entity_name", normalized)
      .maybeSingle();

    // Auto-create collective if threshold met
    const autoThreshold = AUTO_COLLECTIVE_THRESHOLDS[entityType] || 5;
    if (!collective && totalFlags >= autoThreshold) {
      const { data: newCollective } = await supabase
        .from("collectives")
        .insert({
          entity_name: flaggedEntity?.entity_name || entityName,
          entity_type: entityType,
          normalized_entity_name: normalized,
          status: "forming",
          member_count: 0,
          threshold: ACTION_THRESHOLDS[entityType] || 10,
          total_documents: totalDocuments,
          common_violations: commonViolations,
          total_financial_exposure: 0,
          jurisdictions,
          primary_jurisdiction: jurisdiction || jurisdictions[0] || "pan_india",
          document_type: documentType || documentTypes[0] || "other",
          description: `Community collective against ${entityName} for predatory contract practices.`,
        })
        .select()
        .single();

      collective = newCollective;
      console.log(`[ClauseWall] [Collective] Auto-created collective for "${entityName}" (${totalFlags} flags)`);
    } else if (collective) {
      // Update collective stats
      await supabase
        .from("collectives")
        .update({
          total_documents: totalDocuments,
          common_violations: commonViolations,
          updated_at: new Date().toISOString(),
        })
        .eq("id", collective.id);
    }

    // ── Step 7: Check user membership ──
    let userMembership: CollectiveMembership | null = null;
    if (userId && collective) {
      const { data: membership } = await supabase
        .from("collective_memberships")
        .select("*")
        .eq("collective_id", collective.id)
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();

      userMembership = membership as CollectiveMembership | null;
    }

    // ── Step 8: Build entity pattern ──
    const entityPattern: EntityPattern = {
      entity_name: flaggedEntity?.entity_name || entityName,
      entity_type: entityType,
      normalized_name: normalized,
      total_flags: totalFlags,
      total_documents: totalDocuments,
      common_violations: commonViolations,
      avg_risk_score: avgRiskScore,
      total_financial_exposure: 0,
      jurisdictions,
      document_types: documentTypes,
      first_flagged: flaggedEntity?.created_at || new Date().toISOString(),
      last_flagged: flaggedEntity?.updated_at || new Date().toISOString(),
      has_active_collective: !!collective && collective.status !== "dormant",
      collective_id: collective?.id || null,
    };

    // ── Step 9: Calculate leverage ──
    const leverage = collective
      ? calculateLeverage(
          entityType,
          collective.member_count || totalFlags,
          avgRiskScore,
          0
        )
      : null;

    // ── Step 10: Match legal aid ──
    const matchingLegalAid = await matchLegalAidOrganizations(
      entityType,
      jurisdiction || jurisdictions[0] || "pan_india",
      documentType || documentTypes[0] || "other"
    );

    // ── Step 11: Generate recommendations ──
    const memberCount = collective?.member_count || 0;
    const threshold = collective?.threshold || ACTION_THRESHOLDS[entityType] || 10;
    const recommendedActions: string[] = [];

    if (!collective) {
      recommendedActions.push("Flag this entity to help build a community pattern");
    } else if (!userMembership) {
      recommendedActions.push("Join the collective to strengthen community action");
    }

    if (totalFlags >= 3) {
      recommendedActions.push("Contact legal aid organizations for free advice");
    }
    if (memberCount >= threshold) {
      recommendedActions.push("Propose a joint legal notice to the entity");
      recommendedActions.push("File a collective consumer forum complaint");
    }
    if (commonViolations.length >= 3) {
      recommendedActions.push("Document all violations for coordinated legal action");
    }

    // ── Step 12: Assess collective strength ──
    const strengthAssessment = memberCount >= threshold * 2
      ? "very_strong" as const
      : memberCount >= threshold
        ? "strong" as const
        : memberCount >= Math.ceil(threshold / 2)
          ? "moderate" as const
          : "weak" as const;

    return {
      entity: entityPattern,
      collective: collective as Collective | null,
      user_membership: userMembership,
      leverage,
      matching_legal_aid: matchingLegalAid,
      recommended_actions: recommendedActions,
      strength_assessment: strengthAssessment,
    };
  } catch (error) {
    console.error("[ClauseWall] [Collective] Entity intelligence error:", error);
    return null;
  }
}
