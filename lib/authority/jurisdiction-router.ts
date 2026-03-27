// ============================================
// CLAUSEWALL — JURISDICTION ROUTING ENGINE
// Pure TypeScript decision tree
// ============================================

import type {
  JurisdictionQuery,
  JurisdictionResult,
  AuthorityRecommendation,
  NotThisAuthority,
  DisputeCategory,
  AuthorityType,
  LegalAuthority,
} from "@/types/authority";
import {
  DOCUMENT_TYPE_TO_DISPUTE,
  CONSUMER_FORUM_THRESHOLDS,
  JURISDICTION_TO_STATE_CODE,
} from "./constants";
import { searchAuthorities, getAuthoritiesByType } from "./authority-db";
import { calculateFilingFee } from "./fee-calculator";

// ============================================
// PUBLIC API
// ============================================

/**
 * Main jurisdiction routing function.
 * Takes a query and returns ranked authorities with reasoning.
 */
export async function determineJurisdiction(
  query: JurisdictionQuery
): Promise<JurisdictionResult> {
  const disputeCategory = deriveDisputeCategory(
    query.document_type,
    query.counterparty_type
  );

  const stateCode = JURISDICTION_TO_STATE_CODE[query.jurisdiction] || "";

  // Build ranked recommendations using decision tree
  const recommendations: AuthorityRecommendation[] = [];
  const notThese: NotThisAuthority[] = [];

  // ---- Step 1: Primary routing by dispute category ----
  switch (disputeCategory) {
    case "consumer":
    case "telecom":
    case "ecommerce":
      await routeConsumerDispute(query, stateCode, recommendations, notThese);
      break;
    case "rental":
      await routeRentalDispute(query, stateCode, recommendations, notThese);
      break;
    case "property":
      await routePropertyDispute(query, stateCode, recommendations, notThese);
      break;
    case "employment":
      await routeEmploymentDispute(query, stateCode, recommendations, notThese);
      break;
    case "banking":
      await routeBankingDispute(query, stateCode, recommendations, notThese);
      break;
    case "insurance":
      await routeInsuranceDispute(query, stateCode, recommendations, notThese);
      break;
    case "government":
      await routeGovernmentDispute(query, stateCode, recommendations, notThese);
      break;
    case "freelance":
      await routeFreelanceDispute(query, stateCode, recommendations, notThese);
      break;
    default:
      await routeGenericDispute(query, stateCode, recommendations, notThese);
  }

  // Compute filing fees for each recommendation
  for (const rec of recommendations) {
    if (query.claim_amount) {
      const feeResult = calculateFilingFee(
        rec.authority.authority_type as AuthorityType,
        query.claim_amount
      );
      rec.filing_fee = feeResult.fee;
    }
  }

  return {
    primary: recommendations[0] || null,
    alternatives: recommendations.slice(1),
    not_these: notThese,
    dispute_category: disputeCategory,
    query,
  };
}

/**
 * Derive dispute category from document type and counterparty type.
 */
export function deriveDisputeCategory(
  documentType: string,
  counterpartyType?: string
): DisputeCategory {
  // Direct mapping
  const mapped = DOCUMENT_TYPE_TO_DISPUTE[documentType];
  if (mapped) return mapped;

  // Counterparty-based fallback
  switch (counterpartyType) {
    case "bank":
    case "nbfc":
      return "banking";
    case "insurance":
      return "insurance";
    case "builder":
      return "property";
    case "employer":
      return "employment";
    case "landlord":
      return "rental";
    case "government":
      return "government";
    default:
      return "consumer";
  }
}

// ============================================
// ROUTING FUNCTIONS BY CATEGORY
// ============================================

