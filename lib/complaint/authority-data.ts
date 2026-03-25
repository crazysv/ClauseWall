// ============================================
// STATIC AUTHORITY DATABASE
// Indian regulatory authorities for complaints
// Real addresses, phones, portals
// ============================================

import type { Authority, AuthorityType } from '@/types';

// ═══ NATIONAL AUTHORITIES ═══

const NATIONAL_AUTHORITIES: Authority[] = [
  {
    id: 'ncdrc',
    type: 'consumer_forum_national',
    level: 'national',
    name: 'National Consumer Disputes Redressal Commission',
    short_name: 'NCDRC',
    state: null,
    district: null,
    address: 'Upbhokta Nyay Bhawan, F-Block, GPO Complex, INA, New Delhi - 110023',
    phone: '011-24651992',
    email: 'ncdrc-dca@nic.in',
    portal_url: 'https://edaakhil.nic.in',
    portal_name: 'e-Daakhil',
    filing_method: 'both',
    jurisdiction_description: 'Claims above ₹10 crore and appeals from State Commissions',
    working_hours: 'Mon-Fri 10:00 AM - 5:00 PM',
    pincode: '110023',
    latitude: 28.5787,
    longitude: 77.2145,
    is_active: true,
  },
  {
    id: 'ccpa',
    type: 'ccpa',
    level: 'national',
    name: 'Central Consumer Protection Authority',
    short_name: 'CCPA',
    state: null,
    district: null,
    address: 'Krishi Bhawan, Dr. Rajendra Prasad Road, New Delhi - 110001',
    phone: '1800-11-4000',
    email: 'ccpa-doca@gov.in',
    portal_url: 'https://consumerhelpline.gov.in',
    portal_name: 'National Consumer Helpline',
    filing_method: 'both',
    jurisdiction_description: 'Class action, misleading advertisements, unfair trade practices (national)',
    working_hours: 'Mon-Sat 9:30 AM - 5:30 PM (Helpline)',
    pincode: '110001',
    latitude: 28.6145,
    longitude: 77.2088,
    is_active: true,
  },
  {
    id: 'tdsat',
    type: 'tdsat',
    level: 'national',
    name: 'Telecom Disputes Settlement & Appellate Tribunal',
    short_name: 'TDSAT',
    state: null,
    district: null,
    address: 'Gate No. 3, Lodhi Road Institutional Area, New Delhi - 110003',
    phone: '011-24363045',
    email: 'tdsat@nic.in',
    portal_url: 'https://tdsat.gov.in',
    portal_name: 'TDSAT Website',
    filing_method: 'both',
    jurisdiction_description: 'Telecom and broadcasting disputes; appeals against TRAI orders',
    working_hours: 'Mon-Fri 10:00 AM - 5:00 PM',
    pincode: '110003',
    latitude: 28.5856,
    longitude: 77.2273,
    is_active: true,
  },
  {
    id: 'trai',
    type: 'trai',
    level: 'national',
    name: 'Telecom Regulatory Authority of India',
    short_name: 'TRAI',
    state: null,
    district: null,
    address: 'Mahanagar Doorsanchar Bhawan, J.L. Nehru Marg, New Delhi - 110002',
    phone: '011-23236308',
    email: 'ap@trai.gov.in',
    portal_url: 'https://trai.gov.in',
    portal_name: 'TRAI Website',
    filing_method: 'online',
    jurisdiction_description: 'Telecom service quality complaints',
    working_hours: 'Mon-Fri 9:30 AM - 6:00 PM',
    pincode: '110002',
    latitude: 28.6242,
    longitude: 77.2381,
    is_active: true,
  },
  {
    id: 'rbi-ombudsman',
    type: 'rbi_ombudsman',
    level: 'national',
    name: 'RBI Integrated Ombudsman',
    short_name: 'RBI IO',
    state: null,
    district: null,
    address: 'Reserve Bank of India, Central Office, Mumbai - 400001',
    phone: '14448',
    email: 'crpc@rbi.org.in',
    portal_url: 'https://cms.rbi.org.in',
    portal_name: 'CMS Portal',
    filing_method: 'online',
    jurisdiction_description: 'Complaints against banks, NBFCs, and payment system participants. FREE to file.',
    working_hours: 'Mon-Fri 10:00 AM - 5:00 PM',
    pincode: '400001',
    latitude: 18.9333,
    longitude: 72.8352,
    is_active: true,
  },
  {
    id: 'irdai',
    type: 'irdai',
    level: 'national',
    name: 'Insurance Regulatory and Development Authority of India',
    short_name: 'IRDAI',
    state: null,
    district: null,
    address: 'Survey No. 115/1, Financial District, Nanakramguda, Hyderabad - 500032',
    phone: '040-20204000',
    email: 'complaints@irdai.gov.in',
    portal_url: 'https://igms.irda.gov.in',
    portal_name: 'IGMS Portal',
    filing_method: 'both',
    jurisdiction_description: 'Insurance regulatory complaints',
    working_hours: 'Mon-Fri 10:00 AM - 5:30 PM',
    pincode: '500032',
    latitude: 17.4121,
    longitude: 78.3481,
    is_active: true,
  },
  {
    id: 'nalsa',
    type: 'legal_aid',
    level: 'national',
    name: 'National Legal Services Authority',
    short_name: 'NALSA',
    state: null,
    district: null,
    address: '12/11, Jam Nagar House, Shahjahan Road, New Delhi - 110011',
    phone: '011-23382778',
    email: 'nalsa-doj@nic.in',
    portal_url: 'https://nalsa.gov.in',
    portal_name: 'NALSA',
    filing_method: 'both',
    jurisdiction_description: 'Free legal aid for eligible persons (income < ₹3 lakh, SC/ST, women, disabled)',
    working_hours: 'Mon-Fri 10:00 AM - 5:00 PM',
    pincode: '110011',
    latitude: 28.6105,
    longitude: 77.2217,
    is_active: true,
  },
];

