// ============================================
// COURT FEE CALCULATOR
// Exact fee schedules per Indian law
// ============================================

import type { AuthorityType, FeeCalculation } from '@/types';

/**
 * Calculate filing fee based on authority type, claim amount, and state.
 * Uses actual Indian fee schedules (CPA 2019 Rule 7, etc.)
 */
export function calculateFee(
  authorityType: AuthorityType,
  claimAmount: number,
  state: string
): FeeCalculation {
  switch (authorityType) {
    case 'consumer_forum_district':
      return calculateConsumerForumDistrictFee(claimAmount);
    case 'consumer_forum_state':
      return calculateConsumerForumStateFee(claimAmount);
    case 'consumer_forum_national':
      return calculateConsumerForumNationalFee(claimAmount);
    case 'rbi_ombudsman':
      return makeFreeCalculation(authorityType, claimAmount, 'RBI Integrated Ombudsman', [
        'RBI Ombudsman complaints are completely FREE',
        'No fee at any stage',
        'Can be filed online at cms.rbi.org.in',
      ]);
    case 'insurance_ombudsman':
      return makeFreeCalculation(authorityType, claimAmount, 'Insurance Ombudsman', [
        'Insurance Ombudsman complaints are completely FREE',
        'No fee required at any stage',
        'File online at igms.irda.gov.in or visit regional office',
      ]);
    case 'irdai':
      return makeFreeCalculation(authorityType, claimAmount, 'IRDAI', [
        'IRDAI complaints are free to file',
        'Use the IGMS portal for online filing',
      ]);
    case 'labour_commissioner':
      return makeFreeCalculation(authorityType, claimAmount, 'Labour Commissioner', [
        'Labour complaints are FREE to file',
        'No court fee required',
        'Visit the Labour Commissioner office with written complaint',
      ]);
    case 'trai':
      return makeFreeCalculation(authorityType, claimAmount, 'TRAI', [
        'TRAI complaints are free',
        'File via trai.gov.in portal',
      ]);
    case 'ccpa':
      return makeFreeCalculation(authorityType, claimAmount, 'CCPA', [
        'CCPA complaints are free',
        'File at consumerhelpline.gov.in',
        'Call 1800-11-4000 (toll-free)',
      ]);
    case 'legal_aid':
      return makeFreeCalculation(authorityType, claimAmount, 'Legal Services Authority', [
        'Legal aid is completely FREE for eligible persons',
        'Eligibility: annual income below ₹3 lakh (₹5 lakh in some states)',
        'SC/ST, women, disabled persons, and senior citizens are eligible regardless of income',
      ]);
    case 'rera_state':
      return calculateRERAFee(claimAmount, state);
    case 'tdsat':
      return calculateTDSATFee(claimAmount);
    case 'industrial_tribunal':
      return makeFreeCalculation(authorityType, claimAmount, 'Industrial Tribunal', [
        'No fee for most industrial disputes',
        'Application fee may apply in some states (₹50-₹500)',
      ]);
    default:
      return calculateConsumerForumDistrictFee(claimAmount);
  }
}

/**
 * Consumer Forum District — CPA 2019 Rule 7
 */
function calculateConsumerForumDistrictFee(claimAmount: number): FeeCalculation {
  let fee = 0;
  let description = '';

  if (claimAmount <= 500000) {
    fee = 0;
    description = 'Up to ₹5 lakh: NIL';
  } else if (claimAmount <= 1000000) {
    fee = 200;
    description = '₹5 lakh to ₹10 lakh: ₹200';
  } else if (claimAmount <= 2000000) {
    fee = 400;
    description = '₹10 lakh to ₹20 lakh: ₹400';
  } else if (claimAmount <= 5000000) {
    fee = 1000;
    description = '₹20 lakh to ₹50 lakh: ₹1,000';
  } else if (claimAmount <= 10000000) {
    fee = 2000;
    description = '₹50 lakh to ₹1 crore: ₹2,000';
  } else {
    fee = 2500;
    description = 'Above ₹1 crore (redirected to State Commission)';
  }

  return {
    authority_type: 'consumer_forum_district',
    claim_amount: claimAmount,
    filing_fee: fee,
    is_free: fee === 0,
    fee_breakdown: [{ description, amount: fee }],
    payment_modes: fee === 0 ? ['No payment required'] : ['Demand Draft', 'Online Payment', 'Court Fee Stamp'],
    payable_to: fee === 0 ? 'N/A' : 'Registrar, District Consumer Disputes Redressal Forum',
    notes: [
      'Fee schedule as per Consumer Protection (Consumer Disputes Redressal Commission) Rules, 2020',
      'Senior citizens may get 50% fee reduction in some states',
      'BPL card holders are exempt from fees',
      fee === 0 ? '✅ Your complaint is FREE to file!' : `Filing fee: ₹${fee.toLocaleString('en-IN')}`,
    ],
  };
}

/**
 * Consumer Forum State Commission — CPA 2019 Rule 7
 */
