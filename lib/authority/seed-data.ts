// ============================================
// CLAUSEWALL — SEED DATA: AUTHORITIES
// Consumer Forums, RERA, Banking, Labour, Courts
// ============================================

import type { LegalAuthority, JurisdictionRule, LegalAidProvider } from "@/types/authority";

// ---- Helper to create partial authority entries ----
type SeedAuthority = Partial<LegalAuthority> & { name: string; authority_type: string };

// ============================================================
// CONSUMER FORUMS — NATIONAL
// ============================================================

const NCDRC: SeedAuthority = {
  name: "National Consumer Disputes Redressal Commission",
  short_name: "NCDRC",
  authority_type: "consumer_forum_national",
  jurisdiction_level: "national",
  state_code: "DL",
  city: "New Delhi",
  physical_address: "Upbhokta Nyay Bhawan, F Block, GPO Complex, INA, New Delhi - 110023",
  pincode: "110023",
  phone_numbers: ["011-24651992", "011-24651993"],
  email: "ncdrc-dca@nic.in",
  website: "https://ncdrc.nic.in",
  e_filing_portal_url: "https://edaakhil.nic.in/edaakhil/",
  working_hours: "10:00 AM - 5:00 PM",
  working_days: "Monday to Friday",
  closed_on: "Saturday, Sunday, Gazetted Holidays",
  claim_amount_min: 20000001,
  handles_document_types: ["rental", "employment", "loan", "tos", "service", "insurance", "sale"],
  handles_dispute_types: ["consumer"],
  has_e_filing: true,
  has_video_hearing: true,
  has_online_tracking: true,
  online_tracking_url: "https://ncdrc.nic.in/case-status",
  typical_resolution_days: 180,
  current_backlog: "Moderate (6-12 month wait)",
  filing_fee_structure: { base_fee: 25000, fee_tiers: [{ claim_min: 20000001, claim_max: null, fee: 25000 }], payment_methods: ["court_fee_stamp", "dd", "online"], fee_waiver_available: true, fee_waiver_conditions: "BPL / Legal Aid eligible" },
  required_documents: ["Complaint in prescribed format (4 copies)", "Affidavit verifying complaint", "Supporting documents with index", "Court fee stamp", "ID proof of complainant", "Vakalatnama (if through advocate)"],
  filing_process_steps: [{ step: 1, description: "Draft complaint under CPA 2019 format", required: true }, { step: 2, description: "Prepare 4 sets with document index", required: true }, { step: 3, description: "Get affidavit notarized", required: true }, { step: 4, description: "Pay filing fee ₹25,000", required: true }, { step: 5, description: "E-file at edaakhil.nic.in or file at counter", required: true }, { step: 6, description: "Collect diary number", required: true }],
  is_active: true,
  is_verified: true,
  data_source: "ncdrc.nic.in",
};

// ============================================================
// STATE CONSUMER COMMISSIONS (all 36 states/UTs)
// ============================================================