// ═══ STATE-LEVEL AUTHORITIES ═══
// Major states' consumer commissions, RERA, labour commissioners

const STATE_AUTHORITIES: Authority[] = [
  // Maharashtra
  { id: 'mh-scdrc', type: 'consumer_forum_state', level: 'state', name: 'Maharashtra State Consumer Disputes Redressal Commission', short_name: 'MSCDRC', state: 'MH', district: null, address: 'New Administrative Building, 11th Floor, Opposite Mantralaya, Mumbai - 400032', phone: '022-22025539', email: null, portal_url: 'https://edaakhil.nic.in', portal_name: 'e-Daakhil', filing_method: 'both', jurisdiction_description: 'Claims ₹1 crore to ₹10 crore in Maharashtra', working_hours: 'Mon-Fri 10:30 AM - 5:00 PM', pincode: '400032', latitude: 18.9256, longitude: 72.8260, is_active: true },
  { id: 'mh-rera', type: 'rera_state', level: 'state', name: 'Maharashtra RERA (MahaRERA)', short_name: 'MahaRERA', state: 'MH', district: null, address: 'Pratishtha, 10th Floor, MHADA Bldg, Bandra East, Mumbai - 400051', phone: '022-26598012', email: 'complaint.maharera@gmail.com', portal_url: 'https://maharera.mahaonline.gov.in', portal_name: 'MahaRERA Portal', filing_method: 'online', jurisdiction_description: 'Real estate complaints in Maharashtra under RERA 2016', working_hours: 'Mon-Fri 10:30 AM - 5:30 PM', pincode: '400051', latitude: 19.0607, longitude: 72.8691, is_active: true },
  { id: 'mh-labour', type: 'labour_commissioner', level: 'state', name: 'Labour Commissioner, Maharashtra', short_name: 'Labour Comm MH', state: 'MH', district: null, address: 'Commerce Centre, Tardeo, Mumbai - 400034', phone: '022-23538662', email: null, portal_url: 'https://mahakamgar.maharashtra.gov.in', portal_name: 'MahaKamgar', filing_method: 'both', jurisdiction_description: 'Labour disputes in Maharashtra', working_hours: 'Mon-Sat 10:00 AM - 5:00 PM', pincode: '400034', latitude: 18.9727, longitude: 72.8120, is_active: true },
  { id: 'mh-cdrf-mumbai', type: 'consumer_forum_district', level: 'district', name: 'District Consumer Disputes Redressal Forum, Mumbai', short_name: 'DCDRF Mumbai', state: 'MH', district: 'Mumbai', address: 'Udyog Bhawan, Parel, Mumbai - 400012', phone: '022-24143695', email: null, portal_url: 'https://edaakhil.nic.in', portal_name: 'e-Daakhil', filing_method: 'both', jurisdiction_description: 'Claims up to ₹1 crore in Mumbai district', working_hours: 'Mon-Sat 10:30 AM - 5:00 PM', pincode: '400012', latitude: 19.0036, longitude: 72.8435, is_active: true },
  { id: 'mh-cdrf-pune', type: 'consumer_forum_district', level: 'district', name: 'District Consumer Disputes Redressal Forum, Pune', short_name: 'DCDRF Pune', state: 'MH', district: 'Pune', address: 'Collectorate Building, Pune - 411001', phone: '020-26122275', email: null, portal_url: 'https://edaakhil.nic.in', portal_name: 'e-Daakhil', filing_method: 'both', jurisdiction_description: 'Claims up to ₹1 crore in Pune district', working_hours: 'Mon-Sat 10:30 AM - 5:00 PM', pincode: '411001', latitude: 18.5204, longitude: 73.8567, is_active: true },

  // Delhi
  { id: 'dl-scdrc', type: 'consumer_forum_state', level: 'state', name: 'Delhi State Consumer Disputes Redressal Commission', short_name: 'DSCDRC', state: 'DL', district: null, address: 'C-Block, Vikas Bhawan Extension, ITO, New Delhi - 110002', phone: '011-23379574', email: null, portal_url: 'https://edaakhil.nic.in', portal_name: 'e-Daakhil', filing_method: 'both', jurisdiction_description: 'Claims ₹1 crore to ₹10 crore in Delhi', working_hours: 'Mon-Fri 10:00 AM - 5:00 PM', pincode: '110002', latitude: 28.6328, longitude: 77.2473, is_active: true },
  { id: 'dl-rera', type: 'rera_state', level: 'state', name: 'Delhi RERA', short_name: 'Delhi RERA', state: 'DL', district: null, address: 'IP Estate, New Delhi', phone: null, email: null, portal_url: 'https://rera.delhi.gov.in', portal_name: 'Delhi RERA', filing_method: 'online', jurisdiction_description: 'Real estate complaints in Delhi under RERA 2016', working_hours: 'Mon-Fri 10:00 AM - 5:00 PM', pincode: '110002', latitude: 28.6310, longitude: 77.2480, is_active: true },
  { id: 'dl-cdrf', type: 'consumer_forum_district', level: 'district', name: 'District Consumer Disputes Redressal Forum, New Delhi', short_name: 'DCDRF Delhi', state: 'DL', district: 'New Delhi', address: 'Patiala House Courts, New Delhi - 110001', phone: '011-23386492', email: null, portal_url: 'https://edaakhil.nic.in', portal_name: 'e-Daakhil', filing_method: 'both', jurisdiction_description: 'Claims up to ₹1 crore in Delhi', working_hours: 'Mon-Sat 10:00 AM - 5:00 PM', pincode: '110001', latitude: 28.6185, longitude: 77.2385, is_active: true },
  { id: 'dl-labour', type: 'labour_commissioner', level: 'state', name: 'Labour Commissioner, Delhi', short_name: 'Labour Comm DL', state: 'DL', district: null, address: '5, Sham Nath Marg, Civil Lines, Delhi - 110054', phone: '011-23962306', email: null, portal_url: 'https://labour.delhi.gov.in', portal_name: 'Delhi Labour', filing_method: 'offline', jurisdiction_description: 'Labour disputes in Delhi NCT', working_hours: 'Mon-Fri 9:30 AM - 5:30 PM', pincode: '110054', latitude: 28.6781, longitude: 77.2292, is_active: true },
  { id: 'dl-rent', type: 'rent_control', level: 'state', name: 'Delhi Rent Controller', short_name: 'Rent Ctrl DL', state: 'DL', district: null, address: 'Tis Hazari Court Complex, Delhi - 110054', phone: null, email: null, portal_url: null, portal_name: null, filing_method: 'offline', jurisdiction_description: 'Rent control disputes in Delhi', working_hours: 'Mon-Sat 10:00 AM - 5:00 PM', pincode: '110054', latitude: 28.6634, longitude: 77.2290, is_active: true },

  // Karnataka
  { id: 'ka-scdrc', type: 'consumer_forum_state', level: 'state', name: 'Karnataka State Consumer Disputes Redressal Commission', short_name: 'KSCDRC', state: 'KA', district: null, address: 'Consumer Forum Complex, Cauvery Bhavan, Bangalore - 560009', phone: '080-22100301', email: null, portal_url: 'https://edaakhil.nic.in', portal_name: 'e-Daakhil', filing_method: 'both', jurisdiction_description: 'Claims ₹1 crore to ₹10 crore in Karnataka', working_hours: 'Mon-Fri 10:30 AM - 5:00 PM', pincode: '560009', latitude: 12.9716, longitude: 77.5946, is_active: true },
  { id: 'ka-rera', type: 'rera_state', level: 'state', name: 'Karnataka RERA', short_name: 'K-RERA', state: 'KA', district: null, address: '1st Floor, Silver Jubilee Block, Unity Building, Bangalore - 560001', phone: '080-22384666', email: null, portal_url: 'https://rera.karnataka.gov.in', portal_name: 'K-RERA Portal', filing_method: 'online', jurisdiction_description: 'Real estate complaints in Karnataka', working_hours: 'Mon-Fri 10:00 AM - 5:30 PM', pincode: '560001', latitude: 12.9791, longitude: 77.5913, is_active: true },
  { id: 'ka-cdrf-bangalore', type: 'consumer_forum_district', level: 'district', name: 'District Consumer Disputes Redressal Forum, Bangalore Urban', short_name: 'DCDRF Bangalore', state: 'KA', district: 'Bangalore', address: 'Cauvery Bhavan, KG Road, Bangalore - 560009', phone: '080-22100301', email: null, portal_url: 'https://edaakhil.nic.in', portal_name: 'e-Daakhil', filing_method: 'both', jurisdiction_description: 'Claims up to ₹1 crore in Bangalore Urban', working_hours: 'Mon-Sat 10:30 AM - 5:00 PM', pincode: '560009', latitude: 12.9718, longitude: 77.5749, is_active: true },

  // Tamil Nadu
  { id: 'tn-scdrc', type: 'consumer_forum_state', level: 'state', name: 'Tamil Nadu State Consumer Disputes Redressal Commission', short_name: 'TNSCDRC', state: 'TN', district: null, address: 'Ezhilagam, Chepauk, Chennai - 600005', phone: '044-28544259', email: null, portal_url: 'https://edaakhil.nic.in', portal_name: 'e-Daakhil', filing_method: 'both', jurisdiction_description: 'Claims ₹1 crore to ₹10 crore in Tamil Nadu', working_hours: 'Mon-Fri 10:30 AM - 5:00 PM', pincode: '600005', latitude: 13.0618, longitude: 80.2825, is_active: true },
  { id: 'tn-rera', type: 'rera_state', level: 'state', name: 'Tamil Nadu RERA', short_name: 'TN-RERA', state: 'TN', district: null, address: 'TNRERA, 1st Avenue, Ashok Nagar, Chennai - 600083', phone: '044-24898888', email: null, portal_url: 'https://tnrera.in', portal_name: 'TNRERA Portal', filing_method: 'online', jurisdiction_description: 'Real estate complaints in Tamil Nadu', working_hours: 'Mon-Fri 10:00 AM - 5:45 PM', pincode: '600083', latitude: 13.0358, longitude: 80.2176, is_active: true },
  { id: 'tn-cdrf-chennai', type: 'consumer_forum_district', level: 'district', name: 'District Consumer Disputes Redressal Forum, Chennai', short_name: 'DCDRF Chennai', state: 'TN', district: 'Chennai', address: 'Consumer Forum, Purasaiwalkam, Chennai - 600007', phone: '044-26423999', email: null, portal_url: 'https://edaakhil.nic.in', portal_name: 'e-Daakhil', filing_method: 'both', jurisdiction_description: 'Claims up to ₹1 crore in Chennai', working_hours: 'Mon-Sat 10:30 AM - 5:00 PM', pincode: '600007', latitude: 13.0827, longitude: 80.2707, is_active: true },

  // Uttar Pradesh
  { id: 'up-scdrc', type: 'consumer_forum_state', level: 'state', name: 'Uttar Pradesh State Consumer Disputes Redressal Commission', short_name: 'UPSCDRC', state: 'UP', district: null, address: 'Lal Bahadur Shastri Bhawan, Lucknow - 226001', phone: '0522-2237532', email: null, portal_url: 'https://edaakhil.nic.in', portal_name: 'e-Daakhil', filing_method: 'both', jurisdiction_description: 'Claims ₹1 crore to ₹10 crore in UP', working_hours: 'Mon-Sat 10:00 AM - 5:00 PM', pincode: '226001', latitude: 26.8467, longitude: 80.9462, is_active: true },
  { id: 'up-rera', type: 'rera_state', level: 'state', name: 'Uttar Pradesh RERA', short_name: 'UP-RERA', state: 'UP', district: null, address: 'Indira Bhawan, Ashok Marg, Lucknow - 226001', phone: '0522-2235178', email: null, portal_url: 'https://up-rera.in', portal_name: 'UP-RERA Portal', filing_method: 'online', jurisdiction_description: 'Real estate complaints in UP', working_hours: 'Mon-Sat 10:00 AM - 5:00 PM', pincode: '226001', latitude: 26.8504, longitude: 80.9481, is_active: true },
  { id: 'up-cdrf-lucknow', type: 'consumer_forum_district', level: 'district', name: 'District Consumer Disputes Redressal Forum, Lucknow', short_name: 'DCDRF Lucknow', state: 'UP', district: 'Lucknow', address: 'Lucknow Collectorate Complex, Lucknow - 226001', phone: null, email: null, portal_url: 'https://edaakhil.nic.in', portal_name: 'e-Daakhil', filing_method: 'both', jurisdiction_description: 'Claims up to ₹1 crore in Lucknow', working_hours: 'Mon-Sat 10:00 AM - 5:00 PM', pincode: '226001', latitude: 26.8468, longitude: 80.9461, is_active: true },

  // Gujarat, Telangana, Rajasthan, West Bengal, Haryana (state commissions)
  { id: 'gj-scdrc', type: 'consumer_forum_state', level: 'state', name: 'Gujarat State Consumer Disputes Redressal Commission', short_name: 'GSCDRC', state: 'GJ', district: null, address: 'Block No. 18, 3rd Floor, New Sachivalaya, Gandhinagar - 382010', phone: '079-23253591', email: null, portal_url: 'https://edaakhil.nic.in', portal_name: 'e-Daakhil', filing_method: 'both', jurisdiction_description: 'Claims ₹1 crore to ₹10 crore in Gujarat', working_hours: 'Mon-Sat 10:30 AM - 5:00 PM', pincode: '382010', latitude: 23.2156, longitude: 72.6369, is_active: true },
  { id: 'ts-scdrc', type: 'consumer_forum_state', level: 'state', name: 'Telangana State Consumer Disputes Redressal Commission', short_name: 'TSCDRC', state: 'TS', district: null, address: 'Red Hills, Nampally, Hyderabad - 500001', phone: '040-24652724', email: null, portal_url: 'https://edaakhil.nic.in', portal_name: 'e-Daakhil', filing_method: 'both', jurisdiction_description: 'Claims ₹1 crore to ₹10 crore in Telangana', working_hours: 'Mon-Sat 10:30 AM - 5:30 PM', pincode: '500001', latitude: 17.3850, longitude: 78.4867, is_active: true },
  { id: 'rj-scdrc', type: 'consumer_forum_state', level: 'state', name: 'Rajasthan State Consumer Disputes Redressal Commission', short_name: 'RSCDRC', state: 'RJ', district: null, address: 'Vidhyadhar Nagar, Jaipur - 302023', phone: '0141-2233413', email: null, portal_url: 'https://edaakhil.nic.in', portal_name: 'e-Daakhil', filing_method: 'both', jurisdiction_description: 'Claims ₹1 crore to ₹10 crore in Rajasthan', working_hours: 'Mon-Sat 10:00 AM - 5:00 PM', pincode: '302023', latitude: 26.9124, longitude: 75.7873, is_active: true },
  { id: 'wb-scdrc', type: 'consumer_forum_state', level: 'state', name: 'West Bengal State Consumer Disputes Redressal Commission', short_name: 'WBSCDRC', state: 'WB', district: null, address: 'Purta Bhawan, DF Block, Salt Lake, Kolkata - 700091', phone: '033-23345850', email: null, portal_url: 'https://edaakhil.nic.in', portal_name: 'e-Daakhil', filing_method: 'both', jurisdiction_description: 'Claims ₹1 crore to ₹10 crore in West Bengal', working_hours: 'Mon-Fri 10:30 AM - 5:00 PM', pincode: '700091', latitude: 22.5726, longitude: 88.3639, is_active: true },
  { id: 'hr-scdrc', type: 'consumer_forum_state', level: 'state', name: 'Haryana State Consumer Disputes Redressal Commission', short_name: 'HSCDRC', state: 'HR', district: null, address: 'Sector 14, Panchkula - 134109', phone: '0172-2590780', email: null, portal_url: 'https://edaakhil.nic.in', portal_name: 'e-Daakhil', filing_method: 'both', jurisdiction_description: 'Claims ₹1 crore to ₹10 crore in Haryana', working_hours: 'Mon-Sat 10:00 AM - 5:00 PM', pincode: '134109', latitude: 30.6942, longitude: 76.8606, is_active: true },
  { id: 'hr-rera', type: 'rera_state', level: 'state', name: 'Haryana RERA', short_name: 'H-RERA', state: 'HR', district: null, address: 'Sector 6, Panchkula, Haryana - 134109', phone: '0172-2567099', email: null, portal_url: 'https://haryanarera.gov.in', portal_name: 'H-RERA Portal', filing_method: 'online', jurisdiction_description: 'Real estate complaints in Haryana', working_hours: 'Mon-Sat 10:00 AM - 5:00 PM', pincode: '134109', latitude: 30.6950, longitude: 76.8613, is_active: true },

  // Insurance Ombudsman Offices (major cities)
  { id: 'io-mumbai', type: 'insurance_ombudsman', level: 'state', name: 'Insurance Ombudsman, Mumbai', short_name: 'IO Mumbai', state: 'MH', district: 'Mumbai', address: '3rd Floor, Jeevan Seva Annexe, SV Road, Santacruz West, Mumbai - 400054', phone: '022-26106889', email: 'baboroins.mumbai@cioins.co.in', portal_url: 'https://igms.irda.gov.in', portal_name: 'IGMS', filing_method: 'both', jurisdiction_description: 'Insurance complaints for MH, Goa (claims ≤ ₹30 lakh)', working_hours: 'Mon-Fri 10:00 AM - 5:00 PM', pincode: '400054', latitude: 19.0823, longitude: 72.8377, is_active: true },
  { id: 'io-delhi', type: 'insurance_ombudsman', level: 'state', name: 'Insurance Ombudsman, Delhi', short_name: 'IO Delhi', state: 'DL', district: null, address: '2/2A, Universal Insurance Building, Asaf Ali Road, New Delhi - 110002', phone: '011-23239633', email: 'baboroins.delhi@cioins.co.in', portal_url: 'https://igms.irda.gov.in', portal_name: 'IGMS', filing_method: 'both', jurisdiction_description: 'Insurance complaints for Delhi, Rajasthan, Haryana (claims ≤ ₹30 lakh)', working_hours: 'Mon-Fri 10:00 AM - 5:00 PM', pincode: '110002', latitude: 28.6369, longitude: 77.2406, is_active: true },
  { id: 'io-chennai', type: 'insurance_ombudsman', level: 'state', name: 'Insurance Ombudsman, Chennai', short_name: 'IO Chennai', state: 'TN', district: null, address: 'Fatima Akhtar Court, 4th Floor, 453, Anna Salai, Teynampet, Chennai - 600018', phone: '044-24333668', email: 'baboroins.chennai@cioins.co.in', portal_url: 'https://igms.irda.gov.in', portal_name: 'IGMS', filing_method: 'both', jurisdiction_description: 'Insurance complaints for TN, Puducherry (claims ≤ ₹30 lakh)', working_hours: 'Mon-Fri 10:00 AM - 5:00 PM', pincode: '600018', latitude: 13.0441, longitude: 80.2511, is_active: true },
  { id: 'io-kolkata', type: 'insurance_ombudsman', level: 'state', name: 'Insurance Ombudsman, Kolkata', short_name: 'IO Kolkata', state: 'WB', district: null, address: 'Hindustan Building, 4th Floor, 4, CR Avenue, Kolkata - 700072', phone: '033-22124346', email: 'baboroins.kolkata@cioins.co.in', portal_url: 'https://igms.irda.gov.in', portal_name: 'IGMS', filing_method: 'both', jurisdiction_description: 'Insurance complaints for WB, Sikkim, Andaman (claims ≤ ₹30 lakh)', working_hours: 'Mon-Fri 10:00 AM - 5:00 PM', pincode: '700072', latitude: 22.5726, longitude: 88.3639, is_active: true },
  { id: 'io-hyderabad', type: 'insurance_ombudsman', level: 'state', name: 'Insurance Ombudsman, Hyderabad', short_name: 'IO Hyderabad', state: 'TS', district: null, address: '6-2-46, 1st Floor, Moin Court, AC Guards, Hyderabad - 500004', phone: '040-23312122', email: 'baboroins.hyderabad@cioins.co.in', portal_url: 'https://igms.irda.gov.in', portal_name: 'IGMS', filing_method: 'both', jurisdiction_description: 'Insurance complaints for TS, AP (claims ≤ ₹30 lakh)', working_hours: 'Mon-Fri 10:00 AM - 5:00 PM', pincode: '500004', latitude: 17.3976, longitude: 78.4748, is_active: true },
  { id: 'io-bangalore', type: 'insurance_ombudsman', level: 'state', name: 'Insurance Ombudsman, Bangalore', short_name: 'IO Bangalore', state: 'KA', district: null, address: '24, Ground Floor, Jeevan Soudha Building, KG Road, Bangalore - 560009', phone: '080-22222049', email: 'baboroins.bengaluru@cioins.co.in', portal_url: 'https://igms.irda.gov.in', portal_name: 'IGMS', filing_method: 'both', jurisdiction_description: 'Insurance complaints for Karnataka (claims ≤ ₹30 lakh)', working_hours: 'Mon-Fri 10:00 AM - 5:00 PM', pincode: '560009', latitude: 12.9621, longitude: 77.5741, is_active: true },
];

