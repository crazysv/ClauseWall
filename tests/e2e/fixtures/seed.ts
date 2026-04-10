import { createClient } from '@supabase/supabase-js';

/**
 * Minimum viable fixture to unblock the Collective Walled Garden RLS tests.
 * Generates the target collective, actions, and specifically structured users.
 */
export async function setupWalledGardenFixture() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.warn('[E2E Fixture] SUPABASE_SERVICE_ROLE_KEY not found. Skipping DB seed.');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // 1. Create a mock collective
  const { data: collective, error: colError } = await supabase.from('collectives').upsert({
    id: '00000000-0000-0000-0000-000000001234',
    entity_name: 'E2E Testing Collective',
    entity_type: 'Test',
    normalized_entity_name: 'e2e testing collective',
    threshold: 1,
    status: 'forming'
  }).select().single();

  if (colError || !collective) {
    console.error('[E2E Fixture] Failed to create collective:', colError);
    return;
  }

  // 2. Create an action to retrieve
  await supabase.from('collective_actions').upsert({
    id: '00000000-0000-0000-0000-000000005678',
    collective_id: collective.id,
    action_type: 'custom',
    title: 'Test RLS Action',
    description: 'This is an action used for RLS boundary checks.',
    status: 'proposed'
  });

  // 3. Helper to create explicitly walled users
  async function createTestUser(email: string, isActive: boolean | null) {
    // Attempt Admin Create (This works even if user exists; just returns error we can ignore/swallow)
    const { data: authData } = await supabase.auth.admin.createUser({
      email,
      password: 'TestPassword123!',
      email_confirm: true,
    });

    let userId = authData?.user?.id;

    // If user already exists, find their ID
    if (!userId) {
      const { data: users } = await supabase.auth.admin.listUsers();
      userId = users?.users.find(u => u.email === email)?.id;
    }

    if (isActive !== null && userId) {
      // Upsert membership
      await supabase.from('collective_memberships').upsert({
        collective_id: collective.id,
        user_id: userId,
        anonymous_id: `Anon-${Math.floor(Math.random()*1000)}`,
        is_active: isActive,
        role: 'member'
      }, { onConflict: 'collective_id,user_id' });
    }
  }

  // Active verified member
  await createTestUser('member@test.com', true);
  // User explicitly kicked / voluntarily left
  await createTestUser('kicked@test.com', false);
  // Pure internet user completely unassociated
  await createTestUser('nonmember@test.com', null);
  
  console.log('[E2E Fixture] Test Database Seeded Successfully.');
}
