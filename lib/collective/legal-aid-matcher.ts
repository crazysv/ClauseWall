// ============================================
// LEGAL AID MATCHER — Jurisdiction-Based Organization Routing
// Matches users with relevant legal aid organizations
// ============================================

import { createAdminClient } from "@/lib/supabase/admin";
import type { LegalAidOrganization } from "@/types";

/**
 * Match legal aid organizations based on entity type, jurisdiction, and document type
 */
export async function matchLegalAidOrganizations(
  entityType: string,
  jurisdiction: string,
  documentType: string
): Promise<LegalAidOrganization[]> {
  try {
    const supabase = createAdminClient();

    const { data: allOrgs, error } = await supabase
      .from("legal_aid_organizations")
      .select("*");

    if (error || !allOrgs) return [];

    // Score each org based on relevance
    const scored = allOrgs.map((org: any) => {
      let score = 0;

      // Jurisdiction match
      const orgJurisdictions: string[] = org.jurisdictions || [];
      if (orgJurisdictions.includes("pan_india")) {
        score += 2;
      }
      if (orgJurisdictions.includes(jurisdiction?.toLowerCase())) {
        score += 5;
      }

      // Specialization match
      const specializations: string[] = org.specializations || [];
      const typeMapping: Record<string, string[]> = {
        landlord: ["rental", "real_estate", "property", "housing", "civil"],
        employer: ["employment", "labour", "wages", "termination"],
        company: ["consumer", "e_commerce", "competition"],
        bank: ["banking", "loan", "credit_card", "nbfc"],
        telecom: ["telecom", "internet", "broadband"],
        insurance: ["insurance", "health_insurance", "life_insurance"],
      };

      const relevantSpecs = typeMapping[entityType] || ["consumer", "civil"];
      for (const spec of relevantSpecs) {
        if (specializations.includes(spec)) {
          score += 3;
        }
      }

      // Document type match
      const docTypeMapping: Record<string, string[]> = {
        rental: ["rental", "real_estate", "property", "civil"],
        employment: ["employment", "labour", "wages"],
        loan: ["banking", "loan", "nbfc"],
        insurance: ["insurance"],
        tos: ["consumer", "e_commerce"],
        freelance: ["labour", "civil"],
      };

      const relevantDocSpecs = docTypeMapping[documentType] || [];
      for (const spec of relevantDocSpecs) {
        if (specializations.includes(spec)) {
          score += 2;
        }
      }

      // Free service bonus
      if (org.free_service) {
        score += 1;
      }

      return { org: org as LegalAidOrganization, score };
    });

    // Sort by score, return top 5
    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((s) => s.org);
  } catch (error) {
    console.error("[ClauseWall] [Collective] Legal aid matching error:", error);
    return [];
  }
}

/**
 * Get the appropriate consumer forum tier based on financial exposure
 */
export function getForumForComplaint(financialExposure: number): {
  forum: string;
  description: string;
  fee: string;
} {
  if (financialExposure <= 10000000) {
    // ≤ ₹1 Crore
    return {
      forum: "District Consumer Disputes Redressal Commission",
      description: "Handles complaints where goods/services value ≤ ₹1 Crore",
      fee: financialExposure <= 500000 ? "Free" : "₹200 - ₹5,000",
    };
  } else if (financialExposure <= 100000000) {
    // ≤ ₹10 Crore
    return {
      forum: "State Consumer Disputes Redressal Commission",
      description: "Handles complaints where goods/services value ₹1 Crore - ₹10 Crore",
      fee: "₹5,000 - ₹15,000",
    };
  } else {
    return {
      forum: "National Consumer Disputes Redressal Commission",
      description: "Handles complaints where goods/services value > ₹10 Crore",
      fee: "₹25,000+",
    };
  }
}
