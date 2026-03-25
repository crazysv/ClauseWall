// ============================================
// JURISDICTION RESOLVER
// Maps state/district to correct authority office
// ============================================

import type { Authority, AuthorityType } from '@/types';
import { getAuthoritiesByType, getAuthoritiesByState } from './authority-data';

interface ResolvedJurisdiction {
  authority: Authority | null;
  basis: string;
}

/**
 * Resolve jurisdiction to a specific authority office.
 */
export function resolveJurisdiction(
  authorityType: AuthorityType,
  state: string,
  district: string | null,
  complainantState: string | null,
  respondentState: string | null,
  claimAmount: number | null
): ResolvedJurisdiction {
  const authorities = getAuthoritiesByType(authorityType);

  // National-level authorities — only one office
  const nationalTypes: AuthorityType[] = [
    'consumer_forum_national', 'ccpa', 'tdsat', 'trai',
  ];
  if (nationalTypes.includes(authorityType)) {
    const national = authorities.find(a => a.level === 'national');
    return {
      authority: national || null,
      basis: national
        ? `${national.name} has national jurisdiction for this matter.`
        : 'No national authority found.',
    };
  }

  // IRDAI — single national regulator
  if (authorityType === 'irdai') {
    const irdai = authorities[0];
    return {
      authority: irdai || null,
      basis: irdai ? 'IRDAI handles all insurance regulatory complaints at national level.' : '',
    };
  }

  // RBI Ombudsman — match by state
  if (authorityType === 'rbi_ombudsman') {
    const matched = authorities.find(a => a.state === state) || authorities[0];
    return {
      authority: matched || null,
      basis: matched
        ? `RBI Integrated Ombudsman handles complaints for ${state} region.`
        : 'File with the centralized RBI Ombudsman at cms.rbi.org.in',
    };
  }

  // Insurance Ombudsman — match by state
  if (authorityType === 'insurance_ombudsman') {
    const matched = authorities.find(a => a.state === state);
    if (matched) {
      return {
        authority: matched,
        basis: `Insurance Ombudsman office for ${state}: ${matched.name}`,
      };
    }
    // Fallback to nearest
    return {
      authority: authorities[0] || null,
      basis: 'Insurance Ombudsman — file at the nearest regional office per IGMS portal.',
    };
  }

  // State-level authorities
  const stateTypes: AuthorityType[] = [
    'consumer_forum_state', 'rera_state', 'rent_control',
    'labour_commissioner', 'industrial_tribunal',
  ];
  if (stateTypes.includes(authorityType)) {
    const stateMatch = authorities.find(a => a.state === state);
    return {
      authority: stateMatch || authorities[0] || null,
      basis: stateMatch
        ? `${stateMatch.name} has jurisdiction for ${state}.`
        : `State-level ${authorityType} authority for ${state}.`,
    };
  }

  // District-level: Consumer Forum District
  if (authorityType === 'consumer_forum_district') {
    // CPA 2019 Section 34(2): Complainant can file where
    // (a) opposite party resides or carries business, OR
    // (b) cause of action arose, OR
    // (c) complainant resides (for post-2019 complaints)
    if (district) {
      const districtMatch = authorities.find(
        a => a.district && a.district.toLowerCase() === district.toLowerCase()
          && a.state === state
      );
      if (districtMatch) {
        return {
          authority: districtMatch,
          basis: `District Forum at ${district}, ${state} per CPA 2019 §34(2).`,
        };
      }
    }
    // Fallback to state capital's district forum
    const stateForums = authorities.filter(a => a.state === state);
    return {
      authority: stateForums[0] || authorities[0] || null,
      basis: `Consumer Forum in ${state} per CPA 2019 §34(2) — file at your place of residence.`,
    };
  }

  // Legal aid — match by state
  if (authorityType === 'legal_aid') {
    const stateMatch = authorities.find(a => a.state === state);
    return {
      authority: stateMatch || authorities[0] || null,
      basis: stateMatch
        ? `State Legal Services Authority in ${state} — free legal aid available.`
        : 'Contact NALSA for free legal aid.',
    };
  }

  // Fallback
  const anyMatch = authorities.find(a => a.state === state) || authorities[0];
  return {
    authority: anyMatch || null,
    basis: anyMatch ? `${anyMatch.name} for ${state}.` : 'No authority office found.',
  };
}
