// ============================================
// CLAUSEWALL — AUTHORITY CONNECTOR CONSTANTS
// ============================================

import type {
  AuthorityType,
  DisputeCategory,
  CounterpartyType,
  JurisdictionLevel,
} from "@/types/authority";

// ---- Authority Type Labels ----

export const AUTHORITY_TYPE_LABELS: Record<AuthorityType, string> = {
  consumer_forum_district: "District Consumer Disputes Redressal Forum",
  consumer_forum_state: "State Consumer Disputes Redressal Commission",
  consumer_forum_national: "National Consumer Disputes Redressal Commission",
  rera_authority: "RERA Authority",
  rera_appellate: "RERA Appellate Tribunal",
  labour_commissioner: "Labour Commissioner",
  labour_court: "Labour Court",
  industrial_tribunal: "Industrial Tribunal",
  rent_controller: "Rent Controller",
  rent_court: "Rent Court",
  rbi_ombudsman: "RBI Integrated Ombudsman",
  insurance_ombudsman: "Insurance Ombudsman",
  banking_ombudsman: "Banking Ombudsman",
  epfo_regional: "EPFO Regional Office",
  esic_regional: "ESIC Regional Office",
  cat_bench: "Central Administrative Tribunal",
  sat_bench: "State Administrative Tribunal",
  civil_court_district: "District Civil Court",
  small_causes_court: "Small Causes Court",
  commercial_court: "Commercial Court",
  high_court: "High Court",
  dlsa: "District Legal Services Authority",
  slsa: "State Legal Services Authority",
  nalsa: "National Legal Services Authority",
  women_commission_state: "State Women's Commission",
  women_commission_national: "National Commission for Women",
  sc_st_commission_state: "State SC/ST Commission",
  sc_st_commission_national: "National SC/ST Commission",
  information_commission_state: "State Information Commission",
  information_commission_central: "Central Information Commission",
  police_station: "Police Station",
  cyber_crime_cell: "Cyber Crime Cell",
  other: "Other Authority",
};

// ---- Dispute Category Labels ----

export const DISPUTE_CATEGORY_LABELS: Record<DisputeCategory, string> = {
  consumer: "Consumer Dispute",
  employment: "Employment Dispute",
  rental: "Rental / Tenancy Dispute",
  banking: "Banking / Financial Dispute",
  insurance: "Insurance Dispute",
  government: "Government Entity Dispute",
  property: "Property / Real Estate Dispute",
  freelance: "Freelance / Service Dispute",
  telecom: "Telecom Dispute",
  ecommerce: "E-Commerce Dispute",
  other: "Other Dispute",
};

// ---- Counterparty Type Labels ----

export const COUNTERPARTY_TYPE_LABELS: Record<CounterpartyType, string> = {
  company: "Company / Corporate",
  individual: "Individual / Person",
  government: "Government Entity",
  bank: "Bank",
  nbfc: "NBFC / Fintech",
  insurance: "Insurance Company",
  builder: "Builder / Developer",
  employer: "Employer",
  landlord: "Landlord / Property Owner",
  telecom: "Telecom Provider",
  other: "Other",
};

// ---- Jurisdiction Level Labels ----

export const JURISDICTION_LEVEL_LABELS: Record<JurisdictionLevel, string> = {
  district: "District",
  city: "City",
  state: "State",
  regional: "Regional",
  national: "National",
};

// ---- Indian State Codes ----

export const INDIAN_STATES: Record<string, string> = {
  AN: "Andaman and Nicobar Islands",
  AP: "Andhra Pradesh",
  AR: "Arunachal Pradesh",
  AS: "Assam",
  BR: "Bihar",
  CH: "Chandigarh",
  CT: "Chhattisgarh",
  DL: "Delhi",
  GA: "Goa",
  GJ: "Gujarat",
  HR: "Haryana",
  HP: "Himachal Pradesh",
  JK: "Jammu and Kashmir",
  JH: "Jharkhand",
  KA: "Karnataka",
  KL: "Kerala",
  LA: "Ladakh",
  LD: "Lakshadweep",
  MP: "Madhya Pradesh",
  MH: "Maharashtra",
  MN: "Manipur",
  ML: "Meghalaya",
  MZ: "Mizoram",
  NL: "Nagaland",
  OR: "Odisha",
  PB: "Punjab",
  PY: "Puducherry",
  RJ: "Rajasthan",
  SK: "Sikkim",
  TN: "Tamil Nadu",
  TG: "Telangana",
  TR: "Tripura",
  UP: "Uttar Pradesh",
  UK: "Uttarakhand",
  WB: "West Bengal",
  DN: "Dadra and Nagar Haveli and Daman and Diu",
};

