// ============================================
// CLAUSEWALL — SEED DATA: JURISDICTION RULES
// + LEGAL AID PROVIDERS
// ============================================

import type { JurisdictionRule, LegalAidProvider } from "@/types/authority";

type SeedRule = Partial<JurisdictionRule> & { authority_type: string; reasoning: string };
type SeedProvider = Partial<LegalAidProvider> & { name: string; provider_type: string };

// ============================================================
// JURISDICTION ROUTING RULES
// Decision tree encoded as data
// ============================================================

export const SEED_JURISDICTION_RULES: SeedRule[] = [
  // ---- CONSUMER DISPUTES (Rental, ToS, Service, Insurance, Telecom, Ecom) ----
  // District Forum — claim up to ₹50 lakhs
  { document_type: null, dispute_category: "consumer", counterparty_type: null, jurisdiction_state: null, claim_amount_min: null, claim_amount_max: 5000000, authority_type: "consumer_forum_district", priority: 1, reasoning: "Consumer Protection Act 2019, Section 34(1) — District Forum has jurisdiction for claims up to ₹50 lakhs.", applicable_law: "Consumer Protection Act, 2019", applicable_section: "Section 34(1)", not_this_reason: "Do NOT file in Civil Court — Consumer Forum has exclusive jurisdiction for consumer disputes and is faster and cheaper.", is_active: true },
  // State Commission — ₹50L to ₹2Cr
  { document_type: null, dispute_category: "consumer", counterparty_type: null, jurisdiction_state: null, claim_amount_min: 5000001, claim_amount_max: 20000000, authority_type: "consumer_forum_state", priority: 1, reasoning: "Consumer Protection Act 2019, Section 47 — State Commission for claims between ₹50 lakhs and ₹2 crore.", applicable_law: "Consumer Protection Act, 2019", applicable_section: "Section 47", not_this_reason: "Do NOT file at District Forum — claim amount exceeds ₹50 lakhs threshold. District Forum will reject.", is_active: true },
  // NCDRC — above ₹2Cr
  { document_type: null, dispute_category: "consumer", counterparty_type: null, jurisdiction_state: null, claim_amount_min: 20000001, claim_amount_max: null, authority_type: "consumer_forum_national", priority: 1, reasoning: "Consumer Protection Act 2019, Section 58 — NCDRC for claims above ₹2 crore.", applicable_law: "Consumer Protection Act, 2019", applicable_section: "Section 58", not_this_reason: "Do NOT file at State Commission — claim exceeds ₹2 crore threshold.", is_active: true },

  // ---- RENTAL DISPUTES ----
  // Consumer Forum (primary — tenant vs landlord, deficiency in service)
  { document_type: "rental", dispute_category: "rental", counterparty_type: null, jurisdiction_state: null, claim_amount_min: null, claim_amount_max: 5000000, authority_type: "consumer_forum_district", priority: 1, reasoning: "Rental disputes involving deficiency in service, illegal clauses, or deposit issues are consumer disputes under CPA 2019.", applicable_law: "Consumer Protection Act, 2019", applicable_section: "Section 2(7) — Deficiency", not_this_reason: "Do NOT file at RERA — RERA only covers builder/developer disputes, not tenant-landlord disputes.", is_active: true },
  // Rent Controller (alternative)
  { document_type: "rental", dispute_category: "rental", counterparty_type: "landlord", jurisdiction_state: null, claim_amount_min: null, claim_amount_max: null, authority_type: "rent_controller", priority: 2, reasoning: "Rent Controller has jurisdiction under state Rent Control Act for eviction, rent fixation, and basic tenancy disputes.", applicable_law: "State Rent Control Act", applicable_section: "Varies by state", not_this_reason: null, is_active: true },

  // ---- PROPERTY / RERA ----
  { document_type: "sale", dispute_category: "property", counterparty_type: "builder", jurisdiction_state: null, claim_amount_min: null, claim_amount_max: null, authority_type: "rera_authority", priority: 1, reasoning: "RERA 2016 covers all disputes involving registered real estate projects and builders.", applicable_law: "Real Estate (Regulation and Development) Act, 2016", applicable_section: "Section 31", not_this_reason: "Do NOT file at Consumer Forum first — RERA is the specialized tribunal for real estate. Consumer Forum can be used if RERA is unsatisfactory.", is_active: true },
  // RERA Appellate
  { document_type: "sale", dispute_category: "property", counterparty_type: "builder", jurisdiction_state: null, claim_amount_min: null, claim_amount_max: null, authority_type: "rera_appellate", priority: 3, reasoning: "RERA Appellate Tribunal hears appeals against RERA Authority orders. Appeal within 60 days of RERA order.", applicable_law: "RERA 2016", applicable_section: "Section 44", not_this_reason: null, is_active: true },

  // ---- EMPLOYMENT DISPUTES ----
  // Labour Commissioner (conciliation)
  { document_type: "employment", dispute_category: "employment", counterparty_type: "employer", jurisdiction_state: null, claim_amount_min: null, claim_amount_max: null, authority_type: "labour_commissioner", priority: 1, reasoning: "Labour Commissioner handles wage disputes, working condition issues, and conciliation between employer and employee.", applicable_law: "Industrial Disputes Act, 1947", applicable_section: "Section 12", not_this_reason: "Do NOT file at Consumer Forum — employment disputes are handled by labour authorities, not consumer forums.", is_active: true },
  // Labour Court (after conciliation fails)
  { document_type: "employment", dispute_category: "employment", counterparty_type: "employer", jurisdiction_state: null, claim_amount_min: null, claim_amount_max: null, authority_type: "labour_court", priority: 2, reasoning: "Labour Court hears disputes referred after conciliation fails. For workmen under Industrial Disputes Act.", applicable_law: "Industrial Disputes Act, 1947", applicable_section: "Section 7", not_this_reason: null, is_active: true },
  // EPFO (PF disputes)
  { document_type: "employment", dispute_category: "employment", counterparty_type: "employer", jurisdiction_state: null, clause_types: ["benefits_pf_esi"], claim_amount_min: null, claim_amount_max: null, authority_type: "epfo_regional", priority: 1, reasoning: "EPFO Regional Commissioner handles PF-related disputes — non-remittance, withdrawal issues, transfer problems.", applicable_law: "Employees' Provident Funds and Miscellaneous Provisions Act, 1952", applicable_section: "Section 7A", not_this_reason: null, is_active: true },
  // Civil Court (non-workman employment)
  { document_type: "employment", dispute_category: "employment", counterparty_type: "employer", jurisdiction_state: null, claim_amount_min: null, claim_amount_max: null, authority_type: "civil_court_district", priority: 3, reasoning: "Civil Court handles employment disputes for non-workmen (managers, executives). Also handles non-compete injunctions.", applicable_law: "Code of Civil Procedure, 1908", applicable_section: "Section 9", not_this_reason: null, additional_conditions: { is_non_workman: true }, is_active: true },

  // ---- BANKING DISPUTES ----
  // RBI Ombudsman
  { document_type: "loan", dispute_category: "banking", counterparty_type: "bank", jurisdiction_state: null, claim_amount_min: null, claim_amount_max: null, authority_type: "rbi_ombudsman", priority: 1, reasoning: "RBI Integrated Ombudsman handles complaints against banks, NBFCs, and payment operators. FREE, no fee required. Must first complain to bank internally and wait 30 days.", applicable_law: "RBI Integrated Ombudsman Scheme, 2021", applicable_section: "Clause 8", not_this_reason: "Do NOT file at Consumer Forum first — RBI Ombudsman is faster and free. Go to Consumer Forum only if Ombudsman order is unsatisfactory.", is_active: true },
  // NBFC complaints
  { document_type: "loan", dispute_category: "banking", counterparty_type: "nbfc", jurisdiction_state: null, claim_amount_min: null, claim_amount_max: null, authority_type: "rbi_ombudsman", priority: 1, reasoning: "Since 2021, RBI Integrated Ombudsman also covers NBFCs and fintech lenders.", applicable_law: "RBI Integrated Ombudsman Scheme, 2021", applicable_section: "Clause 8", not_this_reason: null, is_active: true },
  // Consumer Forum (banking — alternative after ombudsman)
  { document_type: "loan", dispute_category: "banking", counterparty_type: "bank", jurisdiction_state: null, claim_amount_min: null, claim_amount_max: 5000000, authority_type: "consumer_forum_district", priority: 2, reasoning: "Consumer Forum is an alternative for banking disputes, especially if RBI Ombudsman order is unsatisfactory.", applicable_law: "Consumer Protection Act, 2019", applicable_section: "Section 34", not_this_reason: null, is_active: true },

  // ---- INSURANCE DISPUTES ----
  { document_type: null, dispute_category: "insurance", counterparty_type: "insurance", jurisdiction_state: null, claim_amount_min: null, claim_amount_max: null, authority_type: "insurance_ombudsman", priority: 1, reasoning: "Insurance Ombudsman handles complaints against insurance companies. FREE. Must first complain to insurer and wait 30 days.", applicable_law: "Insurance Ombudsman Rules, 2017", applicable_section: "Rule 13", not_this_reason: "Do NOT file at Consumer Forum first — Insurance Ombudsman is specialized and free. Consumer Forum is an escalation option.", is_active: true },
  // Consumer Forum (insurance — alternative)
  { document_type: null, dispute_category: "insurance", counterparty_type: "insurance", jurisdiction_state: null, claim_amount_min: null, claim_amount_max: 5000000, authority_type: "consumer_forum_district", priority: 2, reasoning: "Consumer Forum handles insurance disputes as deficiency in service, especially after Insurance Ombudsman.", applicable_law: "Consumer Protection Act, 2019", applicable_section: "Section 34", not_this_reason: null, is_active: true },

  // ---- GOVERNMENT ENTITY DISPUTES ----
  // CAT (Central govt employees)
  { document_type: "employment", dispute_category: "government", counterparty_type: "government", jurisdiction_state: null, claim_amount_min: null, claim_amount_max: null, authority_type: "cat_bench", priority: 1, reasoning: "Central Administrative Tribunal handles disputes of central government employees.", applicable_law: "Administrative Tribunals Act, 1985", applicable_section: "Section 14", not_this_reason: "Do NOT file at Labour Court — CAT has exclusive jurisdiction for central government employment disputes.", is_active: true },

  // ---- FREELANCE / SERVICE ----
  { document_type: "freelance", dispute_category: "freelance", counterparty_type: "company", jurisdiction_state: null, claim_amount_min: null, claim_amount_max: 5000000, authority_type: "consumer_forum_district", priority: 1, reasoning: "Freelance service payment disputes can be filed at Consumer Forum as deficiency in service.", applicable_law: "Consumer Protection Act, 2019", applicable_section: "Section 2(7)", not_this_reason: null, is_active: true },
  { document_type: "freelance", dispute_category: "freelance", counterparty_type: null, jurisdiction_state: null, claim_amount_min: null, claim_amount_max: null, authority_type: "civil_court_district", priority: 2, reasoning: "Civil Court handles payment disputes and breach of contract for freelance/service agreements.", applicable_law: "Code of Civil Procedure, 1908", applicable_section: "Section 9", not_this_reason: null, is_active: true },
];

