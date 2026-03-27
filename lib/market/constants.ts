// ============================================
// MARKET INTELLIGENCE CONSTANTS
// City/state mappings, clause-to-benchmark mapping, seed data
// ============================================

import type { IndianState, CityNormalization, SeedBenchmarks, BenchmarkType } from '@/types/market';

// ============================================
// CLAUSE TYPE → BENCHMARK TYPE MAPPING
// ============================================

export const CLAUSE_TO_BENCHMARK: Record<string, BenchmarkType> = {
  security_deposit: 'security_deposit',
  advance_rent: 'advance_rent',
  notice_period: 'notice_period',
  lock_in_period: 'lock_in_period',
  penalties: 'penalty_amount',
  penalty_clause: 'penalty_amount',
  early_termination: 'penalty_amount',
  late_fees: 'late_payment_penalty',
  late_payment: 'late_payment_penalty',
  interest_rate: 'interest_rate',
  maintenance_charges: 'maintenance_charge',
  rent_escalation: 'rent_increase_cap',
  rent_payment: 'rent_increase_cap',
  non_compete: 'non_compete_duration',
  non_solicitation: 'non_compete_duration',
  termination_notice: 'termination_notice',
  termination_clause: 'termination_notice',
  cancellation_refund: 'refund_period',
  refund_policy: 'refund_period',
  liability_waiver: 'liability_cap',
  liability_limitation: 'liability_cap',
  indemnification: 'liability_cap',
  renewal_terms: 'auto_renewal_period',
  auto_renewal: 'auto_renewal_period',
  brokerage: 'brokerage_fee',
  processing_fees: 'brokerage_fee',
};

// ============================================
// VALUE UNITS — Which direction is "worse" for the consumer
// ============================================

export const HIGHER_IS_WORSE: Record<BenchmarkType, boolean> = {
  security_deposit: true,     // higher deposit = worse for tenant
  notice_period: true,        // longer notice = worse for employee/tenant
  lock_in_period: true,       // longer lock-in = worse
  penalty_amount: true,       // higher penalty = worse
  interest_rate: true,        // higher rate = worse
  maintenance_charge: true,   // higher charge = worse
  rent_increase_cap: true,    // higher escalation = worse
  non_compete_duration: true, // longer non-compete = worse
  non_compete_radius: true,   // wider radius = worse
  termination_notice: true,   // longer notice to give = worse
  refund_period: false,       // longer refund period = BETTER
  liability_cap: false,       // higher liability cap = BETTER (more protection)
  auto_renewal_period: true,  // longer auto-renewal = worse
  late_payment_penalty: true, // higher penalty = worse
  advance_rent: true,         // more advance = worse
  brokerage_fee: true,        // higher fee = worse
  overall_risk_score: true,   // higher risk = worse
  power_balance_skew: true,   // higher skew = worse
  illegal_clause_ratio: true, // higher ratio = worse
  clause_count: false,        // neutral
};

// ============================================
// EXPECTED UNITS PER BENCHMARK TYPE
// ============================================

export const EXPECTED_UNITS: Record<BenchmarkType, string[]> = {
  security_deposit: ['months_of_rent', 'months', 'rupees'],
  notice_period: ['days', 'months'],
  lock_in_period: ['months', 'years'],
  penalty_amount: ['rupees', 'months_of_rent', 'percent'],
  interest_rate: ['percent', 'percent_per_annum'],
  maintenance_charge: ['rupees', 'rupees_per_month'],
  rent_increase_cap: ['percent', 'percent_per_year'],
  non_compete_duration: ['months', 'years'],
  non_compete_radius: ['km', 'miles'],
  termination_notice: ['days', 'months'],
  refund_period: ['days', 'months'],
  liability_cap: ['rupees', 'percent'],
  auto_renewal_period: ['months', 'years'],
  late_payment_penalty: ['rupees', 'percent', 'rupees_per_day'],
  advance_rent: ['months', 'rupees'],
  brokerage_fee: ['months_of_rent', 'rupees', 'percent'],
  overall_risk_score: ['score'],
  power_balance_skew: ['percent'],
  illegal_clause_ratio: ['percent'],
  clause_count: ['count'],
};