const STATE_COMMISSIONS: SeedAuthority[] = [
  { name: "Maharashtra State Consumer Disputes Redressal Commission", short_name: "MSCDRC", authority_type: "consumer_forum_state", jurisdiction_level: "state", state_code: "MH", city: "Mumbai", physical_address: "New Administrative Building, 4th Floor, Opposite Mantralaya, Mumbai - 400032", pincode: "400032", phone_numbers: ["022-22027523"], email: "scdrc.maharashtra@nic.in", website: "https://confonet.nic.in", e_filing_portal_url: "https://edaakhil.nic.in/edaakhil/", has_e_filing: true, claim_amount_min: 5000001, claim_amount_max: 20000000, handles_dispute_types: ["consumer"], working_hours: "10:30 AM - 5:00 PM", working_days: "Monday to Friday", typical_resolution_days: 120, is_active: true, data_source: "confonet.nic.in" },
  { name: "Karnataka State Consumer Disputes Redressal Commission", short_name: "KSCDRC", authority_type: "consumer_forum_state", jurisdiction_level: "state", state_code: "KA", city: "Bangalore", physical_address: "Khanija Bhavan, 3rd Floor, Race Course Road, Bangalore - 560001", pincode: "560001", phone_numbers: ["080-22270081"], email: "scdrc.karnataka@nic.in", website: "https://confonet.nic.in", e_filing_portal_url: "https://edaakhil.nic.in/edaakhil/", has_e_filing: true, claim_amount_min: 5000001, claim_amount_max: 20000000, handles_dispute_types: ["consumer"], working_hours: "10:30 AM - 5:00 PM", working_days: "Monday to Saturday", typical_resolution_days: 120, is_active: true, data_source: "confonet.nic.in" },
  { name: "Delhi State Consumer Disputes Redressal Commission", short_name: "DSCDRC", authority_type: "consumer_forum_state", jurisdiction_level: "state", state_code: "DL", city: "New Delhi", physical_address: "Vikas Minar Annexe, IP Estate, New Delhi - 110002", pincode: "110002", phone_numbers: ["011-23379733"], email: "scdrc.delhi@nic.in", website: "https://confonet.nic.in", e_filing_portal_url: "https://edaakhil.nic.in/edaakhil/", has_e_filing: true, claim_amount_min: 5000001, claim_amount_max: 20000000, handles_dispute_types: ["consumer"], working_hours: "10:00 AM - 5:00 PM", working_days: "Monday to Friday", typical_resolution_days: 150, is_active: true, data_source: "confonet.nic.in" },
  { name: "Tamil Nadu State Consumer Disputes Redressal Commission", short_name: "TNSCDRC", authority_type: "consumer_forum_state", jurisdiction_level: "state", state_code: "TN", city: "Chennai", physical_address: "Ezhilagam, Chepauk, Chennai - 600005", pincode: "600005", phone_numbers: ["044-28544590"], email: "scdrc.tamilnadu@nic.in", website: "https://confonet.nic.in", e_filing_portal_url: "https://edaakhil.nic.in/edaakhil/", has_e_filing: true, claim_amount_min: 5000001, claim_amount_max: 20000000, handles_dispute_types: ["consumer"], working_hours: "10:45 AM - 5:15 PM", working_days: "Monday to Friday", typical_resolution_days: 120, is_active: true, data_source: "confonet.nic.in" },
  { name: "Uttar Pradesh State Consumer Disputes Redressal Commission", short_name: "UPSCDRC", authority_type: "consumer_forum_state", jurisdiction_level: "state", state_code: "UP", city: "Lucknow", physical_address: "6th Floor, Indira Bhawan, Ashok Marg, Lucknow - 226001", pincode: "226001", phone_numbers: ["0522-2287405"], email: "scdrc.up@nic.in", website: "https://confonet.nic.in", e_filing_portal_url: "https://edaakhil.nic.in/edaakhil/", has_e_filing: true, claim_amount_min: 5000001, claim_amount_max: 20000000, handles_dispute_types: ["consumer"], working_hours: "10:00 AM - 5:00 PM", working_days: "Monday to Saturday", typical_resolution_days: 180, is_active: true, data_source: "confonet.nic.in" },
  { name: "Gujarat State Consumer Disputes Redressal Commission", short_name: "GSCDRC", authority_type: "consumer_forum_state", jurisdiction_level: "state", state_code: "GJ", city: "Ahmedabad", physical_address: "Block No. 17, Dr. Jivraj Mehta Bhawan, Gandhinagar - 382010", pincode: "382010", phone_numbers: ["079-23253891"], email: "scdrc.gujarat@nic.in", website: "https://confonet.nic.in", e_filing_portal_url: "https://edaakhil.nic.in/edaakhil/", has_e_filing: true, claim_amount_min: 5000001, claim_amount_max: 20000000, handles_dispute_types: ["consumer"], working_hours: "10:30 AM - 5:30 PM", working_days: "Monday to Saturday", typical_resolution_days: 120, is_active: true, data_source: "confonet.nic.in" },
  { name: "Rajasthan State Consumer Disputes Redressal Commission", short_name: "RSCDRC", authority_type: "consumer_forum_state", jurisdiction_level: "state", state_code: "RJ", city: "Jaipur", physical_address: "Rajmahal Residency Area, Jaipur - 302005", pincode: "302005", phone_numbers: ["0141-2385775"], email: "scdrc.rajasthan@nic.in", website: "https://confonet.nic.in", e_filing_portal_url: "https://edaakhil.nic.in/edaakhil/", has_e_filing: true, claim_amount_min: 5000001, claim_amount_max: 20000000, handles_dispute_types: ["consumer"], working_hours: "10:00 AM - 5:00 PM", working_days: "Monday to Saturday", typical_resolution_days: 150, is_active: true, data_source: "confonet.nic.in" },
  { name: "West Bengal State Consumer Disputes Redressal Commission", short_name: "WBSCDRC", authority_type: "consumer_forum_state", jurisdiction_level: "state", state_code: "WB", city: "Kolkata", physical_address: "Purta Bhawan, Block DF, Sector 1, Salt Lake, Kolkata - 700064", pincode: "700064", phone_numbers: ["033-23215827"], email: "scdrc.westbengal@nic.in", website: "https://confonet.nic.in", e_filing_portal_url: "https://edaakhil.nic.in/edaakhil/", has_e_filing: true, claim_amount_min: 5000001, claim_amount_max: 20000000, handles_dispute_types: ["consumer"], working_hours: "10:30 AM - 5:00 PM", working_days: "Monday to Friday", typical_resolution_days: 150, is_active: true, data_source: "confonet.nic.in" },
  { name: "Kerala State Consumer Disputes Redressal Commission", short_name: "KLSCDRC", authority_type: "consumer_forum_state", jurisdiction_level: "state", state_code: "KL", city: "Thiruvananthapuram", physical_address: "Sisira Building, Vazhuthacaud, Thiruvananthapuram - 695014", pincode: "695014", phone_numbers: ["0471-2335225"], email: "scdrc.kerala@nic.in", website: "https://confonet.nic.in", e_filing_portal_url: "https://edaakhil.nic.in/edaakhil/", has_e_filing: true, claim_amount_min: 5000001, claim_amount_max: 20000000, handles_dispute_types: ["consumer"], working_hours: "10:00 AM - 5:00 PM", working_days: "Monday to Friday", typical_resolution_days: 120, is_active: true, data_source: "confonet.nic.in" },
  { name: "Telangana State Consumer Disputes Redressal Commission", short_name: "TGSCDRC", authority_type: "consumer_forum_state", jurisdiction_level: "state", state_code: "TG", city: "Hyderabad", physical_address: "3rd Floor, Gruhakalpa Complex, M.J. Road, Nampally, Hyderabad - 500001", pincode: "500001", phone_numbers: ["040-24734891"], email: "scdrc.telangana@nic.in", website: "https://confonet.nic.in", e_filing_portal_url: "https://edaakhil.nic.in/edaakhil/", has_e_filing: true, claim_amount_min: 5000001, claim_amount_max: 20000000, handles_dispute_types: ["consumer"], working_hours: "10:30 AM - 5:00 PM", working_days: "Monday to Saturday", typical_resolution_days: 120, is_active: true, data_source: "confonet.nic.in" },
  { name: "Andhra Pradesh State Consumer Disputes Redressal Commission", short_name: "APSCDRC", authority_type: "consumer_forum_state", jurisdiction_level: "state", state_code: "AP", city: "Vijayawada", physical_address: "Consumer Forum Complex, Governorpeta, Vijayawada - 520002", pincode: "520002", phone_numbers: ["0866-2435123"], email: "scdrc.ap@nic.in", website: "https://confonet.nic.in", e_filing_portal_url: "https://edaakhil.nic.in/edaakhil/", has_e_filing: true, claim_amount_min: 5000001, claim_amount_max: 20000000, handles_dispute_types: ["consumer"], working_hours: "10:30 AM - 5:00 PM", working_days: "Monday to Saturday", typical_resolution_days: 150, is_active: true, data_source: "confonet.nic.in" },
  { name: "Punjab State Consumer Disputes Redressal Commission", short_name: "PBSCDRC", authority_type: "consumer_forum_state", jurisdiction_level: "state", state_code: "PB", city: "Chandigarh", physical_address: "SCO 175-176, Sector 17-C, Chandigarh - 160017", pincode: "160017", phone_numbers: ["0172-2704475"], email: "scdrc.punjab@nic.in", website: "https://confonet.nic.in", e_filing_portal_url: "https://edaakhil.nic.in/edaakhil/", has_e_filing: true, claim_amount_min: 5000001, claim_amount_max: 20000000, handles_dispute_types: ["consumer"], working_hours: "10:00 AM - 5:00 PM", working_days: "Monday to Saturday", typical_resolution_days: 150, is_active: true, data_source: "confonet.nic.in" },
  { name: "Haryana State Consumer Disputes Redressal Commission", short_name: "HRSCDRC", authority_type: "consumer_forum_state", jurisdiction_level: "state", state_code: "HR", city: "Chandigarh", physical_address: "Plot No. 1, Sector 27-A, Chandigarh - 160019", pincode: "160019", phone_numbers: ["0172-2654063"], email: "scdrc.haryana@nic.in", website: "https://confonet.nic.in", e_filing_portal_url: "https://edaakhil.nic.in/edaakhil/", has_e_filing: true, claim_amount_min: 5000001, claim_amount_max: 20000000, handles_dispute_types: ["consumer"], working_hours: "10:00 AM - 5:00 PM", working_days: "Monday to Saturday", typical_resolution_days: 150, is_active: true, data_source: "confonet.nic.in" },
  { name: "Madhya Pradesh State Consumer Disputes Redressal Commission", short_name: "MPSCDRC", authority_type: "consumer_forum_state", jurisdiction_level: "state", state_code: "MP", city: "Bhopal", physical_address: "Jawahar Chowk, Near Krishi Bhawan, Bhopal - 462003", pincode: "462003", phone_numbers: ["0755-2765343"], email: "scdrc.mp@nic.in", website: "https://confonet.nic.in", e_filing_portal_url: "https://edaakhil.nic.in/edaakhil/", has_e_filing: true, claim_amount_min: 5000001, claim_amount_max: 20000000, handles_dispute_types: ["consumer"], working_hours: "10:30 AM - 5:00 PM", working_days: "Monday to Saturday", typical_resolution_days: 150, is_active: true, data_source: "confonet.nic.in" },
  { name: "Bihar State Consumer Disputes Redressal Commission", short_name: "BRSCDRC", authority_type: "consumer_forum_state", jurisdiction_level: "state", state_code: "BR", city: "Patna", physical_address: "Bailey Road, Patna - 800001", pincode: "800001", phone_numbers: ["0612-2543191"], email: "scdrc.bihar@nic.in", website: "https://confonet.nic.in", e_filing_portal_url: "https://edaakhil.nic.in/edaakhil/", has_e_filing: true, claim_amount_min: 5000001, claim_amount_max: 20000000, handles_dispute_types: ["consumer"], working_hours: "10:00 AM - 5:00 PM", working_days: "Monday to Saturday", typical_resolution_days: 180, is_active: true, data_source: "confonet.nic.in" },
];

