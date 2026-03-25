// ============================================
// AUTHORITY ROUTER — DECISION TREE
// Determines which authority to approach
// Pure logic, no AI
// ============================================

import type {
  AuthorityType,
  AuthorityLevel,
  Authority,
  AuthorityRecommendation,
  AuthorityEscalation,
  AuthorityRoutingResult,
  JurisdictionInput,
  LimitationInfo,
  FeeCalculation,
} from '@/types';
import { AUTHORITIES, getAuthoritiesByType, getAuthoritiesByState } from './authority-data';
import { calculateFee } from './fee-calculator';
import { resolveJurisdiction } from './jurisdiction-resolver';

/**
 * Determine which authority to approach based on contract type, clause issues,
 * jurisdiction, and claim amount. Pure deterministic logic.
 */
export function determineAuthority(input: JurisdictionInput): AuthorityRoutingResult {
  // Step 1: Determine applicable authority types
  const applicableTypes = getApplicableAuthorityTypes(input);

  // Step 2: Resolve consumer forum level based on claim amount
  const resolvedTypes = resolveConsumerForumLevel(applicableTypes, input.claim_amount);

  // Step 3: Find specific authority offices
  const recommendations: AuthorityRecommendation[] = [];
  const feeCalculations: FeeCalculation[] = [];

  for (const authorityType of resolvedTypes) {
    const resolved = resolveJurisdiction(
      authorityType,
      input.jurisdiction,
      input.district,
      null,
      null,
      input.claim_amount
    );

    if (resolved.authority) {
      const escalationPath = getEscalationPath(authorityType, input.jurisdiction, input.district);
      const limitation = getLimitationInfo(authorityType, input.contract_date);
      const fee = calculateFee(authorityType, input.claim_amount || 0, input.jurisdiction);

      recommendations.push({
        primary: resolved.authority,
        alternatives: getAlternatives(authorityType, input.jurisdiction, input.district, resolved.authority.id),
        reasoning: resolved.basis,
        escalation_path: escalationPath,
        limitation_period: limitation,
        jurisdiction_basis: resolved.basis,
      });

      feeCalculations.push(fee);
    }
  }

  // If no recommendations found, suggest generic consumer forum
  if (recommendations.length === 0) {
    const fallback = getFallbackAuthority(input.jurisdiction);
    if (fallback) {
      const limitation = getLimitationInfo('consumer_forum_district', input.contract_date);
      const fee = calculateFee('consumer_forum_district', input.claim_amount || 0, input.jurisdiction);
      recommendations.push({
        primary: fallback,
        alternatives: [],
        reasoning: 'Consumer forum is available for all types of consumer disputes.',
        escalation_path: getEscalationPath('consumer_forum_district', input.jurisdiction, input.district),
        limitation_period: limitation,
        jurisdiction_basis: `Consumer forum at complainant's residence in ${input.jurisdiction}`,
      });
      feeCalculations.push(fee);
    }
  }

  const limitation = getLimitationInfo(
    resolvedTypes[0] || 'consumer_forum_district',
    input.contract_date
  );

  return {
    recommendations,
    fee_calculations: feeCalculations,
    limitation_check: limitation,
    jurisdiction_analysis: buildJurisdictionAnalysis(input, recommendations),
    total_authorities_applicable: recommendations.length,
  };
}

// ── Step 1: Determine applicable authority types ──

function getApplicableAuthorityTypes(input: JurisdictionInput): AuthorityType[] {
  const types: AuthorityType[] = [];
  const ct = input.clause_types.map(c => c.toLowerCase());

  switch (input.document_type) {
    case 'rental':
      if (ct.some(c => ['registration', 'possession', 'carpet_area', 'project_details'].includes(c))) {
        types.push('rera_state');
      }
      types.push('rent_control');
      types.push('consumer_forum_district');
      break;

    case 'employment':
      if (ct.some(c => ['wages', 'salary', 'overtime', 'minimum_wage', 'payment'].includes(c))) {
        types.push('labour_commissioner');
      }
      if (ct.some(c => ['termination', 'retrenchment', 'dismissal'].includes(c))) {
        types.push('industrial_tribunal');
      }
      if (!types.includes('labour_commissioner')) {
        types.push('labour_commissioner');
      }
      break;

    case 'loan':
      types.push('rbi_ombudsman');
      types.push('consumer_forum_district');
      break;

    case 'insurance':
      if (input.claim_amount && input.claim_amount <= 3000000) {
        types.push('insurance_ombudsman');
      }
      types.push('irdai');
      types.push('consumer_forum_district');
      break;

    case 'tos':
      types.push('consumer_forum_district');
      types.push('ccpa');
      if (ct.some(c => ['data_privacy', 'billing', 'service_terms', 'network'].includes(c))) {
        if (input.respondent_type === 'telecom') {
          types.push('trai');
        }
      }
      break;

    case 'freelance':
    case 'sale':
    case 'partnership':
    case 'nda':
    default:
      types.push('consumer_forum_district');
      break;
  }

  // Always add legal aid as an option
  types.push('legal_aid');

  // Deduplicate
  return [...new Set(types)];
}

// ── Step 2: Resolve consumer forum level ──

function resolveConsumerForumLevel(
  types: AuthorityType[],
  claimAmount: number | null
): AuthorityType[] {
  return types.map(t => {
    if (t !== 'consumer_forum_district') return t;
    if (!claimAmount) return 'consumer_forum_district';
    if (claimAmount <= 10000000) return 'consumer_forum_district';
    if (claimAmount <= 100000000) return 'consumer_forum_state';
    return 'consumer_forum_national';
  });
}