async function routeConsumerDispute(
  query: JurisdictionQuery,
  stateCode: string,
  recs: AuthorityRecommendation[],
  notThese: NotThisAuthority[]
) {
  const claim = query.claim_amount || 0;

  if (claim <= CONSUMER_FORUM_THRESHOLDS.district.max) {
    // District Forum
    const authorities = await getAuthoritiesByType("consumer_forum_district", stateCode);
    const best = authorities[0];
    if (best) {
      recs.push({
        authority: best,
        reasoning: `Consumer Protection Act 2019, Section 34(1) — District Forum handles claims up to ₹50 lakhs. Your claim of ₹${claim.toLocaleString("en-IN")} falls within this range.`,
        applicable_law: "Consumer Protection Act, 2019",
        applicable_section: "Section 34(1)",
        priority: 1,
        confidence: "high",
      });
    }
    // State Commission as alternative
    const stateAuth = await getAuthoritiesByType("consumer_forum_state", stateCode);
    if (stateAuth[0]) {
      recs.push({
        authority: stateAuth[0],
        reasoning: "State Commission is the appeal body if District Forum order is unsatisfactory. Appeal within 45 days.",
        applicable_law: "Consumer Protection Act, 2019",
        applicable_section: "Section 41",
        priority: 3,
        confidence: "medium",
      });
    }

    notThese.push({
      authority_type: "civil_court_district",
      authority_name: "District Civil Court",
      reason_not_applicable: "Consumer Forum has exclusive jurisdiction for consumer disputes and is faster, cheaper, and does not require a lawyer.",
    });
  } else if (claim <= CONSUMER_FORUM_THRESHOLDS.state.max) {
    const authorities = await getAuthoritiesByType("consumer_forum_state", stateCode);
    if (authorities[0]) {
      recs.push({
        authority: authorities[0],
        reasoning: `Consumer Protection Act 2019, Section 47 — State Commission for claims ₹50L–₹2Cr. Your claim of ₹${claim.toLocaleString("en-IN")} falls in range.`,
        applicable_law: "Consumer Protection Act, 2019",
        applicable_section: "Section 47",
        priority: 1,
        confidence: "high",
      });
    }
    notThese.push({
      authority_type: "consumer_forum_district",
      authority_name: "District Consumer Forum",
      reason_not_applicable: "Claim exceeds ₹50 lakhs — District Forum will reject for lack of pecuniary jurisdiction.",
    });
  } else {
    // NCDRC
    const authorities = await getAuthoritiesByType("consumer_forum_national");
    if (authorities[0]) {
      recs.push({
        authority: authorities[0],
        reasoning: `Consumer Protection Act 2019, Section 58 — NCDRC for claims above ₹2 crore. Your claim of ₹${claim.toLocaleString("en-IN")} requires national commission.`,
        applicable_law: "Consumer Protection Act, 2019",
        applicable_section: "Section 58",
        priority: 1,
        confidence: "high",
      });
    }
  }
}

async function routeRentalDispute(
  query: JurisdictionQuery,
  stateCode: string,
  recs: AuthorityRecommendation[],
  notThese: NotThisAuthority[]
) {
  // Primary: Consumer Forum (tenant treated as consumer)
  const claim = query.claim_amount || 100000;
  const forums = await getAuthoritiesByType("consumer_forum_district", stateCode);
  if (forums[0]) {
    recs.push({
      authority: forums[0],
      reasoning: "Rental disputes involving illegal clauses, unfair deposit deductions, or deficiency in housing service qualify as consumer complaints under CPA 2019.",
      applicable_law: "Consumer Protection Act, 2019",
      applicable_section: "Section 2(7) — Deficiency",
      priority: 1,
      confidence: "high",
    });
  }

  // Alternative: Rent Controller
  const rentControllers = await getAuthoritiesByType("rent_controller", stateCode);
  if (rentControllers[0]) {
    recs.push({
      authority: rentControllers[0],
      reasoning: "Rent Controller handles eviction, standard rent fixation, and tenancy right disputes under state Rent Control Act.",
      applicable_law: "State Rent Control Act",
      applicable_section: "Varies by state",
      priority: 2,
      confidence: "medium",
    });
  }

  notThese.push({
    authority_type: "rera_authority",
    authority_name: "RERA Authority",
    reason_not_applicable: "RERA handles builder/developer disputes ONLY. Tenant-landlord disputes are NOT covered by RERA.",
  });
}

