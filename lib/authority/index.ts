// ============================================
// CLAUSEWALL — LEGAL AUTHORITY CONNECTOR
// Public API + SQL Migration
// ============================================

/*
═══════════════════════════════════════════════════════════════════
SQL MIGRATION — Run in Supabase SQL Editor
═══════════════════════════════════════════════════════════════════

-- ============================================================
-- 1. EXTEND legal_authorities TABLE
-- ============================================================

-- First drop if exists to avoid conflicts with old schema
-- If table already exists from graph seeding, we ALTER instead
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'legal_authorities') THEN
    -- Table exists from graph module — add missing columns
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS short_name TEXT;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS jurisdiction_level TEXT DEFAULT 'district';
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS state_code TEXT;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS city TEXT;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS district TEXT;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS covers_districts TEXT[] DEFAULT '{}';
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS covers_states TEXT[] DEFAULT '{}';
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS claim_amount_min NUMERIC DEFAULT 0;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS claim_amount_max NUMERIC;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS handles_document_types TEXT[] DEFAULT '{}';
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS handles_dispute_types TEXT[] DEFAULT '{}';
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS physical_address TEXT;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS pincode TEXT;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS phone_numbers TEXT[] DEFAULT '{}';
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS e_filing_portal_url TEXT;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS e_filing_instructions TEXT;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS google_maps_url TEXT;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS latitude NUMERIC;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS longitude NUMERIC;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS working_hours TEXT;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS working_days TEXT;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS closed_on TEXT;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS lunch_break TEXT;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS filing_fee_structure JSONB DEFAULT '{}';
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS required_documents TEXT[] DEFAULT '{}';
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS filing_process_steps JSONB DEFAULT '[]';
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS typical_resolution_days INT;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS current_backlog TEXT;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS success_rate_estimate NUMERIC;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS presiding_officer_name TEXT;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS presiding_officer_designation TEXT;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS has_e_filing BOOLEAN DEFAULT false;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS has_video_hearing BOOLEAN DEFAULT false;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS has_online_tracking BOOLEAN DEFAULT false;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS has_online_payment BOOLEAN DEFAULT false;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS online_tracking_url TEXT;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS parent_authority_id UUID;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS escalation_authority_id UUID;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS escalation_deadline_days INT;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS escalation_conditions TEXT;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS data_source TEXT;
    ALTER TABLE legal_authorities ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
    -- Rename existing columns if needed
    -- authority_name -> name, authority_type stays
  ELSE
    -- Create fresh table
    CREATE TABLE legal_authorities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      short_name TEXT,
      authority_type TEXT NOT NULL,
      jurisdiction_level TEXT NOT NULL DEFAULT 'district',
      state_code TEXT,
      city TEXT,
      district TEXT,
      covers_districts TEXT[] DEFAULT '{}',
      covers_states TEXT[] DEFAULT '{}',
      claim_amount_min NUMERIC DEFAULT 0,
      claim_amount_max NUMERIC,
      handles_document_types TEXT[] DEFAULT '{}',
      handles_dispute_types TEXT[] DEFAULT '{}',
      physical_address TEXT,
      pincode TEXT,
      phone_numbers TEXT[] DEFAULT '{}',
      email TEXT,
      website TEXT,
      e_filing_portal_url TEXT,
      e_filing_instructions TEXT,
      google_maps_url TEXT,
      latitude NUMERIC,
      longitude NUMERIC,
      working_hours TEXT,
      working_days TEXT,
      closed_on TEXT,
      lunch_break TEXT,
      filing_fee_structure JSONB DEFAULT '{}',
      required_documents TEXT[] DEFAULT '{}',
      filing_process_steps JSONB DEFAULT '[]',
      typical_resolution_days INT,
      current_backlog TEXT,
      success_rate_estimate NUMERIC,
      last_verified_at TIMESTAMPTZ,
      presiding_officer_name TEXT,
      presiding_officer_designation TEXT,
      has_e_filing BOOLEAN DEFAULT false,
      has_video_hearing BOOLEAN DEFAULT false,
      has_online_tracking BOOLEAN DEFAULT false,
      has_online_payment BOOLEAN DEFAULT false,
      online_tracking_url TEXT,
      parent_authority_id UUID,
      escalation_authority_id UUID,
      escalation_deadline_days INT,
      escalation_conditions TEXT,
      notes TEXT,
      data_source TEXT,
      is_active BOOLEAN DEFAULT true,
      is_verified BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
END $$;

-- ============================================================
-- 2. JURISDICTION RULES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS jurisdiction_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT,
  dispute_category TEXT,
  clause_types TEXT[] DEFAULT '{}',
  counterparty_type TEXT,
  jurisdiction_state TEXT,
  claim_amount_min NUMERIC,
  claim_amount_max NUMERIC,
  additional_conditions JSONB DEFAULT '{}',
  authority_type TEXT NOT NULL,
  priority INT DEFAULT 1,
  reasoning TEXT NOT NULL,
  not_this_reason TEXT,
  applicable_law TEXT,
  applicable_section TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. LEGAL AID PROVIDERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS legal_aid_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  state_code TEXT,
  city TEXT,
  district TEXT,
  address TEXT,
  pincode TEXT,
  phone_numbers TEXT[] DEFAULT '{}',
  email TEXT,
  website TEXT,
  helpline_number TEXT,
  income_threshold NUMERIC,
  eligible_categories TEXT[] DEFAULT '{}',
  eligibility_description TEXT,
  services_offered TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  operating_hours TEXT,
  is_free BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. ESCALATION TRACKING TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS escalation_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_id UUID,
  current_step INT DEFAULT 1,
  current_authority_id UUID,
  steps JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active',
  resolution_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. ADD authority_routing TO DOCUMENTS
-- ============================================================

ALTER TABLE documents ADD COLUMN IF NOT EXISTS authority_routing JSONB;

-- ============================================================
-- 6. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_authorities_type ON legal_authorities(authority_type);
CREATE INDEX IF NOT EXISTS idx_authorities_state ON legal_authorities(state_code);
CREATE INDEX IF NOT EXISTS idx_authorities_city ON legal_authorities(city);
CREATE INDEX IF NOT EXISTS idx_authorities_level ON legal_authorities(jurisdiction_level);
CREATE INDEX IF NOT EXISTS idx_authorities_active ON legal_authorities(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_authorities_claim ON legal_authorities(claim_amount_min, claim_amount_max);
CREATE INDEX IF NOT EXISTS idx_authorities_documents ON legal_authorities USING gin(handles_document_types);

CREATE INDEX IF NOT EXISTS idx_jurisdiction_rules_doc ON jurisdiction_rules(document_type);
CREATE INDEX IF NOT EXISTS idx_jurisdiction_rules_dispute ON jurisdiction_rules(dispute_category);
CREATE INDEX IF NOT EXISTS idx_jurisdiction_rules_state ON jurisdiction_rules(jurisdiction_state);

CREATE INDEX IF NOT EXISTS idx_legal_aid_state ON legal_aid_providers(state_code);
CREATE INDEX IF NOT EXISTS idx_legal_aid_city ON legal_aid_providers(city);
CREATE INDEX IF NOT EXISTS idx_legal_aid_type ON legal_aid_providers(provider_type);

CREATE INDEX IF NOT EXISTS idx_escalation_user ON escalation_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_escalation_document ON escalation_tracking(document_id);
CREATE INDEX IF NOT EXISTS idx_escalation_status ON escalation_tracking(status) WHERE status = 'active';

-- ============================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE legal_authorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurisdiction_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_aid_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_tracking ENABLE ROW LEVEL SECURITY;

-- Public read for reference data
CREATE POLICY "Anyone can read authorities" ON legal_authorities FOR SELECT USING (true);
CREATE POLICY "Anyone can read jurisdiction rules" ON jurisdiction_rules FOR SELECT USING (true);
CREATE POLICY "Anyone can read legal aid providers" ON legal_aid_providers FOR SELECT USING (true);

-- Private for user escalation data
CREATE POLICY "Users manage own escalation tracking" ON escalation_tracking FOR ALL USING (auth.uid() = user_id);

*/

// ---- Public Re-exports ----

export { determineJurisdiction, deriveDisputeCategory } from "./jurisdiction-router";
export { getAuthorityById, searchAuthorities, getAuthoritiesByType, getEscalationAuthority } from "./authority-db";
export { calculateFilingFee } from "./fee-calculator";
export { generateConnectivityLinks } from "./connectivity";
export { computeEscalationPath, computeDeadlines } from "./escalation-engine";
export { checkEligibility, findLegalAidProviders } from "./legal-aid-router";
export { generateRTI } from "./rti-generator";
export { draftComplaintEmail } from "./complaint-drafter";