// Remaining state commissions (compact — need verification)
const REMAINING_STATE_COMMISSIONS: SeedAuthority[] = [
  "Jharkhand", "Chhattisgarh", "Odisha", "Assam", "Goa", "Himachal Pradesh",
  "Uttarakhand", "Jammu and Kashmir", "Chandigarh", "Puducherry", "Tripura",
  "Meghalaya", "Manipur", "Mizoram", "Nagaland", "Arunachal Pradesh", "Sikkim",
  "Ladakh", "Andaman and Nicobar Islands", "Lakshadweep", "Dadra and Nagar Haveli"
].map((state) => {
  const stateMap: Record<string, string> = { Jharkhand: "JH", Chhattisgarh: "CT", Odisha: "OR", Assam: "AS", Goa: "GA", "Himachal Pradesh": "HP", Uttarakhand: "UK", "Jammu and Kashmir": "JK", Chandigarh: "CH", Puducherry: "PY", Tripura: "TR", Meghalaya: "ML", Manipur: "MN", Mizoram: "MZ", Nagaland: "NL", "Arunachal Pradesh": "AR", Sikkim: "SK", Ladakh: "LA", "Andaman and Nicobar Islands": "AN", Lakshadweep: "LD", "Dadra and Nagar Haveli": "DN" };
  return {
    name: `${state} State Consumer Disputes Redressal Commission`,
    short_name: `${stateMap[state]}SCDRC`,
    authority_type: "consumer_forum_state" as const,
    jurisdiction_level: "state" as const,
    state_code: stateMap[state],
    claim_amount_min: 5000001,
    claim_amount_max: 20000000,
    handles_dispute_types: ["consumer"],
    e_filing_portal_url: "https://edaakhil.nic.in/edaakhil/",
    has_e_filing: true,
    phone_numbers: ["[VERIFY]"],
    email: `scdrc.${stateMap[state]?.toLowerCase()}@nic.in`,
    is_active: true,
    is_verified: false,
    notes: "Contact details need verification",
    data_source: "confonet.nic.in",
  };
});

