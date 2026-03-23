-- ============================================
-- COLLECTIVE BARGAINING ENGINE — DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- TABLE 1: collectives
-- ============================================
CREATE TABLE IF NOT EXISTS collectives (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_name text NOT NULL,
  entity_type text NOT NULL,
  normalized_entity_name text NOT NULL,
  status text DEFAULT 'forming',
  member_count integer DEFAULT 0,
  threshold integer DEFAULT 5,
  total_documents integer DEFAULT 0,
  common_violations jsonb DEFAULT '[]',
  total_financial_exposure numeric DEFAULT 0,
  individual_avg_exposure numeric DEFAULT 0,
  jurisdictions text[] DEFAULT '{}',
  primary_jurisdiction text,
  document_type text,
  description text,
  action_history jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  activated_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_collectives_normalized_name ON collectives (normalized_entity_name);
CREATE INDEX IF NOT EXISTS idx_collectives_status ON collectives (status);

ALTER TABLE collectives ENABLE ROW LEVEL SECURITY;

-- Public read for basic collective info (Wall of Shame concept)
CREATE POLICY "collectives_select_all" ON collectives
  FOR SELECT USING (true);

-- Only service role can insert/update
CREATE POLICY "collectives_insert_service" ON collectives
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "collectives_update_service" ON collectives
  FOR UPDATE USING (auth.role() = 'service_role');

-- ============================================
-- TABLE 2: collective_memberships
-- ============================================
CREATE TABLE IF NOT EXISTS collective_memberships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  collective_id uuid REFERENCES collectives(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_id text NOT NULL,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  document_id uuid,
  financial_exposure numeric,
  violation_types text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  opted_in_to_action boolean DEFAULT false,
  opted_in_to_communication boolean DEFAULT true,
  UNIQUE(collective_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON collective_memberships (user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_collective ON collective_memberships (collective_id);

ALTER TABLE collective_memberships ENABLE ROW LEVEL SECURITY;

-- Users can only see their own memberships
CREATE POLICY "memberships_select_own" ON collective_memberships
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "memberships_insert_own" ON collective_memberships
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "memberships_update_own" ON collective_memberships
  FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "memberships_delete_own" ON collective_memberships
  FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- ============================================
-- TABLE 3: collective_actions
-- ============================================
CREATE TABLE IF NOT EXISTS collective_actions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  collective_id uuid REFERENCES collectives(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'proposed',
  proposed_by text,
  proposed_at timestamptz DEFAULT now(),
  vote_result jsonb,
  generated_document text,
  participants_count integer DEFAULT 0,
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_actions_collective ON collective_actions (collective_id);

ALTER TABLE collective_actions ENABLE ROW LEVEL SECURITY;

-- Readable by members of the collective
CREATE POLICY "actions_select_members" ON collective_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM collective_memberships
      WHERE collective_memberships.collective_id = collective_actions.collective_id
      AND collective_memberships.user_id = auth.uid()
      AND collective_memberships.is_active = true
    )
    OR auth.role() = 'service_role'
  );

CREATE POLICY "actions_insert_members" ON collective_actions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM collective_memberships
      WHERE collective_memberships.collective_id = collective_actions.collective_id
      AND collective_memberships.user_id = auth.uid()
      AND collective_memberships.is_active = true
    )
    OR auth.role() = 'service_role'
  );

CREATE POLICY "actions_update_members" ON collective_actions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM collective_memberships
      WHERE collective_memberships.collective_id = collective_actions.collective_id
      AND collective_memberships.user_id = auth.uid()
      AND collective_memberships.is_active = true
    )
    OR auth.role() = 'service_role'
  );

-- ============================================
-- TABLE 4: collective_votes
-- ============================================
CREATE TABLE IF NOT EXISTS collective_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  action_id uuid REFERENCES collective_actions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  anonymous_id text NOT NULL,
  vote text NOT NULL,
  voted_at timestamptz DEFAULT now(),
  UNIQUE(action_id, user_id)
);

ALTER TABLE collective_votes ENABLE ROW LEVEL SECURITY;