async function routePropertyDispute(
  query: JurisdictionQuery,
  stateCode: string,
  recs: AuthorityRecommendation[],
  notThese: NotThisAuthority[]
) {
  // Primary: RERA
  const reraAuth = await getAuthoritiesByType("rera_authority", stateCode);
  if (reraAuth[0]) {
    recs.push({
      authority: reraAuth[0],
      reasoning: "RERA 2016 is the specialized forum for disputes involving registered builders and real estate projects. Filing is online and relatively fast (60-day resolution target).",
      applicable_law: "Real Estate (Regulation and Development) Act, 2016",
      applicable_section: "Section 31",
      priority: 1,
      confidence: "high",
    });
  }

  // Alternative: Consumer Forum
  const forums = await getAuthoritiesByType("consumer_forum_district", stateCode);
  if (forums[0]) {
    recs.push({
      authority: forums[0],
      reasoning: "Consumer Forum can handle property disputes as deficiency in service. Useful if RERA doesn't apply or after RERA order.",
      applicable_law: "Consumer Protection Act, 2019",
      applicable_section: "Section 34",
      priority: 2,
      confidence: "medium",
    });
  }

  notThese.push({
    authority_type: "civil_court_district",
    authority_name: "Civil Court",
    reason_not_applicable: "RERA is the specialized tribunal for real estate disputes. Civil Court is slower and more expensive. Use RERA before Civil Court.",
  });
}

async function routeEmploymentDispute(
  query: JurisdictionQuery,
  stateCode: string,
  recs: AuthorityRecommendation[],
  notThese: NotThisAuthority[]
) {
  // Check for PF-related clauses
  const hasPFClause = query.clause_types?.some(
    (ct) => ct.includes("pf") || ct.includes("esi") || ct.includes("benefits")
  );

  if (hasPFClause) {
    const epfo = await getAuthoritiesByType("epfo_regional", stateCode);
    if (epfo[0]) {
      recs.push({
        authority: epfo[0],
        reasoning: "EPFO Regional Commissioner handles PF-related disputes — non-remittance, withdrawal issues, incorrect contributions.",
        applicable_law: "EPF & MP Act, 1952",
        applicable_section: "Section 7A",
        priority: 1,
        confidence: "high",
      });
    }
  }

  // Labour Commissioner — primary for wage disputes
  const lc = await getAuthoritiesByType("labour_commissioner", stateCode);
  if (lc[0]) {
    recs.push({
      authority: lc[0],
      reasoning: "Labour Commissioner conducts conciliation between employer and employee. Free, no lawyer needed. First step in employment dispute resolution.",
      applicable_law: "Industrial Disputes Act, 1947",
      applicable_section: "Section 12",
      priority: hasPFClause ? 2 : 1,
      confidence: "high",
    });
  }

  // Labour Court — after conciliation fails
  const labourCourt = await getAuthoritiesByType("labour_court", stateCode);
  if (labourCourt[0]) {
    recs.push({
      authority: labourCourt[0],
      reasoning: "Labour Court hears disputes after conciliation fails. For workers covered under Industrial Disputes Act.",
      applicable_law: "Industrial Disputes Act, 1947",
      applicable_section: "Section 7",
      priority: 3,
      confidence: "medium",
    });
  }

  notThese.push({
    authority_type: "consumer_forum_district",
    authority_name: "Consumer Forum",
    reason_not_applicable: "Employment disputes are NOT consumer disputes. Labour authorities have exclusive jurisdiction.",
  });
}

async function routeBankingDispute(
  query: JurisdictionQuery,
  stateCode: string,
  recs: AuthorityRecommendation[],
  notThese: NotThisAuthority[]
) {
  // Primary: RBI Ombudsman (FREE)
  const rbi = await getAuthoritiesByType("rbi_ombudsman");
  if (rbi[0]) {
    recs.push({
      authority: rbi[0],
      reasoning: "RBI Integrated Ombudsman is FREE, fully online, and handles all bank/NBFC/payment operator complaints. File at cms.rbi.org.in. You must first complain to the bank and wait 30 days.",
      applicable_law: "RBI Integrated Ombudsman Scheme, 2021",
      applicable_section: "Clause 8",
      priority: 1,
      confidence: "high",
    });
  }

  // Alternative: Consumer Forum
  const forums = await getAuthoritiesByType("consumer_forum_district", stateCode);
  if (forums[0]) {
    recs.push({
      authority: forums[0],
      reasoning: "Consumer Forum is an alternative for banking disputes, especially if RBI Ombudsman order is unsatisfactory.",
      applicable_law: "Consumer Protection Act, 2019",
      applicable_section: "Section 34",
      priority: 2,
      confidence: "medium",
    });
  }

  notThese.push({
    authority_type: "civil_court_district",
    authority_name: "Civil Court",
    reason_not_applicable: "Banking disputes have specialized forums (RBI Ombudsman, Consumer Forum). Civil Court is slower.",
  });
}

