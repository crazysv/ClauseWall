// ============================================
// CLAUSEWALL — AUTHORITY DATABASE OPERATIONS
// CRUD operations for legal_authorities table
// ============================================

import { createClient } from "@/lib/supabase/server";
import type {
  LegalAuthority,
  AuthorityType,
  AuthoritySearchQuery,
} from "@/types/authority";
import { SEED_AUTHORITIES } from "./seed-data";

// ============================================
// READ OPERATIONS
// ============================================

/**
 * Get a single authority by ID
 */
export async function getAuthorityById(
  id: string
): Promise<LegalAuthority | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("legal_authorities")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (error || !data) return null;
    return data as LegalAuthority;
  } catch {
    return null;
  }
}

/**
 * Search authorities with filters
 */
export async function searchAuthorities(
  query: AuthoritySearchQuery
): Promise<LegalAuthority[]> {
  try {
    const supabase = await createClient();
    let q = supabase
      .from("legal_authorities")
      .select("*")
      .eq("is_active", true);

    if (query.authority_type) {
      q = q.eq("authority_type", query.authority_type);
    }
    if (query.state) {
      q = q.eq("state_code", query.state);
    }
    if (query.city) {
      q = q.ilike("city", `%${query.city}%`);
    }
    if (query.jurisdiction_level) {
      q = q.eq("jurisdiction_level", query.jurisdiction_level);
    }
    if (query.has_e_filing !== undefined) {
      q = q.eq("has_e_filing", query.has_e_filing);
    }
    if (query.search_text) {
      q = q.or(
        `name.ilike.%${query.search_text}%,short_name.ilike.%${query.search_text}%,city.ilike.%${query.search_text}%`
      );
    }

    q = q
      .order("jurisdiction_level", { ascending: true })
      .limit(query.limit || 20)
      .range(query.offset || 0, (query.offset || 0) + (query.limit || 20) - 1);

    const { data, error } = await q;
    if (error || !data) return [];
    return data as LegalAuthority[];
  } catch {
    return [];
  }
}

/**
 * Get authorities by type, optionally filtered by state
 */
export async function getAuthoritiesByType(
  authorityType: string,
  stateCode?: string
): Promise<LegalAuthority[]> {
  try {
    const supabase = await createClient();
    let q = supabase
      .from("legal_authorities")
      .select("*")
      .eq("authority_type", authorityType)
      .eq("is_active", true);

    if (stateCode) {
      q = q.eq("state_code", stateCode);
    }

    q = q.order("jurisdiction_level", { ascending: true }).limit(5);

    const { data, error } = await q;

    // Fallback: if no DB results, try seed data
    if (error || !data || data.length === 0) {
      return getFallbackAuthorities(authorityType, stateCode);
    }

    return data as LegalAuthority[];
  } catch {
    return getFallbackAuthorities(authorityType, stateCode);
  }
}

/**
 * Get escalation authority for a given authority
 */
export async function getEscalationAuthority(
  authorityId: string
): Promise<LegalAuthority | null> {
  try {
    const current = await getAuthorityById(authorityId);
    if (!current?.escalation_authority_id) return null;
    return getAuthorityById(current.escalation_authority_id);
  } catch {
    return null;
  }
}

// ============================================
// FALLBACK: Use seed data when DB is empty
// ============================================

function getFallbackAuthorities(
  authorityType: string,
  stateCode?: string
): LegalAuthority[] {
  let matches = SEED_AUTHORITIES.filter(
    (a) => a.authority_type === authorityType
  );

  if (stateCode) {
    const stateMatches = matches.filter((a) => a.state_code === stateCode);
    if (stateMatches.length > 0) {
      matches = stateMatches;
    }
    // If no state-specific match, keep all (e.g., national authorities)
  }

  // Convert seed data to full LegalAuthority shape
  return matches.slice(0, 5).map((seed) => ({
    id: `seed-${seed.authority_type}-${seed.state_code || "nat"}-${seed.city || "any"}`,
    name: seed.name,
    short_name: seed.short_name || null,
    authority_type: seed.authority_type as AuthorityType,
    jurisdiction_level: (seed.jurisdiction_level as any) || "district",
    state_code: seed.state_code || null,
    city: seed.city || null,
    district: seed.district || null,
    covers_districts: seed.covers_districts || [],
    covers_states: seed.covers_states || [],
    claim_amount_min: seed.claim_amount_min || 0,
    claim_amount_max: seed.claim_amount_max ?? null,
    handles_document_types: seed.handles_document_types || [],
    handles_dispute_types: seed.handles_dispute_types || [],
    physical_address: seed.physical_address || null,
    pincode: seed.pincode || null,
    phone_numbers: seed.phone_numbers || [],
    email: seed.email || null,
    website: seed.website || null,
    e_filing_portal_url: seed.e_filing_portal_url || null,
    e_filing_instructions: seed.e_filing_instructions || null,
    google_maps_url: seed.google_maps_url || null,
    latitude: seed.latitude ?? null,
    longitude: seed.longitude ?? null,
    working_hours: seed.working_hours || null,
    working_days: seed.working_days || null,
    closed_on: seed.closed_on || null,
    lunch_break: seed.lunch_break || null,
    filing_fee_structure: seed.filing_fee_structure || {},
    required_documents: seed.required_documents || [],
    filing_process_steps: seed.filing_process_steps || [],
    typical_resolution_days: seed.typical_resolution_days ?? null,
    current_backlog: seed.current_backlog || null,
    success_rate_estimate: seed.success_rate_estimate ?? null,
    last_verified_at: seed.last_verified_at || null,
    presiding_officer_name: seed.presiding_officer_name || null,
    presiding_officer_designation: seed.presiding_officer_designation || null,
    has_e_filing: seed.has_e_filing || false,
    has_video_hearing: seed.has_video_hearing || false,
    has_online_tracking: seed.has_online_tracking || false,
    has_online_payment: seed.has_online_payment || false,
    online_tracking_url: seed.online_tracking_url || null,
    parent_authority_id: seed.parent_authority_id || null,
    escalation_authority_id: seed.escalation_authority_id || null,
    escalation_deadline_days: seed.escalation_deadline_days ?? null,
    escalation_conditions: seed.escalation_conditions || null,
    notes: seed.notes || null,
    data_source: seed.data_source || null,
    is_active: seed.is_active ?? true,
    is_verified: seed.is_verified ?? false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
}
