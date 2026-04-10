-- ==========================================
-- PHASE 2: COLLECTIVE ACCESS MODEL MIGRATION
-- Enables RLS and Policy Enforcement for Collective Multi-user collaboration
-- ==========================================

-- 1. Helper Functions
-- Checks if the authenticated user is an active member of the specified collective
CREATE OR REPLACE FUNCTION public.is_collective_member(c_id UUID, u_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF u_id IS NULL THEN RETURN false; END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.collective_memberships
    WHERE collective_id = c_id 
      AND user_id = u_id 
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Checks if the authenticated user explicitly holds a coordinator or lead role
CREATE OR REPLACE FUNCTION public.is_collective_coordinator(c_id UUID, u_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF u_id IS NULL THEN RETURN false; END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.collective_memberships
    WHERE collective_id = c_id 
      AND user_id = u_id 
      AND is_active = true 
      AND role != 'member'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Explicitly grant execution rights to authenticated applications ONLY.
-- Anonymous external users (anon) have no access to invoke these directly or via RLS evaluation bounds.
GRANT EXECUTE ON FUNCTION public.is_collective_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_collective_coordinator(UUID, UUID) TO authenticated;


-- 2. High-Performance Indexing
-- Creating a composite index for lighting-fast membership lookups 
-- used strictly by the RLS helper functions.
CREATE INDEX IF NOT EXISTS idx_rls_collective_memberships_active 
ON public.collective_memberships (collective_id, user_id) 
WHERE is_active = true;

-- Ensure messages and actions are clustered efficiently by collective
CREATE INDEX IF NOT EXISTS idx_collective_messages_lookup 
ON public.collective_messages (collective_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_collective_actions_lookup 
ON public.collective_actions (collective_id, status);

-- Required Index for `collective_votes` Query Performance
-- Note on RLS performance: The RLS subquery "SELECT collective_id FROM collective_actions WHERE id = action_id"
-- relies on `collective_actions.id` being natively indexed as the Primary Key. 
-- However, an explicit index on `collective_votes(action_id)` MUST exist here so that the application's 
-- outer `SELECT * FROM collective_votes WHERE action_id = ?` queries avoid sequential scans, 
-- which would otherwise force Postgres to run the expensive RLS subquery on every row in the table.
CREATE INDEX IF NOT EXISTS idx_collective_votes_action_id 
ON public.collective_votes (action_id);


-- 3. Enable RLS Explicitly
ALTER TABLE public.collectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collective_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collective_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collective_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collective_votes ENABLE ROW LEVEL SECURITY;


-- 4. Table-Level RLS Policy Plan

-- A. Collectives Master Table
DROP POLICY IF EXISTS "Collectives are publicly readable" ON public.collectives;
CREATE POLICY "Collectives are publicly readable" 
ON public.collectives FOR SELECT 
TO anon, authenticated 
USING (true);

-- B. Collective Memberships
DROP POLICY IF EXISTS "Users can read own memberships" ON public.collective_memberships;
CREATE POLICY "Users can read own memberships" 
ON public.collective_memberships FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own memberships" ON public.collective_memberships;
CREATE POLICY "Users can create own memberships" 
ON public.collective_memberships FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own memberships" ON public.collective_memberships;
CREATE POLICY "Users can update own memberships" 
ON public.collective_memberships FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- C. Collective Messages
DROP POLICY IF EXISTS "Members can read messages" ON public.collective_messages;
CREATE POLICY "Members can read messages" 
ON public.collective_messages FOR SELECT 
TO authenticated 
USING (public.is_collective_member(collective_id, auth.uid()));

DROP POLICY IF EXISTS "Members can post messages" ON public.collective_messages;
CREATE POLICY "Members can post messages" 
ON public.collective_messages FOR INSERT 
TO authenticated 
WITH CHECK (public.is_collective_member(collective_id, auth.uid()));

DROP POLICY IF EXISTS "Coordinators can pin messages" ON public.collective_messages;
CREATE POLICY "Coordinators can pin messages" 
ON public.collective_messages FOR UPDATE 
TO authenticated 
USING (public.is_collective_coordinator(collective_id, auth.uid()))
WITH CHECK (public.is_collective_coordinator(collective_id, auth.uid()));

-- D. Collective Actions & Votes
-- Note: User-level records inside `collective_actions` are strictly IMMUTABLE for standard users.
-- Actions traverse logical stages (proposed -> voting -> approved) managed entirely by the 
-- Backend Service Role (which bypasses RLS) upon vote aggregations. Standard authenticated users 
-- have NO policy allowing `UPDATE` on this table.
DROP POLICY IF EXISTS "Members can view actions" ON public.collective_actions;
CREATE POLICY "Members can view actions" 
ON public.collective_actions FOR SELECT 
TO authenticated 
USING (public.is_collective_member(collective_id, auth.uid()));

DROP POLICY IF EXISTS "Members can propose actions" ON public.collective_actions;
CREATE POLICY "Members can propose actions" 
ON public.collective_actions FOR INSERT 
TO authenticated 
WITH CHECK (public.is_collective_member(collective_id, auth.uid()));

-- Votes
DROP POLICY IF EXISTS "Members can view votes" ON public.collective_votes;
CREATE POLICY "Members can view votes" 
ON public.collective_votes FOR SELECT 
TO authenticated 
USING (
  public.is_collective_member(
    (SELECT collective_id FROM public.collective_actions WHERE id = action_id), 
    auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can vote" ON public.collective_votes;
CREATE POLICY "Members can vote" 
ON public.collective_votes FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() = user_id AND 
  public.is_collective_member(
    (SELECT collective_id FROM public.collective_actions WHERE id = action_id), 
    auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can alter vote" ON public.collective_votes;
CREATE POLICY "Members can alter vote" 
ON public.collective_votes FOR UPDATE 
TO authenticated 
USING (
  auth.uid() = user_id AND 
  public.is_collective_member(
    (SELECT collective_id FROM public.collective_actions WHERE id = action_id), 
    auth.uid()
  )
)
WITH CHECK (
  auth.uid() = user_id AND 
  public.is_collective_member(
    (SELECT collective_id FROM public.collective_actions WHERE id = action_id), 
    auth.uid()
  )
);


-- ==========================================
-- ROLLBACK COMMANDS (Commented out)
-- Use these only to abort RLS enforcement and return to trusting unmitigated Admin bypass
-- ==========================================
/*
-- 1. Disable RLS locks
ALTER TABLE public.collectives DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.collective_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.collective_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.collective_actions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.collective_votes DISABLE ROW LEVEL SECURITY;

-- 2. Drop Helper Functions explicitly
DROP FUNCTION IF EXISTS public.is_collective_member(UUID, UUID);
DROP FUNCTION IF EXISTS public.is_collective_coordinator(UUID, UUID);

-- 3. Drop Custom Indexes
DROP INDEX IF EXISTS idx_rls_collective_memberships_active;
DROP INDEX IF EXISTS idx_collective_messages_lookup;
DROP INDEX IF EXISTS idx_collective_actions_lookup;
DROP INDEX IF EXISTS idx_collective_votes_action_id;

-- 4. Purge Policies
DROP POLICY IF EXISTS "Collectives are publicly readable" ON public.collectives;
DROP POLICY IF EXISTS "Users can read own memberships" ON public.collective_memberships;
DROP POLICY IF EXISTS "Users can create own memberships" ON public.collective_memberships;
DROP POLICY IF EXISTS "Users can update own memberships" ON public.collective_memberships;
DROP POLICY IF EXISTS "Members can read messages" ON public.collective_messages;
DROP POLICY IF EXISTS "Members can post messages" ON public.collective_messages;
DROP POLICY IF EXISTS "Coordinators can pin messages" ON public.collective_messages;
DROP POLICY IF EXISTS "Members can view actions" ON public.collective_actions;
DROP POLICY IF EXISTS "Members can propose actions" ON public.collective_actions;
DROP POLICY IF EXISTS "Members can view votes" ON public.collective_votes;
DROP POLICY IF EXISTS "Members can vote" ON public.collective_votes;
DROP POLICY IF EXISTS "Members can alter vote" ON public.collective_votes;
*/