function calculateConsumerForumStateFee(claimAmount: number): FeeCalculation {
  let fee = 0;
  let description = '';

  if (claimAmount <= 10000000) {
    fee = 2500;
    description = 'Up to ₹2 crore: ₹2,500 (if claim ≤ ₹1 crore, file at District Forum)';
  } else if (claimAmount <= 20000000) {
    fee = 2500;
    description = '₹1 crore to ₹2 crore: ₹2,500';
  } else if (claimAmount <= 40000000) {
    fee = 3000;
    description = '₹2 crore to ₹4 crore: ₹3,000';
  } else if (claimAmount <= 60000000) {
    fee = 4000;
    description = '₹4 crore to ₹6 crore: ₹4,000';
  } else if (claimAmount <= 80000000) {
    fee = 5000;
    description = '₹6 crore to ₹8 crore: ₹5,000';
  } else if (claimAmount <= 100000000) {
    fee = 6000;
    description = '₹8 crore to ₹10 crore: ₹6,000';
  } else {
    fee = 7500;
    description = 'Above ₹10 crore (redirected to National Commission)';
  }

  return {
    authority_type: 'consumer_forum_state',
    claim_amount: claimAmount,
    filing_fee: fee,
    is_free: false,
    fee_breakdown: [{ description, amount: fee }],
    payment_modes: ['Demand Draft', 'Online Payment via e-Daakhil'],
    payable_to: 'Registrar, State Consumer Disputes Redressal Commission',
    notes: [
      'Fee as per CPA 2019 Rule 7',
      'File via e-Daakhil portal: https://edaakhil.nic.in',
    ],
  };
}

/**
 * National Consumer Commission — CPA 2019 Rule 7
 */
function calculateConsumerForumNationalFee(claimAmount: number): FeeCalculation {
  return {
    authority_type: 'consumer_forum_national',
    claim_amount: claimAmount,
    filing_fee: 7500,
    is_free: false,
    fee_breakdown: [{ description: 'Claims above ₹10 crore: ₹7,500', amount: 7500 }],
    payment_modes: ['Demand Draft', 'Online Payment via e-Daakhil'],
    payable_to: 'Registrar, National Consumer Disputes Redressal Commission',
    notes: [
      'Fee as per CPA 2019 Rule 7',
      'NCDRC handles claims above ₹10 crore and appeals from State Commissions',
      'File via e-Daakhil portal: https://edaakhil.nic.in',
    ],
  };
}

/**
 * RERA fee — varies by state
 */
function calculateRERAFee(claimAmount: number, state: string): FeeCalculation {
  // State-specific RERA fees (known values)
  const reraFees: Record<string, { fee: number; note: string }> = {
    MH: { fee: 5000, note: 'MahaRERA filing fee: ₹5,000 for individuals' },
    KA: { fee: 5000, note: 'Karnataka RERA filing fee: ₹5,000' },
    DL: { fee: 1000, note: 'Delhi RERA filing fee: ₹1,000' },
    UP: { fee: 5000, note: 'UP RERA filing fee: ₹5,000' },
    TN: { fee: 1000, note: 'Tamil Nadu RERA filing fee: ₹1,000' },
    GJ: { fee: 5000, note: 'Gujarat RERA filing fee: ₹5,000' },
    TS: { fee: 1000, note: 'Telangana RERA filing fee: ₹1,000' },
    RJ: { fee: 1000, note: 'Rajasthan RERA filing fee: ₹1,000' },
    HR: { fee: 1000, note: 'Haryana RERA filing fee: ₹1,000' },
  };

  const stateInfo = reraFees[state] || { fee: 5000, note: `RERA filing fee: ₹5,000 (estimated — verify with your state RERA)` };

  return {
    authority_type: 'rera_state',
    claim_amount: claimAmount,
    filing_fee: stateInfo.fee,
    is_free: false,
    fee_breakdown: [{ description: stateInfo.note, amount: stateInfo.fee }],
    payment_modes: ['Online Payment', 'Demand Draft'],
    payable_to: 'State RERA Authority',
    notes: [
      stateInfo.note,
      'RERA handles complaints related to real estate projects registered under RERA Act 2016',
      'File via your state RERA portal',
    ],
  };
}

/**
 * TDSAT fee
 */
function calculateTDSATFee(claimAmount: number): FeeCalculation {
  // TDSAT has a fee schedule based on claim amount
  let fee = 0;
  if (claimAmount <= 1000000) fee = 1000;
  else if (claimAmount <= 5000000) fee = 5000;
  else fee = 10000;

  return {
    authority_type: 'tdsat',
    claim_amount: claimAmount,
    filing_fee: fee,
    is_free: false,
    fee_breakdown: [{ description: `TDSAT filing fee: ₹${fee.toLocaleString('en-IN')}`, amount: fee }],
    payment_modes: ['Demand Draft', 'Online Payment'],
    payable_to: 'Registrar, TDSAT',
    notes: [
      'TDSAT handles telecom and broadcasting disputes',
      'Appeals against TRAI orders',
    ],
  };
}

/**
 * Helper: create a free fee calculation
 */
function makeFreeCalculation(
  authorityType: AuthorityType,
  claimAmount: number,
  authorityName: string,
  notes: string[]
): FeeCalculation {
  return {
    authority_type: authorityType,
    claim_amount: claimAmount,
    filing_fee: 0,
    is_free: true,
    fee_breakdown: [{ description: `${authorityName}: FREE (no fee)`, amount: 0 }],
    payment_modes: ['No payment required'],
    payable_to: 'N/A',
    notes,
  };
}
