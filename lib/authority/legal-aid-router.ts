// ============================================
// CLAUSEWALL — LEGAL AID ROUTING ENGINE
// Eligibility check + nearest provider search
// ============================================

import type {
  LegalAidQuery,
  LegalAidResult,
  LegalAidEligibility,
  LegalAidProvider,
  Helpline,
} from "@/types/authority";
import { createClient } from "@/lib/supabase/server";
import {
  LEGAL_AID_INCOME_THRESHOLD,
  LEGAL_AID_INCOME_THRESHOLD_STATES,
  LEGAL_AID_CATEGORIES,
  NATIONAL_HELPLINES,
} from "./constants";
import { SEED_LEGAL_AID_PROVIDERS } from "./seed-data-rules";

/**
 * Check legal aid eligibility based on income and category.
 */
export function checkEligibility(query: LegalAidQuery): LegalAidEligibility {
  const stateThreshold =
    LEGAL_AID_INCOME_THRESHOLD_STATES[query.state] || LEGAL_AID_INCOME_THRESHOLD;

  const reasons: string[] = [];
  const eligibleCategories: string[] = [];
  let isEligible = false;

  // Income-based eligibility
  if (query.annual_income !== undefined && query.annual_income <= stateThreshold) {
    isEligible = true;
    reasons.push(
      `Annual income ₹${query.annual_income.toLocaleString("en-IN")} is below the threshold of ₹${stateThreshold.toLocaleString("en-IN")} under Legal Services Authorities Act, 1987.`
    );
  }

  // Category-based eligibility (LSAA Section 12)
  if (query.category && LEGAL_AID_CATEGORIES.includes(query.category as any)) {
    isEligible = true;
    eligibleCategories.push(query.category);
    reasons.push(
      `Eligible under Section 12 of Legal Services Authorities Act, 1987 as ${query.category.replace(/_/g, " ")} member.`
    );
  }

  if (query.gender === "female") {
    isEligible = true;
    eligibleCategories.push("women");
    reasons.push("Women are eligible for free legal aid under Section 12(c) of LSAA 1987.");
  }

  if (query.age !== undefined && query.age < 18) {
    isEligible = true;
    eligibleCategories.push("children");
    reasons.push("Children (under 18) are eligible for free legal aid under Section 12(d).");
  }

  if (query.is_disabled) {
    isEligible = true;
    eligibleCategories.push("disabled");
    reasons.push("Persons with disabilities are eligible for free legal aid under Section 12(f).");
  }

  if (!isEligible) {
    // Provide Tele-Law info regardless
    reasons.push(
      "Based on the information provided, you may not qualify for free legal services from DLSA/SLSA. However, you can still access FREE legal advice via Tele-Law (1800-11-5151)."
    );
  }

  return { is_eligible: isEligible, reasons, eligible_categories: eligibleCategories };
}

/**
 * Find legal aid providers matching the query.
 */
export async function findLegalAidProviders(
  query: LegalAidQuery
): Promise<LegalAidResult> {
  const eligibility = checkEligibility(query);

  // Try DB first, fallback to seed
  let providers: LegalAidProvider[] = [];
  try {
    const supabase = await createClient();
    let q = supabase
      .from("legal_aid_providers")
      .select("*")
      .eq("is_active", true);

    if (query.state) {
      q = q.or(`state_code.eq.${query.state},state_code.is.null`);
    }
    if (query.city) {
      q = q.or(`city.ilike.%${query.city}%,city.is.null`);
    }

    q = q.order("provider_type").limit(20);
    const { data } = await q;
    if (data && data.length > 0) {
      providers = data as LegalAidProvider[];
    }
  } catch {
    // Fallback to seed data
  }

  if (providers.length === 0) {
    providers = getFallbackProviders(query.state, query.city);
  }

  const helplines: Helpline[] = [...NATIONAL_HELPLINES] as Helpline[];

  return { eligibility, providers, helplines };
}

function getFallbackProviders(
  stateCode?: string,
  city?: string
): LegalAidProvider[] {
  let matches = SEED_LEGAL_AID_PROVIDERS;

  if (stateCode) {
    const stateMatches = matches.filter(
      (p) => p.state_code === stateCode || !p.state_code
    );
    if (stateMatches.length > 0) matches = stateMatches;
  }
  if (city) {
    const cityMatches = matches.filter(
      (p) => p.city?.toLowerCase().includes(city.toLowerCase()) || !p.city
    );
    if (cityMatches.length > 0) matches = cityMatches;
  }

  return matches.slice(0, 15).map((seed) => ({
    id: `seed-${seed.provider_type}-${seed.state_code || "nat"}`,
    provider_type: seed.provider_type as any,
    name: seed.name,
    description: seed.description || null,
    state_code: seed.state_code || null,
    city: seed.city || null,
    district: seed.district || null,
    address: seed.address || null,
    pincode: seed.pincode || null,
    phone_numbers: seed.phone_numbers || [],
    email: seed.email || null,
    website: seed.website || null,
    helpline_number: seed.helpline_number || null,
    income_threshold: seed.income_threshold ?? null,
    eligible_categories: seed.eligible_categories || [],
    eligibility_description: seed.eligibility_description || null,
    services_offered: seed.services_offered || [],
    languages: seed.languages || [],
    operating_hours: seed.operating_hours || null,
    is_free: seed.is_free ?? true,
    is_active: true,
    last_verified_at: null,
    created_at: new Date().toISOString(),
  }));
}