// Map jurisdiction string from ClauseWall to state codes
export const JURISDICTION_TO_STATE_CODE: Record<string, string> = {
  maharashtra: "MH",
  karnataka: "KA",
  delhi: "DL",
  tamil_nadu: "TN",
  uttar_pradesh: "UP",
  gujarat: "GJ",
  rajasthan: "RJ",
  west_bengal: "WB",
  kerala: "KL",
  telangana: "TG",
  andhra_pradesh: "AP",
  punjab: "PB",
  haryana: "HR",
  madhya_pradesh: "MP",
  bihar: "BR",
  jharkhand: "JH",
  chhattisgarh: "CT",
  odisha: "OR",
  assam: "AS",
  goa: "GA",
  himachal_pradesh: "HP",
  uttarakhand: "UK",
  jammu_kashmir: "JK",
  chandigarh: "CH",
  puducherry: "PY",
  tripura: "TR",
  meghalaya: "ML",
  manipur: "MN",
  mizoram: "MZ",
  nagaland: "NL",
  arunachal_pradesh: "AR",
  sikkim: "SK",
  ladakh: "LA",
  general: "",
};

// ---- Consumer Forum Thresholds (CPA 2019) ----

export const CONSUMER_FORUM_THRESHOLDS = {
  district: { min: 0, max: 5000000 }, // up to ₹50 lakhs
  state: { min: 5000001, max: 20000000 }, // ₹50L to ₹2 crore
  national: { min: 20000001, max: null }, // above ₹2 crore
} as const;

// ---- Filing Fee Structures ----

export const CONSUMER_FORUM_FEES = {
  district: [
    { claim_min: 0, claim_max: 500000, fee: 200 },
    { claim_min: 500001, claim_max: 1000000, fee: 400 },
    { claim_min: 1000001, claim_max: 2000000, fee: 500 },
    { claim_min: 2000001, claim_max: 5000000, fee: 2000 },
    { claim_min: 5000001, claim_max: 10000000, fee: 4000 },
  ],
  state: [
    { claim_min: 5000001, claim_max: 10000000, fee: 5000 },
    { claim_min: 10000001, claim_max: 20000000, fee: 10000 },
  ],
  national: [
    { claim_min: 20000001, claim_max: null, fee: 25000 },
  ],
} as const;

// ---- Escalation Deadline Constants (days) ----

export const ESCALATION_DEADLINES = {
  legal_notice_response: 15,
  consumer_forum_appeal_state: 45,
  consumer_forum_appeal_national: 30,
  rera_order_deadline: 60,
  rera_appeal: 60,
  rbi_ombudsman_response: 30,
  rbi_appellate: 30,
  insurance_ombudsman_response: 90,
  labour_commissioner_conciliation: 45,
  internal_grievance: 30,
  rti_response: 30,
  rti_first_appeal: 30,
  rti_second_appeal: 90,
} as const;

// ---- Legal Aid Income Thresholds ----

export const LEGAL_AID_INCOME_THRESHOLD = 300000; // ₹3 lakhs general
export const LEGAL_AID_INCOME_THRESHOLD_STATES: Record<string, number> = {
  DL: 500000, // Delhi: ₹5 lakhs
  MH: 300000,
  KA: 300000,
  TN: 300000,
};

// ---- Legal Aid Eligible Categories (LSAA Section 12) ----

export const LEGAL_AID_CATEGORIES = [
  "sc_st",
  "women",
  "children",
  "disabled",
  "industrial_workman",
  "custody",
  "trafficking_victim",
  "mass_disaster_victim",
  "mentally_ill",
] as const;