-- Users can only see/insert their own votes
CREATE POLICY "votes_select_own" ON collective_votes
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "votes_insert_own" ON collective_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- ============================================
-- TABLE 5: collective_messages
-- ============================================
CREATE TABLE IF NOT EXISTS collective_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  collective_id uuid REFERENCES collectives(id) ON DELETE CASCADE,
  sender_anonymous_id text NOT NULL,
  message_type text DEFAULT 'discussion',
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_pinned boolean DEFAULT false,
  reply_to uuid REFERENCES collective_messages(id)
);

CREATE INDEX IF NOT EXISTS idx_messages_collective_time ON collective_messages (collective_id, created_at);

ALTER TABLE collective_messages ENABLE ROW LEVEL SECURITY;

-- Readable by members of the collective
CREATE POLICY "messages_select_members" ON collective_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM collective_memberships
      WHERE collective_memberships.collective_id = collective_messages.collective_id
      AND collective_memberships.user_id = auth.uid()
      AND collective_memberships.is_active = true
    )
    OR auth.role() = 'service_role'
  );

CREATE POLICY "messages_insert_members" ON collective_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM collective_memberships
      WHERE collective_memberships.collective_id = collective_messages.collective_id
      AND collective_memberships.user_id = auth.uid()
      AND collective_memberships.is_active = true
    )
    OR auth.role() = 'service_role'
  );

-- ============================================
-- TABLE 6: collective_notifications
-- ============================================
CREATE TABLE IF NOT EXISTS collective_notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  collective_id uuid REFERENCES collectives(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  description text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON collective_notifications (user_id, read);

ALTER TABLE collective_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON collective_notifications
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "notifications_update_own" ON collective_notifications
  FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "notifications_insert_service" ON collective_notifications
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- TABLE 7: legal_aid_organizations
-- ============================================
CREATE TABLE IF NOT EXISTS legal_aid_organizations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL,
  description text,
  coverage text,
  services text[],
  contact_phone text,
  contact_email text,
  website text,
  address text,
  free_service boolean DEFAULT true,
  eligibility text,
  jurisdictions text[],
  specializations text[]
);

-- No RLS — public reference data
ALTER TABLE legal_aid_organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "legal_aid_public_read" ON legal_aid_organizations
  FOR SELECT USING (true);

CREATE POLICY "legal_aid_insert_service" ON legal_aid_organizations
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- SEED DATA: Legal Aid Organizations
-- ============================================

INSERT INTO legal_aid_organizations (name, type, description, coverage, services, contact_phone, contact_email, website, address, free_service, eligibility, jurisdictions, specializations) VALUES

-- 1. NALSA
('National Legal Services Authority (NALSA)', 'government',
 'Apex body constituted under Legal Services Authorities Act 1987 to provide free legal services to weaker sections and organize Lok Adalats.',
 'Pan-India',
 ARRAY['free legal aid', 'legal awareness', 'victim compensation', 'lok adalat', 'ADR mediation'],
 '011-23382778', 'nalsa-dla@nic.in', 'https://nalsa.gov.in', '12/11 Jam Nagar House, Shahjahan Road, New Delhi - 110011',
 true, 'SC/ST, women, children, disabled, senior citizens, victims of trafficking, industrial workers, or income below ₹3,00,000/year',
 ARRAY['pan_india'], ARRAY['civil', 'criminal', 'consumer', 'labour', 'family']),

-- 2. District Legal Services Authority
('District Legal Services Authority (DLSA)', 'government',
 'Every district has a DLSA providing free legal aid, Lok Adalat, and mediation services to eligible persons.',
 'District-level',
 ARRAY['free legal aid', 'lok adalat', 'mediation', 'legal literacy camps'],
 NULL, NULL, 'https://doj.gov.in/legal-aid', NULL,
 true, 'Income below ₹3,00,000/year or SC/ST/women/disabled/senior citizen/industrial workman',
 ARRAY['pan_india'], ARRAY['civil', 'criminal', 'consumer', 'labour', 'family', 'rental']),