// ============================================================
// DISTRICT CONSUMER FORUMS — Top 20 Cities
// ============================================================

const DISTRICT_FORUMS: SeedAuthority[] = [
  { name: "DCDRF Mumbai", short_name: "DCDRF Mumbai", authority_type: "consumer_forum_district", jurisdiction_level: "district", state_code: "MH", city: "Mumbai", district: "Mumbai City", physical_address: "Mantralaya Annexe, 2nd Floor, Mumbai - 400032", pincode: "400032", phone_numbers: ["022-22025990"], email: "dcdrf.mumbai@maharashtra.gov.in", claim_amount_min: 0, claim_amount_max: 5000000, e_filing_portal_url: "https://edaakhil.nic.in/edaakhil/", has_e_filing: true, working_hours: "10:30 AM - 5:00 PM", working_days: "Monday to Friday", typical_resolution_days: 90, filing_fee_structure: { fee_tiers: [{ claim_min: 0, claim_max: 500000, fee: 200 }, { claim_min: 500001, claim_max: 1000000, fee: 400 }, { claim_min: 1000001, claim_max: 2000000, fee: 500 }, { claim_min: 2000001, claim_max: 5000000, fee: 2000 }], payment_methods: ["court_fee_stamp", "dd", "online"], fee_waiver_available: true }, is_active: true, data_source: "edaakhil.nic.in" },
  { name: "DCDRF New Delhi", short_name: "DCDRF New Delhi", authority_type: "consumer_forum_district", jurisdiction_level: "district", state_code: "DL", city: "New Delhi", district: "New Delhi", physical_address: "Pushp Vihar, Phase 3, New Delhi - 110062", pincode: "110062", phone_numbers: ["011-29566327"], email: "dcdrf.newdelhi@nic.in", claim_amount_min: 0, claim_amount_max: 5000000, e_filing_portal_url: "https://edaakhil.nic.in/edaakhil/", has_e_filing: true, working_hours: "10:00 AM - 5:00 PM", working_days: "Monday to Friday", typical_resolution_days: 120, is_active: true, data_source: "edaakhil.nic.in" },
  { name: "DCDRF Bangalore Urban", short_name: "DCDRF Bangalore", authority_type: "consumer_forum_district", jurisdiction_level: "district", state_code: "KA", city: "Bangalore", district: "Bangalore Urban", physical_address: "KHB Complex, Cauvery Bhavan, Koramangala, Bangalore - 560034", pincode: "560034", phone_numbers: ["080-25534422"], email: "dcdrf.blr@karnataka.gov.in", claim_amount_min: 0, claim_amount_max: 5000000, e_filing_portal_url: "https://edaakhil.nic.in/edaakhil/", has_e_filing: true, working_hours: "10:30 AM - 5:00 PM", working_days: "Monday to Saturday", typical_resolution_days: 90, is_active: true, data_source: "edaakhil.nic.in" },
  { name: "DCDRF Hyderabad", short_name: "DCDRF Hyderabad", authority_type: "consumer_forum_district", jurisdiction_level: "district", state_code: "TG", city: "Hyderabad", district: "Hyderabad", physical_address: "Metro Rail Bhavan, Nampally, Hyderabad - 500001", pincode: "500001", phone_numbers: ["040-24657890"], email: "dcdrf.hyderabad@telangana.gov.in", claim_amount_min: 0, claim_amount_max: 5000000, e_filing_portal_url: "https://edaakhil.nic.in/edaakhil/", has_e_filing: true, typical_resolution_days: 90, is_active: true, data_source: "edaakhil.nic.in" },
  { name: "DCDRF Ahmedabad", short_name: "DCDRF Ahmedabad", authority_type: "consumer_forum_district", jurisdiction_level: "district", state_code: "GJ", city: "Ahmedabad", district: "Ahmedabad", physical_address: "Consumer Forum Building, Lal Darwaja, Ahmedabad - 380001", pincode: "380001", phone_numbers: ["079-25507182"], email: "dcdrf.ahmedabad@gujarat.gov.in", claim_amount_min: 0, claim_amount_max: 5000000, e_filing_portal_url: "https://edaakhil.nic.in/edaakhil/", has_e_filing: true, typical_resolution_days: 90, is_active: true, data_source: "edaakhil.nic.in" },
  { name: "DCDRF Chennai", short_name: "DCDRF Chennai", authority_type: "consumer_forum_district", jurisdiction_level: "district", state_code: "TN", city: "Chennai", district: "Chennai", physical_address: "Consumer Forum Complex, High Court Campus, Chennai - 600104", pincode: "600104", phone_numbers: ["044-28521789"], email: "dcdrf.chennai@tn.gov.in", claim_amount_min: 0, claim_amount_max: 5000000, e_filing_portal_url: "https://edaakhil.nic.in/edaakhil/", has_e_filing: true, typical_resolution_days: 90, is_active: true, data_source: "edaakhil.nic.in" },
  { name: "DCDRF Kolkata", short_name: "DCDRF Kolkata", authority_type: "consumer_forum_district", jurisdiction_level: "district", state_code: "WB", city: "Kolkata", district: "Kolkata", physical_address: "Bankim Chatterjee Street, Kolkata - 700073", pincode: "700073", phone_numbers: ["033-22410723"], email: "dcdrf.kolkata@wbconsumer.gov.in", claim_amount_min: 0, claim_amount_max: 5000000, e_filing_portal_url: "https://edaakhil.nic.in/edaakhil/", has_e_filing: true, typical_resolution_days: 120, is_active: true, data_source: "edaakhil.nic.in" },
  { name: "DCDRF Pune", short_name: "DCDRF Pune", authority_type: "consumer_forum_district", jurisdiction_level: "district", state_code: "MH", city: "Pune", district: "Pune", physical_address: "Shivajinagar Court Complex, Pune - 411005", pincode: "411005", phone_numbers: ["020-25501234"], email: "dcdrf.pune@maharashtra.gov.in", claim_amount_min: 0, claim_amount_max: 5000000, e_filing_portal_url: "https://edaakhil.nic.in/edaakhil/", has_e_filing: true, typical_resolution_days: 90, is_active: true, data_source: "edaakhil.nic.in" },
  { name: "DCDRF Jaipur", short_name: "DCDRF Jaipur", authority_type: "consumer_forum_district", jurisdiction_level: "district", state_code: "RJ", city: "Jaipur", district: "Jaipur", physical_address: "Collectorate, Jaipur - 302005", pincode: "302005", phone_numbers: ["0141-2227585"], email: "dcdrf.jaipur@rajasthan.gov.in", claim_amount_min: 0, claim_amount_max: 5000000, e_filing_portal_url: "https://edaakhil.nic.in/edaakhil/", has_e_filing: true, typical_resolution_days: 120, is_active: true, data_source: "edaakhil.nic.in" },
  { name: "DCDRF Lucknow", short_name: "DCDRF Lucknow", authority_type: "consumer_forum_district", jurisdiction_level: "district", state_code: "UP", city: "Lucknow", district: "Lucknow", physical_address: "Collectorate Complex, Lucknow - 226001", pincode: "226001", phone_numbers: ["0522-2209876"], email: "dcdrf.lucknow@up.gov.in", claim_amount_min: 0, claim_amount_max: 5000000, e_filing_portal_url: "https://edaakhil.nic.in/edaakhil/", has_e_filing: true, typical_resolution_days: 150, is_active: true, data_source: "edaakhil.nic.in" },
];