// ═══ COMBINED DATABASE ═══

export const AUTHORITIES: Authority[] = [
  ...NATIONAL_AUTHORITIES,
  ...STATE_AUTHORITIES,
];

// ═══ LOOKUP HELPERS ═══

export function getAuthoritiesByType(type: AuthorityType): Authority[] {
  return AUTHORITIES.filter(a => a.type === type && a.is_active);
}

export function getAuthoritiesByState(state: string): Authority[] {
  return AUTHORITIES.filter(a => (a.state === state || a.level === 'national') && a.is_active);
}

export function getAuthorityById(id: string): Authority | null {
  return AUTHORITIES.find(a => a.id === id) || null;
}

export function getAuthorityTypeLabel(type: AuthorityType): string {
  const labels: Record<AuthorityType, string> = {
    consumer_forum_district: 'District Consumer Forum',
    consumer_forum_state: 'State Consumer Commission',
    consumer_forum_national: 'National Consumer Commission',
    rera_state: 'State RERA',
    rent_control: 'Rent Controller',
    rbi_ombudsman: 'RBI Ombudsman',
    insurance_ombudsman: 'Insurance Ombudsman',
    irdai: 'IRDAI',
    labour_commissioner: 'Labour Commissioner',
    industrial_tribunal: 'Industrial Tribunal',
    trai: 'TRAI',
    tdsat: 'TDSAT',
    ccpa: 'CCPA',
    cyber_crime: 'Cyber Crime Cell',
    district_magistrate: 'District Magistrate',
    legal_aid: 'Legal Services Authority',
  };
  return labels[type] || type;
}