-- 3. Consumer Forum (District/State/National)
('Consumer Disputes Redressal Commission', 'consumer_forum',
 'Three-tier quasi-judicial mechanism under Consumer Protection Act 2019 for resolving consumer complaints. District (<₹1Cr), State (₹1-10Cr), National (>₹10Cr).',
 'Pan-India',
 ARRAY['consumer complaints', 'product liability', 'unfair trade practices', 'deficient services', 'representative complaints'],
 '1800-11-4000', NULL, 'https://consumerhelpline.gov.in', NULL,
 true, 'Free for claims below ₹5 lakh; nominal fee for higher amounts',
 ARRAY['pan_india'], ARRAY['consumer', 'banking', 'insurance', 'telecom', 'real_estate', 'e_commerce']),

-- 4. RERA Authority
('Real Estate Regulatory Authority (RERA)', 'government',
 'State-level authority under RERA Act 2016 for resolving real estate disputes, builder complaints, and delayed possession cases.',
 'State-level',
 ARRAY['real estate complaints', 'builder disputes', 'delayed possession', 'project registration verification', 'refund orders'],
 NULL, NULL, 'https://rera.gov.in', NULL,
 false, 'Any homebuyer or allottee with complaint against registered project',
 ARRAY['pan_india'], ARRAY['real_estate', 'rental', 'property']),

-- 5. RBI Integrated Ombudsman
('RBI Integrated Ombudsman', 'government',
 'Single-window complaint redressal for banking, NBFC, and digital payment issues under RBI Integrated Ombudsman Scheme 2021.',
 'Pan-India',
 ARRAY['banking complaints', 'loan disputes', 'credit card issues', 'digital payment complaints', 'NBFC complaints', 'unauthorized transactions'],
 '14448', NULL, 'https://cms.rbi.org.in', 'Reserve Bank of India, Central Office, Mumbai',
 true, 'Any customer of a bank, NBFC, or payment system participant',
 ARRAY['pan_india'], ARRAY['banking', 'loan', 'credit_card', 'digital_payment', 'nbfc']),

-- 6. Insurance Ombudsman
('Insurance Ombudsman', 'government',
 'Resolves complaints against insurance companies for claims up to ₹30 lakh (life) and ₹20 lakh (general). Free, binding orders.',
 'Pan-India',
 ARRAY['insurance claim disputes', 'policy issues', 'claim rejection', 'delay in settlement', 'premium disputes'],
 '155255', NULL, 'http://www.cioins.co.in', NULL,
 true, 'Any policyholder or claimant with dispute up to ₹30 lakh',
 ARRAY['pan_india'], ARRAY['insurance', 'health_insurance', 'life_insurance', 'motor_insurance']),

-- 7. Labour Commissioner
('Labour Commissioner Office', 'government',
 'State-level authority for resolving employment disputes, wage complaints, unfair termination, and workplace issues under various labour laws.',
 'State-level',
 ARRAY['wage disputes', 'unfair termination', 'workplace issues', 'provident fund complaints', 'gratuity disputes', 'contract labour issues'],
 NULL, NULL, NULL, NULL,
 true, 'Any employee or worker with workplace dispute',
 ARRAY['pan_india'], ARRAY['employment', 'labour', 'wages', 'termination']),

-- 8. CUTS International
('CUTS International', 'ngo',
 'Consumer Unity & Trust Society — leading consumer advocacy NGO working on competition, consumer protection, and regulatory issues since 1983.',
 'Pan-India',
 ARRAY['consumer advocacy', 'policy research', 'legal support', 'capacity building', 'competition policy'],
 '0141-2282821', 'cuts@cuts.org', 'https://cuts-international.org', 'D-217 Bhaskar Marg, Bani Park, Jaipur 302016',
 true, NULL,
 ARRAY['pan_india'], ARRAY['consumer', 'competition', 'governance']),

-- 9. Consumer Voice
('Consumer Voice', 'ngo',
 'Leading consumer rights organization conducting product testing, advocacy, and consumer education. Publishes comparative product reviews.',
 'Pan-India',
 ARRAY['consumer testing', 'product safety advocacy', 'consumer education', 'complaint resolution support'],
 '011-24116060', 'info@consumer-voice.org', 'https://consumer-voice.org', 'F-9 Kailash Colony, New Delhi 110048',
 true, NULL,
 ARRAY['pan_india'], ARRAY['consumer', 'product_safety', 'food_safety']),