export const LEGAL_AID_CATEGORY_LABELS: Record<string, string> = {
  sc_st: "SC/ST Member",
  women: "Woman",
  children: "Child (under 18)",
  disabled: "Person with Disability",
  industrial_workman: "Industrial Workman",
  custody: "Person in Custody",
  trafficking_victim: "Victim of Trafficking",
  mass_disaster_victim: "Victim of Mass Disaster",
  mentally_ill: "Person with Mental Illness",
};

// ---- National Helplines (always shown) ----

export const NATIONAL_HELPLINES = [
  {
    name: "NALSA Helpline",
    number: "15100",
    hours: "24x7",
    description: "National Legal Services Authority — free legal aid & information",
  },
  {
    name: "Tele-Law (Free Legal Advice)",
    number: "1800-11-5151",
    hours: "9:30 AM - 5:30 PM, Mon-Sat",
    description: "Free legal advice via video call — Ministry of Law & Justice",
  },
  {
    name: "Women Helpline",
    number: "181",
    hours: "24x7",
    description: "Women in distress — police, legal, medical assistance",
  },
  {
    name: "National Commission for Women",
    number: "7827-170-170",
    hours: "9:30 AM - 5:30 PM, Mon-Fri",
    description: "Complaints against women's rights violations",
  },
  {
    name: "Cyber Crime Helpline",
    number: "1930",
    hours: "24x7",
    description: "National Cyber Crime Reporting — cybercrime.gov.in",
  },
  {
    name: "Police Emergency",
    number: "100",
    hours: "24x7",
    description: "Police emergency helpline",
  },
  {
    name: "Consumer Helpline",
    number: "1800-11-4000",
    hours: "9:30 AM - 5:30 PM, Mon-Sat",
    description: "National Consumer Helpline — complaints and guidance",
  },
] as const;

// ---- RTI Constants ----

export const RTI_FEE = 10; // ₹10
export const RTI_RESPONSE_DAYS = 30;
export const RTI_URGENT_RESPONSE_HOURS = 48; // life/liberty at stake
export const RTI_FIRST_APPEAL_DAYS = 30;
export const RTI_SECOND_APPEAL_DAYS = 90;
export const RTI_FEE_METHODS = [
  "Indian Postal Order (IPO)",
  "Court Fee Stamp",
  "Demand Draft",
  "Online Payment (where available)",
] as const;

// ---- Document Type to Dispute Category Mapping ----

export const DOCUMENT_TYPE_TO_DISPUTE: Record<string, DisputeCategory> = {
  rental: "rental",
  employment: "employment",
  loan: "banking",
  tos: "consumer",
  service: "consumer",
  freelance: "freelance",
  sale: "property",
  partnership: "other",
  nda: "other",
  insurance: "insurance",
  telecom: "telecom",
  ecommerce: "ecommerce",
  other: "other",
};

// ---- E-Filing Portals ----

export const E_FILING_PORTALS = {
  consumer_forum: "https://edaakhil.nic.in/edaakhil/",
  rbi_ombudsman: "https://cms.rbi.org.in",
  insurance_ombudsman: "https://igms.irda.gov.in",
  rera_maharashtra: "https://maharera.mahaonline.gov.in",
  rera_karnataka: "https://rera.karnataka.gov.in",
  rera_tamil_nadu: "https://www.tnrera.in",
  rera_delhi: "https://rera.delhi.gov.in",
  rera_uttar_pradesh: "https://www.up-rera.in",
  rera_gujarat: "https://gujrera.gujarat.gov.in",
  rera_rajasthan: "https://rera.rajasthan.gov.in",
  rera_west_bengal: "https://www.wbhira.gov.in",
  rera_telangana: "https://rera.telangana.gov.in",
  rera_andhra_pradesh: "https://rera.ap.gov.in",
  rera_haryana: "https://haryanarera.gov.in",
  rera_punjab: "https://rera.punjab.gov.in",
  rera_madhya_pradesh: "https://rera.mp.gov.in",
  rera_goa: "https://rera.goa.gov.in",
  cyber_crime: "https://cybercrime.gov.in",
  epfo: "https://unifiedportal-mem.epfindia.gov.in/memberinterface/",
  sebi_scores: "https://scores.sebi.gov.in",
  tele_law: "https://www.tele-law.in",
} as const;