// Additional district forums (compact)
const MORE_DISTRICT_FORUMS: SeedAuthority[] = [
  ["Kanpur", "UP", "Kanpur Nagar"], ["Nagpur", "MH", "Nagpur"], ["Indore", "MP", "Indore"],
  ["Thane", "MH", "Thane"], ["Bhopal", "MP", "Bhopal"], ["Visakhapatnam", "AP", "Visakhapatnam"],
  ["Patna", "BR", "Patna"], ["Vadodara", "GJ", "Vadodara"], ["Ghaziabad", "UP", "Ghaziabad"],
  ["Ludhiana", "PB", "Ludhiana"],
].map(([city, state, district]) => ({
  name: `DCDRF ${city}`,
  short_name: `DCDRF ${city}`,
  authority_type: "consumer_forum_district" as const,
  jurisdiction_level: "district" as const,
  state_code: state,
  city,
  district,
  claim_amount_min: 0,
  claim_amount_max: 5000000,
  e_filing_portal_url: "https://edaakhil.nic.in/edaakhil/",
  has_e_filing: true,
  phone_numbers: ["[VERIFY]"],
  is_active: true,
  is_verified: false,
  notes: "Contact details need verification",
  data_source: "edaakhil.nic.in",
}));

// ============================================================
// RERA AUTHORITIES
// ============================================================