-- 10. Mumbai Grahak Panchayat
('Mumbai Grahak Panchayat', 'ngo',
 'One of India''s largest consumer organizations, active since 1975. Provides consumer counseling, complaint resolution, and legal aid in Maharashtra.',
 'Maharashtra',
 ARRAY['consumer counseling', 'complaint resolution', 'legal aid', 'consumer awareness'],
 '022-24131486', 'mgp@vsnl.com', 'https://mumbaigrahakpanchayat.org', 'Sahakar Bhavan, Mumbai',
 true, NULL,
 ARRAY['maharashtra'], ARRAY['consumer', 'housing', 'utilities']),

-- 11. Karnataka State Legal Services Authority
('Karnataka State Legal Services Authority', 'government',
 'State-level legal services authority providing free legal aid, Lok Adalat, and mediation services in Karnataka.',
 'Karnataka',
 ARRAY['free legal aid', 'lok adalat', 'mediation', 'legal awareness', 'victim compensation'],
 '080-22110617', 'kslsa@nic.in', 'https://kslsa.kar.nic.in', 'High Court Buildings, Bangalore 560001',
 true, 'Income below ₹3,00,000/year or eligible category',
 ARRAY['karnataka'], ARRAY['civil', 'criminal', 'consumer', 'labour', 'family', 'rental']),

-- 12. Delhi State Legal Services Authority
('Delhi State Legal Services Authority (DSLSA)', 'government',
 'Provides free legal services, Lok Adalat, and victim compensation in Delhi/NCR region.',
 'Delhi',
 ARRAY['free legal aid', 'lok adalat', 'mediation', 'legal awareness camps'],
 '011-23073200', 'dslsa.delhi@nic.in', 'https://dslsa.org', 'Patiala House Courts Complex, New Delhi',
 true, 'Income below ₹3,00,000/year or eligible category',
 ARRAY['delhi'], ARRAY['civil', 'criminal', 'consumer', 'labour', 'family', 'rental']),

-- 13. Maharashtra State Legal Services Authority
('Maharashtra State Legal Services Authority', 'government',
 'State-level legal services authority for Maharashtra providing free legal aid and Lok Adalat.',
 'Maharashtra',
 ARRAY['free legal aid', 'lok adalat', 'mediation', 'pre-litigation settlement'],
 '022-22620873', NULL, 'https://mahalsa.gov.in', 'High Court, Bombay, Fort, Mumbai',
 true, 'Income below ₹3,00,000/year or eligible category',
 ARRAY['maharashtra'], ARRAY['civil', 'criminal', 'consumer', 'labour', 'family', 'rental']),

-- 14. Tamil Nadu State Legal Services Authority
('Tamil Nadu State Legal Services Authority', 'government',
 'Provides free legal aid and dispute resolution services across Tamil Nadu.',
 'Tamil Nadu',
 ARRAY['free legal aid', 'lok adalat', 'mediation', 'legal literacy'],
 '044-25340846', NULL, 'https://tnslsa.gov.in', 'High Court Campus, Chennai',
 true, 'Income below ₹3,00,000/year or eligible category',
 ARRAY['tamil_nadu'], ARRAY['civil', 'criminal', 'consumer', 'labour', 'family', 'rental']),

-- 15. Telecom Regulatory Authority of India
('Telecom Regulatory Authority of India (TRAI)', 'government',
 'Regulator for telecom services. Handles complaints about billing, service quality, and unfair practices by telecom operators.',
 'Pan-India',
 ARRAY['telecom complaints', 'billing disputes', 'service quality', 'tariff issues', 'spam/DND violations'],
 '1800-11-3000', 'cp@trai.gov.in', 'https://trai.gov.in', 'Mahanagar Doorsanchar Bhawan, New Delhi',
 true, 'Any telecom subscriber',
 ARRAY['pan_india'], ARRAY['telecom', 'internet', 'broadband']);