// ── Step 4: Get escalation path ──

function getEscalationPath(
  authorityType: AuthorityType,
  state: string,
  district: string | null
): AuthorityEscalation[] {
  const escalations: AuthorityEscalation[] = [];

  switch (authorityType) {
    case 'consumer_forum_district': {
      const stateAuth = getAuthoritiesByType('consumer_forum_state').find((a: Authority) => a.state === state);
      const nationalAuth = getAuthoritiesByType('consumer_forum_national')[0];
      if (stateAuth) {
        escalations.push({ step: 1, authority: stateAuth, condition: 'Appeal within 30 days of District Forum order', timeline: '3-6 months' });
      }
      if (nationalAuth) {
        escalations.push({ step: 2, authority: nationalAuth, condition: 'Appeal within 30 days of State Commission order', timeline: '6-12 months' });
      }
      break;
    }
    case 'rbi_ombudsman': {
      const consumerForum = getAuthoritiesByType('consumer_forum_district').find((a: Authority) => a.state === state);
      if (consumerForum) {
        escalations.push({ step: 1, authority: consumerForum, condition: 'If no resolution within 30 days from RBI Ombudsman', timeline: '3-6 months' });
      }
      break;
    }
    case 'insurance_ombudsman': {
      const irdai = getAuthoritiesByType('irdai')[0];
      const consumerForum = getAuthoritiesByType('consumer_forum_district').find((a: Authority) => a.state === state);
      if (irdai) {
        escalations.push({ step: 1, authority: irdai, condition: 'If Ombudsman decision is unsatisfactory', timeline: '1-3 months' });
      }
      if (consumerForum) {
        escalations.push({ step: 2, authority: consumerForum, condition: 'If IRDAI does not resolve', timeline: '3-6 months' });
      }
      break;
    }
    case 'trai': {
      const tdsat = getAuthoritiesByType('tdsat')[0];
      if (tdsat) {
        escalations.push({ step: 1, authority: tdsat, condition: 'Appeal against TRAI order', timeline: '3-6 months' });
      }
      break;
    }
    case 'labour_commissioner': {
      const tribunal = getAuthoritiesByType('industrial_tribunal').find((a: Authority) => a.state === state);
      if (tribunal) {
        escalations.push({ step: 1, authority: tribunal, condition: 'If conciliation fails at Labour Commissioner level', timeline: '6-12 months' });
      }
      break;
    }
  }

  return escalations;
}

// ── Step 5: Limitation period ──

function getLimitationInfo(authorityType: AuthorityType, contractDate: string | null): LimitationInfo {
  const periods: Record<string, { years: number; event: string }> = {
    consumer_forum_district: { years: 2, event: 'Date of cause of action' },
    consumer_forum_state: { years: 2, event: 'Date of cause of action' },
    consumer_forum_national: { years: 2, event: 'Date of cause of action' },
    rera_state: { years: 1, event: 'Date of possession or discovery of defect' },
    rbi_ombudsman: { years: 1, event: 'Date of rejection by bank or 30 days after complaint to bank' },
    insurance_ombudsman: { years: 1, event: 'Date of rejection by insurer' },
    labour_commissioner: { years: 3, event: 'Date of cause of action' },
    trai: { years: 1, event: 'Date of cause of action' },
    rent_control: { years: 3, event: 'Date of cause of action' },
  };

  const period = periods[authorityType] || { years: 2, event: 'Date of cause of action' };

  let deadline: string | null = null;
  let isExpired = false;
  let daysRemaining: number | null = null;

  if (contractDate) {
    const start = new Date(contractDate);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + period.years);
    deadline = end.toISOString().split('T')[0];

    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    isExpired = daysRemaining < 0;
  }

  return {
    period_years: period.years,
    start_event: period.event,
    deadline,
    is_expired: isExpired,
    days_remaining: daysRemaining,
    extension_possible: true,
    extension_reason: 'Sufficient cause shown to the Forum/Authority may extend limitation',
  };
}

// ── Helpers ──

function getAlternatives(
  primaryType: AuthorityType,
  state: string,
  district: string | null,
  excludeId: string
): Authority[] {
  const sameType = getAuthoritiesByType(primaryType).filter((a: Authority) => a.id !== excludeId);
  const stateLevel = sameType.filter((a: Authority) => a.state === state);
  return stateLevel.slice(0, 2);
}

function getFallbackAuthority(state: string): Authority | null {
  const stateForums = getAuthoritiesByType('consumer_forum_district').filter((a: Authority) => a.state === state);
  if (stateForums.length > 0) return stateForums[0];

  const stateCommissions = getAuthoritiesByType('consumer_forum_state').filter((a: Authority) => a.state === state);
  if (stateCommissions.length > 0) return stateCommissions[0];

  const national = getAuthoritiesByType('consumer_forum_national');
  return national[0] || null;
}

function buildJurisdictionAnalysis(
  input: JurisdictionInput,
  recommendations: AuthorityRecommendation[]
): string {
  if (recommendations.length === 0) {
    return `No specific authority found for ${input.jurisdiction}. Consider filing at the nearest Consumer Forum.`;
  }

  const primary = recommendations[0];
  return `Based on your ${input.document_type} contract in ${input.jurisdiction}, ` +
    `${primary.primary.name} is recommended. ${primary.reasoning} ` +
    `${recommendations.length > 1 ? `${recommendations.length - 1} alternative(s) also available.` : ''}`;
}