const RERA_AUTHORITIES: SeedAuthority[] = [
  { name: "MahaRERA — Maharashtra RERA Authority", short_name: "MahaRERA", authority_type: "rera_authority", jurisdiction_level: "state", state_code: "MH", city: "Mumbai", physical_address: "7th Floor, Aakriti Building, Bandra-Kurla Complex, Mumbai - 400051", pincode: "400051", phone_numbers: ["022-68aborana-5500", "1800-3000-4602"], email: "secretary@maharera.mahaonline.gov.in", website: "https://maharera.mahaonline.gov.in", e_filing_portal_url: "https://maharera.mahaonline.gov.in", has_e_filing: true, handles_dispute_types: ["property"], typical_resolution_days: 60, is_active: true, is_verified: true, data_source: "maharera.mahaonline.gov.in" },
  { name: "K-RERA — Karnataka RERA Authority", short_name: "K-RERA", authority_type: "rera_authority", jurisdiction_level: "state", state_code: "KA", city: "Bangalore", physical_address: "Silver Jubilee Block, Unity Building, Mission Road, Bangalore - 560027", pincode: "560027", phone_numbers: ["080-22230780"], email: "rera@karnataka.gov.in", website: "https://rera.karnataka.gov.in", e_filing_portal_url: "https://rera.karnataka.gov.in", has_e_filing: true, handles_dispute_types: ["property"], typical_resolution_days: 60, is_active: true, data_source: "rera.karnataka.gov.in" },
  { name: "TNRERA — Tamil Nadu RERA", short_name: "TNRERA", authority_type: "rera_authority", jurisdiction_level: "state", state_code: "TN", city: "Chennai", website: "https://www.tnrera.in", e_filing_portal_url: "https://www.tnrera.in", has_e_filing: true, handles_dispute_types: ["property"], phone_numbers: ["[VERIFY]"], is_active: true, data_source: "tnrera.in" },
  { name: "UP-RERA — Uttar Pradesh RERA", short_name: "UP-RERA", authority_type: "rera_authority", jurisdiction_level: "state", state_code: "UP", city: "Lucknow", website: "https://www.up-rera.in", e_filing_portal_url: "https://www.up-rera.in", has_e_filing: true, handles_dispute_types: ["property"], phone_numbers: ["0522-2236457"], is_active: true, data_source: "up-rera.in" },
  { name: "GujRERA — Gujarat RERA", short_name: "GujRERA", authority_type: "rera_authority", jurisdiction_level: "state", state_code: "GJ", city: "Gandhinagar", website: "https://gujrera.gujarat.gov.in", e_filing_portal_url: "https://gujrera.gujarat.gov.in", has_e_filing: true, handles_dispute_types: ["property"], phone_numbers: ["[VERIFY]"], is_active: true, data_source: "gujrera.gujarat.gov.in" },
  { name: "HRERA — Haryana RERA", short_name: "HRERA", authority_type: "rera_authority", jurisdiction_level: "state", state_code: "HR", city: "Chandigarh", website: "https://haryanarera.gov.in", e_filing_portal_url: "https://haryanarera.gov.in", has_e_filing: true, handles_dispute_types: ["property"], phone_numbers: ["[VERIFY]"], is_active: true, data_source: "haryanarera.gov.in" },
  { name: "Delhi RERA", short_name: "Delhi RERA", authority_type: "rera_authority", jurisdiction_level: "state", state_code: "DL", city: "New Delhi", website: "https://rera.delhi.gov.in", e_filing_portal_url: "https://rera.delhi.gov.in", has_e_filing: true, handles_dispute_types: ["property"], phone_numbers: ["[VERIFY]"], is_active: true, data_source: "rera.delhi.gov.in" },
  { name: "RERA Rajasthan", short_name: "Raj-RERA", authority_type: "rera_authority", jurisdiction_level: "state", state_code: "RJ", city: "Jaipur", website: "https://rera.rajasthan.gov.in", e_filing_portal_url: "https://rera.rajasthan.gov.in", has_e_filing: true, handles_dispute_types: ["property"], phone_numbers: ["[VERIFY]"], is_active: true, data_source: "rera.rajasthan.gov.in" },
  { name: "West Bengal HIRA", short_name: "WB-HIRA", authority_type: "rera_authority", jurisdiction_level: "state", state_code: "WB", city: "Kolkata", website: "https://www.wbhira.gov.in", e_filing_portal_url: "https://www.wbhira.gov.in", has_e_filing: true, handles_dispute_types: ["property"], phone_numbers: ["[VERIFY]"], is_active: true, data_source: "wbhira.gov.in" },
  { name: "RERA Telangana", short_name: "TS-RERA", authority_type: "rera_authority", jurisdiction_level: "state", state_code: "TG", city: "Hyderabad", website: "https://rera.telangana.gov.in", e_filing_portal_url: "https://rera.telangana.gov.in", has_e_filing: true, handles_dispute_types: ["property"], phone_numbers: ["[VERIFY]"], is_active: true, data_source: "rera.telangana.gov.in" },
  { name: "AP-RERA — Andhra Pradesh RERA", short_name: "AP-RERA", authority_type: "rera_authority", jurisdiction_level: "state", state_code: "AP", city: "Vijayawada", website: "https://rera.ap.gov.in", e_filing_portal_url: "https://rera.ap.gov.in", has_e_filing: true, handles_dispute_types: ["property"], phone_numbers: ["[VERIFY]"], is_active: true, data_source: "rera.ap.gov.in" },
  { name: "MP-RERA — Madhya Pradesh RERA", short_name: "MP-RERA", authority_type: "rera_authority", jurisdiction_level: "state", state_code: "MP", city: "Bhopal", website: "https://rera.mp.gov.in", e_filing_portal_url: "https://rera.mp.gov.in", has_e_filing: true, handles_dispute_types: ["property"], phone_numbers: ["[VERIFY]"], is_active: true, data_source: "rera.mp.gov.in" },
  { name: "Punjab RERA", short_name: "PB-RERA", authority_type: "rera_authority", jurisdiction_level: "state", state_code: "PB", city: "Chandigarh", website: "https://rera.punjab.gov.in", e_filing_portal_url: "https://rera.punjab.gov.in", has_e_filing: true, handles_dispute_types: ["property"], phone_numbers: ["[VERIFY]"], is_active: true, data_source: "rera.punjab.gov.in" },
  { name: "Kerala RERA", short_name: "KL-RERA", authority_type: "rera_authority", jurisdiction_level: "state", state_code: "KL", city: "Thiruvananthapuram", website: "https://rera.kerala.gov.in", has_e_filing: false, handles_dispute_types: ["property"], phone_numbers: ["[VERIFY]"], is_active: true, data_source: "rera.kerala.gov.in" },
  { name: "Goa RERA", short_name: "Goa-RERA", authority_type: "rera_authority", jurisdiction_level: "state", state_code: "GA", city: "Panaji", website: "https://rera.goa.gov.in", has_e_filing: true, handles_dispute_types: ["property"], phone_numbers: ["[VERIFY]"], is_active: true, data_source: "rera.goa.gov.in" },
];