// ============================================
// OUTLIER THRESHOLDS
// ============================================

export const OUTLIER_THRESHOLDS: Partial<Record<BenchmarkType, { min: number; max: number }>> = {
  security_deposit: { min: 0, max: 24 },        // months
  notice_period: { min: 0, max: 365 },           // days
  lock_in_period: { min: 0, max: 60 },           // months
  interest_rate: { min: 0, max: 50 },            // percent
  non_compete_duration: { min: 0, max: 60 },     // months
  rent_increase_cap: { min: 0, max: 50 },        // percent
  overall_risk_score: { min: 0, max: 100 },      // score
};

// ============================================
// MINIMUM SAMPLE COUNTS
// ============================================

export const MINIMUM_SAMPLES = {
  national: 10,
  state: 5,
  city: 5,
  area: 3,
  industry: 5,
  entity: 2,
  document_type: 5,
  lender_category: 5,
} as const;

// ============================================
// INDIA STATE CODES → GeoJSON/TopoJSON IDs
// ============================================

export const INDIAN_STATES: Record<string, IndianState> = {
  andhra_pradesh: { name: 'Andhra Pradesh', geo_id: 'IN-AP', code: 'AP', major_cities: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati'] },
  arunachal_pradesh: { name: 'Arunachal Pradesh', geo_id: 'IN-AR', code: 'AR', major_cities: ['Itanagar'] },
  assam: { name: 'Assam', geo_id: 'IN-AS', code: 'AS', major_cities: ['Guwahati', 'Silchar', 'Dibrugarh'] },
  bihar: { name: 'Bihar', geo_id: 'IN-BR', code: 'BR', major_cities: ['Patna', 'Gaya', 'Muzaffarpur'] },
  chhattisgarh: { name: 'Chhattisgarh', geo_id: 'IN-CT', code: 'CT', major_cities: ['Raipur', 'Bhilai', 'Bilaspur'] },
  goa: { name: 'Goa', geo_id: 'IN-GA', code: 'GA', major_cities: ['Panaji', 'Margao', 'Vasco da Gama'] },
  gujarat: { name: 'Gujarat', geo_id: 'IN-GJ', code: 'GJ', major_cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'] },
  haryana: { name: 'Haryana', geo_id: 'IN-HR', code: 'HR', major_cities: ['Gurugram', 'Faridabad', 'Karnal', 'Ambala'] },
  himachal_pradesh: { name: 'Himachal Pradesh', geo_id: 'IN-HP', code: 'HP', major_cities: ['Shimla', 'Dharamshala', 'Manali'] },
  jharkhand: { name: 'Jharkhand', geo_id: 'IN-JH', code: 'JH', major_cities: ['Ranchi', 'Jamshedpur', 'Dhanbad'] },
  karnataka: { name: 'Karnataka', geo_id: 'IN-KA', code: 'KA', major_cities: ['Bangalore', 'Mysore', 'Hubli', 'Mangalore'] },
  kerala: { name: 'Kerala', geo_id: 'IN-KL', code: 'KL', major_cities: ['Kochi', 'Thiruvananthapuram', 'Kozhikode'] },
  madhya_pradesh: { name: 'Madhya Pradesh', geo_id: 'IN-MP', code: 'MP', major_cities: ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur'] },
  maharashtra: { name: 'Maharashtra', geo_id: 'IN-MH', code: 'MH', major_cities: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane'] },
  manipur: { name: 'Manipur', geo_id: 'IN-MN', code: 'MN', major_cities: ['Imphal'] },
  meghalaya: { name: 'Meghalaya', geo_id: 'IN-ML', code: 'ML', major_cities: ['Shillong'] },
  mizoram: { name: 'Mizoram', geo_id: 'IN-MZ', code: 'MZ', major_cities: ['Aizawl'] },
  nagaland: { name: 'Nagaland', geo_id: 'IN-NL', code: 'NL', major_cities: ['Kohima', 'Dimapur'] },
  odisha: { name: 'Odisha', geo_id: 'IN-OR', code: 'OR', major_cities: ['Bhubaneswar', 'Cuttack', 'Rourkela'] },
  punjab: { name: 'Punjab', geo_id: 'IN-PB', code: 'PB', major_cities: ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar'] },
  rajasthan: { name: 'Rajasthan', geo_id: 'IN-RJ', code: 'RJ', major_cities: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota'] },
  sikkim: { name: 'Sikkim', geo_id: 'IN-SK', code: 'SK', major_cities: ['Gangtok'] },
  tamil_nadu: { name: 'Tamil Nadu', geo_id: 'IN-TN', code: 'TN', major_cities: ['Chennai', 'Coimbatore', 'Madurai', 'Salem'] },
  telangana: { name: 'Telangana', geo_id: 'IN-TG', code: 'TG', major_cities: ['Hyderabad', 'Warangal', 'Nizamabad'] },
  tripura: { name: 'Tripura', geo_id: 'IN-TR', code: 'TR', major_cities: ['Agartala'] },
  uttar_pradesh: { name: 'Uttar Pradesh', geo_id: 'IN-UP', code: 'UP', major_cities: ['Lucknow', 'Noida', 'Kanpur', 'Agra', 'Varanasi'] },
  uttarakhand: { name: 'Uttarakhand', geo_id: 'IN-UT', code: 'UT', major_cities: ['Dehradun', 'Haridwar', 'Rishikesh'] },
  west_bengal: { name: 'West Bengal', geo_id: 'IN-WB', code: 'WB', major_cities: ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri'] },
  // Union Territories
  andaman_nicobar: { name: 'Andaman & Nicobar Islands', geo_id: 'IN-AN', code: 'AN', major_cities: ['Port Blair'] },
  chandigarh: { name: 'Chandigarh', geo_id: 'IN-CH', code: 'CH', major_cities: ['Chandigarh'] },
  dadra_nagar_haveli: { name: 'Dadra & Nagar Haveli and Daman & Diu', geo_id: 'IN-DN', code: 'DN', major_cities: ['Silvassa', 'Daman'] },
  delhi: { name: 'Delhi', geo_id: 'IN-DL', code: 'DL', major_cities: ['New Delhi', 'Delhi'] },
  jammu_kashmir: { name: 'Jammu & Kashmir', geo_id: 'IN-JK', code: 'JK', major_cities: ['Srinagar', 'Jammu'] },
  ladakh: { name: 'Ladakh', geo_id: 'IN-LA', code: 'LA', major_cities: ['Leh'] },
  lakshadweep: { name: 'Lakshadweep', geo_id: 'IN-LD', code: 'LD', major_cities: ['Kavaratti'] },
  puducherry: { name: 'Puducherry', geo_id: 'IN-PY', code: 'PY', major_cities: ['Puducherry'] },
};

// ============================================
// CITY NORMALIZATION — Top 50+ Indian cities
// ============================================

export const CITY_NORMALIZATIONS: CityNormalization[] = [
  { canonical: 'mumbai', state: 'maharashtra', aliases: ['bombay', 'bom', 'mumbai'] },
  { canonical: 'delhi', state: 'delhi', aliases: ['new delhi', 'ncr', 'delhi ncr', 'national capital region'] },
  { canonical: 'bangalore', state: 'karnataka', aliases: ['bengaluru', 'blr', 'banglore', 'bangaluru'] },
  { canonical: 'hyderabad', state: 'telangana', aliases: ['hyd', 'cyberabad'] },
  { canonical: 'chennai', state: 'tamil_nadu', aliases: ['madras', 'maa'] },
  { canonical: 'kolkata', state: 'west_bengal', aliases: ['calcutta', 'ccu'] },
  { canonical: 'pune', state: 'maharashtra', aliases: ['poona', 'puna'] },
  { canonical: 'ahmedabad', state: 'gujarat', aliases: ['amdavad', 'ahmdabad', 'amadavad'] },
  { canonical: 'jaipur', state: 'rajasthan', aliases: ['jaypur'] },
  { canonical: 'lucknow', state: 'uttar_pradesh', aliases: ['lko', 'lakhnau'] },
  { canonical: 'surat', state: 'gujarat', aliases: [] },
  { canonical: 'kanpur', state: 'uttar_pradesh', aliases: ['cawnpore'] },
  { canonical: 'nagpur', state: 'maharashtra', aliases: [] },
  { canonical: 'indore', state: 'madhya_pradesh', aliases: [] },
  { canonical: 'thane', state: 'maharashtra', aliases: ['thanae'] },
  { canonical: 'bhopal', state: 'madhya_pradesh', aliases: [] },
  { canonical: 'visakhapatnam', state: 'andhra_pradesh', aliases: ['vizag', 'visakha', 'vishakapatnam'] },
  { canonical: 'vadodara', state: 'gujarat', aliases: ['baroda'] },
  { canonical: 'gurugram', state: 'haryana', aliases: ['gurgaon', 'ggn'] },
  { canonical: 'noida', state: 'uttar_pradesh', aliases: ['greater noida', 'noida extension'] },
  { canonical: 'chandigarh', state: 'chandigarh', aliases: ['chd'] },
  { canonical: 'coimbatore', state: 'tamil_nadu', aliases: ['kovai'] },
  { canonical: 'kochi', state: 'kerala', aliases: ['cochin', 'ernakulam'] },
  { canonical: 'patna', state: 'bihar', aliases: [] },
  { canonical: 'bhubaneswar', state: 'odisha', aliases: [] },
  { canonical: 'thiruvananthapuram', state: 'kerala', aliases: ['trivandrum', 'tvm'] },
  { canonical: 'guwahati', state: 'assam', aliases: ['gauhati'] },
  { canonical: 'ranchi', state: 'jharkhand', aliases: [] },
  { canonical: 'raipur', state: 'chhattisgarh', aliases: [] },
  { canonical: 'dehradun', state: 'uttarakhand', aliases: ['doon'] },
  { canonical: 'mysore', state: 'karnataka', aliases: ['mysuru'] },
  { canonical: 'hubli', state: 'karnataka', aliases: ['hubballi', 'hubli-dharwad'] },
  { canonical: 'mangalore', state: 'karnataka', aliases: ['mangaluru'] },
  { canonical: 'nashik', state: 'maharashtra', aliases: ['nasik'] },
  { canonical: 'faridabad', state: 'haryana', aliases: [] },
  { canonical: 'ghaziabad', state: 'uttar_pradesh', aliases: [] },
  { canonical: 'agra', state: 'uttar_pradesh', aliases: [] },
  { canonical: 'varanasi', state: 'uttar_pradesh', aliases: ['banaras', 'benares', 'kashi'] },
  { canonical: 'madurai', state: 'tamil_nadu', aliases: [] },
  { canonical: 'vijayawada', state: 'andhra_pradesh', aliases: ['bezawada'] },
  { canonical: 'jamshedpur', state: 'jharkhand', aliases: ['tatanagar'] },
  { canonical: 'rajkot', state: 'gujarat', aliases: [] },
  { canonical: 'amritsar', state: 'punjab', aliases: [] },
  { canonical: 'jodhpur', state: 'rajasthan', aliases: [] },
  { canonical: 'udaipur', state: 'rajasthan', aliases: [] },
  { canonical: 'ludhiana', state: 'punjab', aliases: [] },
  { canonical: 'navi mumbai', state: 'maharashtra', aliases: ['new bombay'] },
  { canonical: 'gwalior', state: 'madhya_pradesh', aliases: [] },
  { canonical: 'shimla', state: 'himachal_pradesh', aliases: ['simla'] },
  { canonical: 'panaji', state: 'goa', aliases: ['panjim'] },
];

// ============================================
// SEED BENCHMARK DATA — From public/statutory sources
// ============================================

export const SEED_BENCHMARKS: SeedBenchmarks = {
  security_deposit: {
    national: { median: 2, unit: 'months_of_rent', source: 'Model Tenancy Act 2021 recommends max 2 months for residential', p25: 1, p75: 3 },
    maharashtra: { median: 3, unit: 'months_of_rent', source: 'Maharashtra common practice (no statutory cap in old Rent Control Act)', p25: 2, p75: 4 },
    karnataka: { median: 10, unit: 'months_of_rent', source: 'Karnataka common practice — notoriously high deposits in Bangalore', p25: 6, p75: 10 },
    delhi: { median: 2, unit: 'months_of_rent', source: 'Delhi Rent Control Act — typically 1-3 months', p25: 1, p75: 3 },
    tamil_nadu: { median: 3, unit: 'months_of_rent', source: 'Tamil Nadu common practice', p25: 2, p75: 6 },
    telangana: { median: 2, unit: 'months_of_rent', source: 'Telangana common practice', p25: 1, p75: 3 },
    gujarat: { median: 2, unit: 'months_of_rent', source: 'Gujarat common practice', p25: 1, p75: 3 },
    west_bengal: { median: 2, unit: 'months_of_rent', source: 'West Bengal common practice', p25: 1, p75: 3 },
  },
  notice_period: {
    national: { median: 30, unit: 'days', source: 'Standard across most employment contracts', p25: 15, p75: 60 },
    it_sector: { median: 30, unit: 'days', source: 'Standard IT industry practice — shifting from 90 to 30 day norms', p25: 15, p75: 60 },
    banking: { median: 90, unit: 'days', source: 'Common in BFSI sector', p25: 30, p75: 90 },
    consulting: { median: 30, unit: 'days', source: 'Standard consulting sector practice', p25: 15, p75: 60 },
    manufacturing: { median: 30, unit: 'days', source: 'Manufacturing sector standard', p25: 15, p75: 30 },
    startup: { median: 15, unit: 'days', source: 'Startup ecosystem typically has shorter notice', p25: 7, p75: 30 },
  },
  lock_in_period: {
    national: { median: 6, unit: 'months', source: 'Common rental lock-in period in India', p25: 3, p75: 11 },
    rental: { median: 6, unit: 'months', source: 'Model Tenancy Act suggests maximum 6 months mutual lock-in', p25: 3, p75: 11 },
  },
  interest_rate: {
    personal_loan_bank: { median: 10.5, unit: 'percent', source: 'RBI data — PSU/Private bank personal loan rates 2024', p25: 9.5, p75: 13 },
    personal_loan_nbfc: { median: 14, unit: 'percent', source: 'RBI data — NBFC personal loan rates 2024', p25: 12, p75: 18 },
    home_loan: { median: 8.5, unit: 'percent', source: 'RBI/SBI benchmark home loan rate 2024', p25: 8.2, p75: 9.5 },
    car_loan: { median: 9, unit: 'percent', source: 'Average car loan rate 2024', p25: 7.5, p75: 11 },
    education_loan: { median: 9.5, unit: 'percent', source: 'Average education loan rate 2024', p25: 8, p75: 11 },
    credit_card: { median: 36, unit: 'percent', source: 'Average credit card APR in India', p25: 30, p75: 42 },
    microfinance: { median: 22, unit: 'percent', source: 'RBI-regulated MFI rates', p25: 18, p75: 26 },
  },
  non_compete_duration: {
    national: { median: 6, unit: 'months', source: 'Section 27 of Indian Contract Act makes most post-employment non-competes void', p25: 3, p75: 12 },
  },
  rent_increase_cap: {
    national: { median: 5, unit: 'percent', source: 'Common annual rent escalation in India', p25: 5, p75: 10 },
    maharashtra: { median: 5, unit: 'percent', source: 'Maharashtra standard rent escalation', p25: 5, p75: 8 },
    karnataka: { median: 5, unit: 'percent', source: 'Karnataka standard rent escalation', p25: 5, p75: 10 },
    delhi: { median: 5, unit: 'percent', source: 'Delhi standard rent escalation', p25: 5, p75: 10 },
  },
  late_payment_penalty: {
    national: { median: 50, unit: 'rupees_per_day', source: 'Common late rent penalty range', p25: 20, p75: 100 },
  },
  termination_notice: {
    national: { median: 30, unit: 'days', source: 'Standard termination notice for rental agreements', p25: 15, p75: 60 },
  },
  advance_rent: {
    national: { median: 1, unit: 'months', source: 'Standard 1 month advance rent', p25: 1, p75: 2 },
  },
};

// ============================================
// BENCHMARK TYPE DISPLAY LABELS
// ============================================

export const BENCHMARK_TYPE_LABELS: Record<BenchmarkType, string> = {
  security_deposit: 'Security Deposit',
  notice_period: 'Notice Period',
  lock_in_period: 'Lock-in Period',
  penalty_amount: 'Penalty Amount',
  interest_rate: 'Interest Rate',
  maintenance_charge: 'Maintenance Charges',
  rent_increase_cap: 'Rent Escalation',
  non_compete_duration: 'Non-Compete Duration',
  non_compete_radius: 'Non-Compete Radius',
  termination_notice: 'Termination Notice',
  refund_period: 'Refund Period',
  liability_cap: 'Liability Cap',
  auto_renewal_period: 'Auto-Renewal Period',
  late_payment_penalty: 'Late Payment Penalty',
  advance_rent: 'Advance Rent',
  brokerage_fee: 'Brokerage Fee',
  overall_risk_score: 'Overall Risk Score',
  power_balance_skew: 'Power Balance Skew',
  illegal_clause_ratio: 'Illegal Clause Ratio',
  clause_count: 'Clause Count',
};

// ============================================
// UNIT DISPLAY LABELS
// ============================================

export const UNIT_LABELS: Record<string, string> = {
  months_of_rent: 'months of rent',
  months: 'months',
  days: 'days',
  years: 'years',
  percent: '%',
  percent_per_annum: '% p.a.',
  percent_per_year: '% per year',
  rupees: '₹',
  rupees_per_month: '₹/month',
  rupees_per_day: '₹/day',
  km: 'km',
  miles: 'miles',
  score: '/100',
  count: '',
};

// ============================================
// DOCUMENT TYPE DISPLAY INFO
// ============================================

export const DOCUMENT_TYPE_INFO: Record<string, { label: string; icon: string; color: string }> = {
  rental: { label: 'Rental Contracts', icon: '🏠', color: 'blue' },
  employment: { label: 'Employment Contracts', icon: '💼', color: 'purple' },
  loan: { label: 'Loan Agreements', icon: '💰', color: 'amber' },
  tos: { label: 'Terms of Service', icon: '📋', color: 'red' },
  freelance: { label: 'Freelance Contracts', icon: '💻', color: 'cyan' },
  sale: { label: 'Sale Agreements', icon: '🏗️', color: 'green' },
  partnership: { label: 'Partnership Deeds', icon: '🤝', color: 'indigo' },
  nda: { label: "NDA's", icon: '🔒', color: 'gray' },
  other: { label: 'Other Contracts', icon: '📄', color: 'slate' },
};

// ============================================
// UTILITY: Normalize city name
// ============================================

export function normalizeCity(input: string): string | null {
  if (!input) return null;
  const lower = input.toLowerCase().trim();
  for (const city of CITY_NORMALIZATIONS) {
    if (city.canonical === lower) return city.canonical;
    for (const alias of city.aliases) {
      if (alias === lower) return city.canonical;
    }
  }
  return lower; // Return as-is if no normalization found
}

// ============================================
// UTILITY: Get state from city
// ============================================

export function getStateFromCity(cityName: string): string | null {
  const normalized = normalizeCity(cityName);
  if (!normalized) return null;
  for (const city of CITY_NORMALIZATIONS) {
    if (city.canonical === normalized) return city.state;
  }
  return null;
}

// ============================================
// UTILITY: Normalize jurisdiction to state key
// ============================================

export function normalizeJurisdiction(input: string): string | null {
  if (!input) return null;
  const lower = input.toLowerCase().trim().replace(/[\s-]+/g, '_');
  if (INDIAN_STATES[lower]) return lower;

  // Check by name
  for (const [key, state] of Object.entries(INDIAN_STATES)) {
    if (state.name.toLowerCase() === input.toLowerCase().trim()) return key;
    if (state.code.toLowerCase() === input.toLowerCase().trim()) return key;
  }

  // Common aliases
  const aliases: Record<string, string> = {
    'pan_india': 'national',
    'all_india': 'national',
    'india': 'national',
    'ap': 'andhra_pradesh',
    'ar': 'arunachal_pradesh',
    'as': 'assam',
    'br': 'bihar',
    'ct': 'chhattisgarh',
    'ga': 'goa',
    'gj': 'gujarat',
    'hr': 'haryana',
    'hp': 'himachal_pradesh',
    'jh': 'jharkhand',
    'ka': 'karnataka',
    'kl': 'kerala',
    'mp': 'madhya_pradesh',
    'mh': 'maharashtra',
    'mn': 'manipur',
    'ml': 'meghalaya',
    'mz': 'mizoram',
    'nl': 'nagaland',
    'or': 'odisha',
    'pb': 'punjab',
    'rj': 'rajasthan',
    'sk': 'sikkim',
    'tn': 'tamil_nadu',
    'tg': 'telangana',
    'tr': 'tripura',
    'up': 'uttar_pradesh',
    'ut': 'uttarakhand',
    'wb': 'west_bengal',
    'an': 'andaman_nicobar',
    'ch': 'chandigarh',
    'dn': 'dadra_nagar_haveli',
    'dl': 'delhi',
    'jk': 'jammu_kashmir',
    'la': 'ladakh',
    'ld': 'lakshadweep',
    'py': 'puducherry',
  };

  return aliases[lower] || null;
}

// ============================================
// UTILITY: Normalize value units
// ============================================

export function normalizeToMonths(value: number, unit: string): number {
  switch (unit.toLowerCase()) {
    case 'years':
    case 'year':
      return value * 12;
    case 'days':
    case 'day':
      return value / 30;
    case 'months':
    case 'month':
    case 'months_of_rent':
      return value;
    default:
      return value;
  }
}

export function normalizeToDays(value: number, unit: string): number {
  switch (unit.toLowerCase()) {
    case 'years':
    case 'year':
      return value * 365;
    case 'months':
    case 'month':
      return value * 30;
    case 'days':
    case 'day':
      return value;
    default:
      return value;
  }
}

// ============================================
// RISK LEVEL COLORS FOR HEAT MAP
// ============================================

export function getRiskColor(score: number): string {
  if (score <= 30) return '#22c55e';   // green-500
  if (score <= 55) return '#f59e0b';   // amber-500
  if (score <= 75) return '#f97316';   // orange-500
  return '#ef4444';                    // red-500
}

export function getPercentileColor(rank: number, higherIsWorse: boolean): string {
  const effective = higherIsWorse ? rank : 100 - rank;
  if (effective <= 10) return '#10b981';  // emerald-500
  if (effective <= 35) return '#4ade80';  // green-400
  if (effective <= 65) return '#fbbf24';  // amber-400
  if (effective <= 90) return '#f97316';  // orange-500
  return '#ef4444';                       // red-500
}
