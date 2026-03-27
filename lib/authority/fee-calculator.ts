// ============================================
// CLAUSEWALL — FILING FEE CALCULATOR
// ============================================

import type { AuthorityType, FeeCalculationResult } from "@/types/authority";
import { CONSUMER_FORUM_FEES } from "./constants";

/**
 * Calculate filing fee for a given authority type and claim amount.
 */
export function calculateFilingFee(
  authorityType: AuthorityType,
  claimAmount: number
): FeeCalculationResult {
  switch (authorityType) {
    case "consumer_forum_district":
      return computeConsumerFee("district", claimAmount);
    case "consumer_forum_state":
      return computeConsumerFee("state", claimAmount);
    case "consumer_forum_national":
      return computeConsumerFee("national", claimAmount);
    case "rbi_ombudsman":
    case "insurance_ombudsman":
    case "banking_ombudsman":
      return { fee: 0, breakdown: [{ item: "Filing fee", amount: 0 }], waiver_available: true, waiver_conditions: "Free — no filing fee required", payment_methods: [] };
    case "labour_commissioner":
    case "labour_court":
      return { fee: 0, breakdown: [{ item: "Filing fee", amount: 0 }], waiver_available: true, waiver_conditions: "Free — no fee for conciliation/adjudication", payment_methods: [] };
    case "epfo_regional":
    case "esic_regional":
      return { fee: 0, breakdown: [{ item: "Filing fee", amount: 0 }], waiver_available: true, waiver_conditions: "Free", payment_methods: [] };
    case "rera_authority":
      return computeRERAFee(claimAmount);
    case "civil_court_district":
    case "small_causes_court":
      return computeCivilCourtFee(claimAmount);
    default:
      return { fee: 0, breakdown: [], waiver_available: false, waiver_conditions: "Fee structure unavailable — check with authority directly", payment_methods: [] };
  }
}

function computeConsumerFee(
  level: "district" | "state" | "national",
  claimAmount: number
): FeeCalculationResult {
  const tiers = CONSUMER_FORUM_FEES[level];
  let fee = 0;
  for (const tier of tiers) {
    if (claimAmount >= tier.claim_min && (tier.claim_max === null || claimAmount <= tier.claim_max)) {
      fee = tier.fee;
      break;
    }
  }
  return {
    fee,
    breakdown: [{ item: `Consumer Forum (${level}) filing fee`, amount: fee }],
    waiver_available: true,
    waiver_conditions: "BPL card holders, legal aid eligible persons — apply for fee waiver with DLSA certificate",
    payment_methods: ["Court Fee Stamp", "Demand Draft", "Online Payment (e-Daakhil)"],
  };
}

function computeRERAFee(claimAmount: number): FeeCalculationResult {
  // RERA fees vary by state; using MahaRERA as reference
  const fee = claimAmount <= 500000 ? 1000 : claimAmount <= 2000000 ? 2000 : 5000;
  return {
    fee,
    breakdown: [{ item: "RERA complaint fee", amount: fee }],
    waiver_available: false,
    waiver_conditions: "No fee waiver generally available for RERA complaints",
    payment_methods: ["Online Payment", "Demand Draft"],
  };
}

function computeCivilCourtFee(claimAmount: number): FeeCalculationResult {
  // Ad-valorem court fee (~1-7.5% depending on state)
  const rate = claimAmount <= 500000 ? 0.01 : claimAmount <= 2500000 ? 0.03 : 0.05;
  const fee = Math.round(claimAmount * rate);
  return {
    fee,
    breakdown: [
      { item: "Ad valorem court fee", amount: fee },
      { item: "Process fee (approximate)", amount: 500 },
    ],
    waiver_available: true,
    waiver_conditions: "Indigent person can file as pauper under Order 33 CPC — court fee waived",
    payment_methods: ["Court Fee Stamp", "E-Court Fee"],
  };
}