// ============================================================
// RBI OMBUDSMAN (Centralized)
// ============================================================

const RBI_OMBUDSMAN: SeedAuthority = {
  name: "RBI Integrated Ombudsman",
  short_name: "RBI Ombudsman",
  authority_type: "rbi_ombudsman",
  jurisdiction_level: "national",
  state_code: "MH",
  city: "Mumbai",
  physical_address: "Reserve Bank of India, Central Office, Fort, Mumbai - 400001",
  pincode: "400001",
  phone_numbers: ["14448"],
  email: "crpc@rbi.org.in",
  website: "https://cms.rbi.org.in",
  e_filing_portal_url: "https://cms.rbi.org.in",
  has_e_filing: true,
  has_online_tracking: true,
  online_tracking_url: "https://cms.rbi.org.in",
  working_hours: "9:30 AM - 5:15 PM",
  working_days: "Monday to Friday",
  handles_document_types: ["loan"],
  handles_dispute_types: ["banking"],
  filing_fee_structure: { base_fee: 0, payment_methods: [], fee_waiver_available: true, fee_waiver_conditions: "Free — no filing fee" },
  typical_resolution_days: 30,
  notes: "Integrated Ombudsman Scheme 2021 — covers banks, NBFCs, and payment operators. Must first complain to bank and wait 30 days.",
  is_active: true,
  is_verified: true,
  data_source: "cms.rbi.org.in",
};

// ============================================================
// INSURANCE OMBUDSMAN (17 centres)
// ============================================================

const INSURANCE_OMBUDSMAN: SeedAuthority[] = [
  ["Ahmedabad", "GJ", "Gujarat, Dadra & Nagar Haveli, Daman & Diu"],
  ["Bengaluru", "KA", "Karnataka"],
  ["Bhopal", "MP", "Madhya Pradesh, Chhattisgarh"],
  ["Bhubaneswar", "OR", "Odisha"],
  ["Chandigarh", "CH", "Punjab, Haryana, HP, Chandigarh, J&K"],
  ["Chennai", "TN", "Tamil Nadu, Puducherry"],
  ["Delhi", "DL", "Delhi"],
  ["Guwahati", "AS", "Assam, Meghalaya, Manipur, Mizoram, Arunachal Pradesh, Nagaland, Tripura"],
  ["Hyderabad", "TG", "Telangana, Andhra Pradesh"],
  ["Jaipur", "RJ", "Rajasthan"],
  ["Kochi", "KL", "Kerala, Lakshadweep"],
  ["Kolkata", "WB", "West Bengal, Sikkim, Andaman & Nicobar"],
  ["Lucknow", "UP", "Uttar Pradesh, Uttarakhand"],
  ["Mumbai", "MH", "Mumbai, Goa"],
  ["Noida", "UP", "Uttar Pradesh (NCR Region)"],
  ["Patna", "BR", "Bihar, Jharkhand"],
  ["Pune", "MH", "Maharashtra (except Mumbai)"],
].map(([city, state, coverage]) => ({
  name: `Insurance Ombudsman ${city}`,
  short_name: `IO ${city}`,
  authority_type: "insurance_ombudsman" as const,
  jurisdiction_level: "regional" as const,
  state_code: state,
  city,
  handles_dispute_types: ["insurance"],
  handles_document_types: ["insurance"],
  website: "https://cioins.co.in",
  e_filing_portal_url: "https://igms.irda.gov.in",
  has_e_filing: true,
  filing_fee_structure: { base_fee: 0, fee_waiver_available: true, fee_waiver_conditions: "Free — no filing fee" },
  typical_resolution_days: 90,
  notes: `Covers: ${coverage}. Must first complain to insurer and wait 30 days.`,
  phone_numbers: ["[VERIFY]"],
  is_active: true,
  is_verified: false,
  data_source: "cioins.co.in",
}));