async function routeInsuranceDispute(
  query: JurisdictionQuery,
  stateCode: string,
  recs: AuthorityRecommendation[],
  notThese: NotThisAuthority[]
) {
  const ombudsmen = await getAuthoritiesByType("insurance_ombudsman", stateCode);
  if (ombudsmen[0]) {
    recs.push({
      authority: ombudsmen[0],
      reasoning: "Insurance Ombudsman handles complaints against insurance companies. FREE, no lawyer needed. Must first complain to insurer and wait 30 days.",
      applicable_law: "Insurance Ombudsman Rules, 2017",
      applicable_section: "Rule 13",
      priority: 1,
      confidence: "high",
    });
  }

  const forums = await getAuthoritiesByType("consumer_forum_district", stateCode);
  if (forums[0]) {
    recs.push({
      authority: forums[0],
      reasoning: "Consumer Forum handles insurance disputes as deficiency in service. Alternative to Insurance Ombudsman.",
      applicable_law: "Consumer Protection Act, 2019",
      applicable_section: "Section 34",
      priority: 2,
      confidence: "medium",
    });
  }
}

async function routeGovernmentDispute(
  query: JurisdictionQuery,
  stateCode: string,
  recs: AuthorityRecommendation[],
  notThese: NotThisAuthority[]
) {
  const cat = await getAuthoritiesByType("cat_bench", stateCode);
  if (cat[0]) {
    recs.push({
      authority: cat[0],
      reasoning: "Central Administrative Tribunal handles disputes of central government employees. Exclusive jurisdiction.",
      applicable_law: "Administrative Tribunals Act, 1985",
      applicable_section: "Section 14",
      priority: 1,
      confidence: "high",
    });
  }

  notThese.push({
    authority_type: "labour_court",
    authority_name: "Labour Court",
    reason_not_applicable: "CAT has exclusive jurisdiction for central government employment disputes. Labour Court does not apply.",
  });
}

async function routeFreelanceDispute(
  query: JurisdictionQuery,
  stateCode: string,
  recs: AuthorityRecommendation[],
  notThese: NotThisAuthority[]
) {
  const forums = await getAuthoritiesByType("consumer_forum_district", stateCode);
  if (forums[0]) {
    recs.push({
      authority: forums[0],
      reasoning: "Freelance payment disputes can be filed at Consumer Forum as deficiency in service.",
      applicable_law: "Consumer Protection Act, 2019",
      applicable_section: "Section 2(7)",
      priority: 1,
      confidence: "medium",
    });
  }

  // Civil Court as fallback
  const civil = await getAuthoritiesByType("civil_court_district", stateCode);
  if (civil[0]) {
    recs.push({
      authority: civil[0],
      reasoning: "Civil Court handles breach of contract claims for service agreements. Requires lawyer.",
      applicable_law: "Code of Civil Procedure, 1908",
      applicable_section: "Section 9",
      priority: 2,
      confidence: "medium",
    });
  }
}

async function routeGenericDispute(
  query: JurisdictionQuery,
  stateCode: string,
  recs: AuthorityRecommendation[],
  notThese: NotThisAuthority[]
) {
  // Default to consumer forum for unknown types
  const forums = await getAuthoritiesByType("consumer_forum_district", stateCode);
  if (forums[0]) {
    recs.push({
      authority: forums[0],
      reasoning: "Consumer Forum has broad jurisdiction for service deficiency and unfair trade practices. A good starting point for most disputes.",
      applicable_law: "Consumer Protection Act, 2019",
      applicable_section: "Section 34",
      priority: 1,
      confidence: "low",
    });
  }

  const civil = await getAuthoritiesByType("civil_court_district", stateCode);
  if (civil[0]) {
    recs.push({
      authority: civil[0],
      reasoning: "Civil Court has residuary jurisdiction for all civil disputes. Requires lawyer and court fees.",
      applicable_law: "Code of Civil Procedure, 1908",
      applicable_section: "Section 9",
      priority: 2,
      confidence: "low",
    });
  }
}