// ============================================================
// LEGAL AID PROVIDERS
// ============================================================

export const SEED_LEGAL_AID_PROVIDERS: SeedProvider[] = [
  // NALSA
  { provider_type: "nalsa", name: "National Legal Services Authority (NALSA)", description: "Apex body constituted under LSAA 1987 to provide free legal services", state_code: null, city: "New Delhi", address: "12/11, Jam Nagar House, Shahjahan Road, New Delhi - 110011", phone_numbers: ["011-23382778", "15100"], email: "nalsa-dla@nic.in", website: "https://nalsa.gov.in", helpline_number: "15100", is_free: true, services_offered: ["Free legal advice", "Court representation", "Lok Adalat", "Legal literacy", "Mediation"], languages: ["Hindi", "English"], operating_hours: "9:30 AM - 5:30 PM, Mon-Fri", is_active: true },
  // Tele-Law
  { provider_type: "tele_law", name: "Tele-Law Service (Ministry of Law & Justice)", description: "Free legal advice via video call at Common Service Centres", state_code: null, city: null, phone_numbers: ["1800-11-5151"], website: "https://www.tele-law.in", helpline_number: "1800-11-5151", is_free: true, services_offered: ["Free legal advice via video call", "Document drafting guidance", "Legal awareness"], languages: ["Hindi", "English", "Regional languages"], operating_hours: "9:30 AM - 5:30 PM, Mon-Sat", is_active: true },

  // State Legal Services Authorities (all states)
  ...["Maharashtra", "Karnataka", "Delhi", "Tamil Nadu", "Uttar Pradesh", "Gujarat", "Rajasthan", "West Bengal", "Kerala", "Telangana", "Andhra Pradesh", "Punjab", "Haryana", "Madhya Pradesh", "Bihar", "Jharkhand", "Chhattisgarh", "Odisha", "Assam", "Goa", "Himachal Pradesh", "Uttarakhand", "Jammu and Kashmir"].map((state) => {
    const codes: Record<string, string> = { Maharashtra: "MH", Karnataka: "KA", Delhi: "DL", "Tamil Nadu": "TN", "Uttar Pradesh": "UP", Gujarat: "GJ", Rajasthan: "RJ", "West Bengal": "WB", Kerala: "KL", Telangana: "TG", "Andhra Pradesh": "AP", Punjab: "PB", Haryana: "HR", "Madhya Pradesh": "MP", Bihar: "BR", Jharkhand: "JH", Chhattisgarh: "CT", Odisha: "OR", Assam: "AS", Goa: "GA", "Himachal Pradesh": "HP", Uttarakhand: "UK", "Jammu and Kashmir": "JK" };
    return {
      provider_type: "slsa" as const,
      name: `${state} State Legal Services Authority`,
      state_code: codes[state],
      income_threshold: 300000,
      eligible_categories: ["sc_st", "women", "children", "disabled", "industrial_workman", "custody"],
      is_free: true,
      services_offered: ["Free legal advice", "Court representation", "Lok Adalat", "Mediation", "Legal aid camps"],
      phone_numbers: ["[VERIFY]"],
      is_active: true,
    } as SeedProvider;
  }),

  // NLU Legal Aid Clinics
  { provider_type: "law_school_clinic", name: "NLS Bangalore — Legal Aid Clinic", description: "National Law School of India University legal aid clinic", state_code: "KA", city: "Bangalore", is_free: true, services_offered: ["Free legal advice", "Legal awareness", "Paralegal training"], phone_numbers: ["080-23160532"], website: "https://www.nls.ac.in", is_active: true },
  { provider_type: "law_school_clinic", name: "NLU Delhi — Legal Aid Clinic", description: "National Law University Delhi legal services clinic", state_code: "DL", city: "New Delhi", is_free: true, services_offered: ["Free legal advice", "Consumer dispute assistance", "Women's rights"], phone_numbers: ["011-28034255"], website: "https://nludelhi.ac.in", is_active: true },
  { provider_type: "law_school_clinic", name: "NALSAR Hyderabad — Legal Aid Clinic", description: "NALSAR University of Law legal aid clinic", state_code: "TG", city: "Hyderabad", is_free: true, services_offered: ["Free legal advice", "Legal literacy camps"], phone_numbers: ["040-23498104"], website: "https://nalsar.ac.in", is_active: true },
  { provider_type: "law_school_clinic", name: "NUJS Kolkata — Legal Aid Clinic", description: "National University of Juridical Sciences legal aid clinic", state_code: "WB", city: "Kolkata", is_free: true, services_offered: ["Free legal advice", "Community outreach"], phone_numbers: ["033-24571952"], website: "https://www.nujs.edu", is_active: true },
  { provider_type: "law_school_clinic", name: "GNLU Gandhinagar — Legal Aid Clinic", description: "Gujarat National Law University legal aid centre", state_code: "GJ", city: "Gandhinagar", is_free: true, services_offered: ["Free legal advice", "Lok Adalat assistance"], phone_numbers: ["079-23276611"], website: "https://www.gnlu.ac.in", is_active: true },
  { provider_type: "law_school_clinic", name: "RGNUL Patiala — Legal Aid Clinic", description: "Rajiv Gandhi National University of Law legal aid clinic", state_code: "PB", city: "Patiala", is_free: true, services_offered: ["Free legal advice"], phone_numbers: ["0175-2393700"], website: "https://www.rgnul.ac.in", is_active: true },
  { provider_type: "law_school_clinic", name: "CNLU Patna — Legal Aid Clinic", description: "Chanakya National Law University legal aid clinic", state_code: "BR", city: "Patna", is_free: true, services_offered: ["Free legal advice", "Legal literacy"], phone_numbers: ["[VERIFY]"], is_active: true },
  { provider_type: "law_school_clinic", name: "HNLU Raipur — Legal Aid Clinic", description: "Hidayatullah National Law University legal aid clinic", state_code: "CT", city: "Raipur", is_free: true, services_offered: ["Free legal advice"], phone_numbers: ["0771-2442610"], website: "https://www.hnlu.ac.in", is_active: true },

  // NGOs
  { provider_type: "ngo", name: "Human Rights Law Network (HRLN)", description: "India's largest pro-bono legal network for human rights cases", state_code: null, city: "New Delhi", address: "576, Masjid Road, Jangpura, New Delhi - 110014", phone_numbers: ["011-24379855"], email: "publications@hrln.org", website: "https://hrln.org", is_free: true, services_offered: ["Pro-bono representation", "PIL filing", "Human rights litigation", "Legal aid"], is_active: true },
  { provider_type: "ngo", name: "Commonwealth Human Rights Initiative (CHRI)", description: "Legal aid and advocacy for prison reforms and police accountability", state_code: null, city: "New Delhi", phone_numbers: ["011-43180200"], website: "https://www.humanrightsinitiative.org", is_free: true, services_offered: ["Legal advice", "RTI assistance", "Police accountability"], is_active: true },

  // DLSA for major cities
  ...["Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow"].map((city) => {
    const codes: Record<string, string> = { Mumbai: "MH", Delhi: "DL", Bangalore: "KA", Chennai: "TN", Hyderabad: "TG", Kolkata: "WB", Pune: "MH", Ahmedabad: "GJ", Jaipur: "RJ", Lucknow: "UP" };
    return {
      provider_type: "dlsa" as const,
      name: `District Legal Services Authority, ${city}`,
      state_code: codes[city],
      city,
      income_threshold: 300000,
      eligible_categories: ["sc_st", "women", "children", "disabled", "industrial_workman", "custody"],
      is_free: true,
      services_offered: ["Free legal advice", "Court representation", "Lok Adalat", "Mediation", "Victim compensation"],
      phone_numbers: ["[VERIFY]"],
      is_active: true,
    } as SeedProvider;
  }),
];