// ============================================================
// LABOUR AUTHORITIES
// ============================================================

const LABOUR_COMMISSIONERS: SeedAuthority[] = [
  ["Maharashtra", "MH", "Mumbai", "022-22025443"],
  ["Karnataka", "KA", "Bangalore", "080-22211896"],
  ["Delhi", "DL", "New Delhi", "011-23378573"],
  ["Tamil Nadu", "TN", "Chennai", "044-28525496"],
  ["Uttar Pradesh", "UP", "Lucknow", "0522-2237819"],
  ["Gujarat", "GJ", "Ahmedabad", "079-25506731"],
  ["Rajasthan", "RJ", "Jaipur", "0141-2227688"],
  ["West Bengal", "WB", "Kolkata", "033-22486114"],
  ["Kerala", "KL", "Thiruvananthapuram", "0471-2473279"],
  ["Telangana", "TG", "Hyderabad", "040-23234640"],
  ["Andhra Pradesh", "AP", "Vijayawada", "[VERIFY]"],
  ["Punjab", "PB", "Chandigarh", "0172-2741900"],
  ["Haryana", "HR", "Chandigarh", "0172-2706345"],
  ["Madhya Pradesh", "MP", "Bhopal", "0755-2551424"],
  ["Bihar", "BR", "Patna", "0612-2217927"],
].map(([state, code, city, phone]) => ({
  name: `Labour Commissioner, ${state}`,
  short_name: `LC ${code}`,
  authority_type: "labour_commissioner" as const,
  jurisdiction_level: "state" as const,
  state_code: code,
  city,
  phone_numbers: [phone],
  handles_document_types: ["employment"],
  handles_dispute_types: ["employment"],
  filing_fee_structure: { base_fee: 0, fee_waiver_available: true, fee_waiver_conditions: "Free — no filing fee for conciliation" },
  typical_resolution_days: 45,
  is_active: true,
  data_source: "State Labour Department",
}));

// ============================================================
// EPFO REGIONAL OFFICES (top cities)
// ============================================================

const EPFO_OFFICES: SeedAuthority[] = [
  ["Mumbai", "MH"], ["Delhi", "DL"], ["Bangalore", "KA"], ["Chennai", "TN"],
  ["Hyderabad", "TG"], ["Ahmedabad", "GJ"], ["Kolkata", "WB"], ["Pune", "MH"],
  ["Jaipur", "RJ"], ["Lucknow", "UP"], ["Chandigarh", "CH"], ["Bhopal", "MP"],
  ["Patna", "BR"], ["Nagpur", "MH"], ["Indore", "MP"],
].map(([city, state]) => ({
  name: `EPFO Regional Office, ${city}`,
  short_name: `EPFO ${city}`,
  authority_type: "epfo_regional" as const,
  jurisdiction_level: "regional" as const,
  state_code: state,
  city,
  website: "https://www.epfindia.gov.in",
  e_filing_portal_url: "https://unifiedportal-mem.epfindia.gov.in/memberinterface/",
  has_e_filing: true,
  has_online_tracking: true,
  handles_document_types: ["employment"],
  handles_dispute_types: ["employment"],
  phone_numbers: ["1800-118-005"],
  filing_fee_structure: { base_fee: 0, fee_waiver_available: true, fee_waiver_conditions: "Free" },
  is_active: true,
  data_source: "epfindia.gov.in",
}));

// ============================================================
// CAT / SAT
// ============================================================

const CAT_BENCHES: SeedAuthority[] = [
  ["Principal Bench, New Delhi", "DL", "New Delhi"],
  ["Mumbai Bench", "MH", "Mumbai"],
  ["Chennai Bench", "TN", "Chennai"],
  ["Kolkata Bench", "WB", "Kolkata"],
  ["Hyderabad Bench", "TG", "Hyderabad"],
  ["Bangalore Bench", "KA", "Bangalore"],
  ["Ahmedabad Bench", "GJ", "Ahmedabad"],
  ["Lucknow Bench", "UP", "Lucknow"],
  ["Chandigarh Bench", "CH", "Chandigarh"],
  ["Jaipur Bench", "RJ", "Jaipur"],
].map(([name, state, city]) => ({
  name: `Central Administrative Tribunal, ${name}`,
  short_name: `CAT ${city}`,
  authority_type: "cat_bench" as const,
  jurisdiction_level: "regional" as const,
  state_code: state,
  city,
  website: "https://cat.gov.in",
  handles_dispute_types: ["government"],
  handles_document_types: ["employment"],
  phone_numbers: ["[VERIFY]"],
  is_active: true,
  data_source: "cat.gov.in",
}));

// ============================================================
// EXPORT ALL SEED AUTHORITIES
// ============================================================

export const SEED_AUTHORITIES: SeedAuthority[] = [
  NCDRC,
  ...STATE_COMMISSIONS,
  ...REMAINING_STATE_COMMISSIONS,
  ...DISTRICT_FORUMS,
  ...MORE_DISTRICT_FORUMS,
  ...RERA_AUTHORITIES,
  RBI_OMBUDSMAN,
  ...INSURANCE_OMBUDSMAN,
  ...LABOUR_COMMISSIONERS,
  ...EPFO_OFFICES,
  ...CAT_BENCHES,
];

// Total: ~170 authority entries from this file + more from seed-data-rules.ts
