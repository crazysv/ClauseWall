import { test, expect, Page } from '@playwright/test';
import { setupWalledGardenFixture } from './fixtures/seed';

// ============================================
// Walled Garden Security Specifications
// Note: These tests assume a pre-seeded test database environment
// containing a specific collective and three test accounts:
// 1. member@test.com (Active)
// 2. nonmember@test.com (Not part of collective)
// 3. kicked@test.com (is_active = false)
// ============================================

test.describe('Collective Walled Garden Privacy Integration', () => {

  test.beforeAll(async () => {
    // Attempt to seed data using the service role bypass.
    await setupWalledGardenFixture();
  });

  const TEST_COLLECTIVE_ID = '00000000-0000-0000-0000-000000001234';

  // UI Login Helper mapping to standard Auth route
  async function loginAs(page: Page, email: string) {
    await page.goto('/auth/login');
    // Using standard selectors. If custom UI is used, these may need adjusting.
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    // Wait for the native redirect to resolve
    await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {});
  }

  test.describe('Non-Member Boundaries', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, 'nonmember@test.com');
    });

    test('non-member attempting to fetch actions receives an empty array instead of data', async ({ page }) => {
      // Bypassing UI to directly hit the API endpoint protected by RLS
      const response = await page.request.get(`/api/collective/${TEST_COLLECTIVE_ID}/actions`);
      expect(response.ok()).toBeTruthy(); // RLS doesn't 403, it just filters out rows
      
      const actions = await response.json();
      expect(actions).toEqual([]); // Engine successfully suppresses discoverability
    });

    test('non-member cannot access the collective dashboard UI natively', async ({ page }) => {
      await page.goto(`/collective/${TEST_COLLECTIVE_ID}`);
      // Application level must conceal the walled action history from the UI
      await expect(page.locator('body')).not.toContainText('Test RLS Action');
    });
  });

  test.describe('Verified Member Boundaries', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, 'member@test.com');
    });

    test('active member can read actions and access dashboard', async ({ page }) => {
      const response = await page.request.get(`/api/collective/${TEST_COLLECTIVE_ID}/actions`);
      expect(response.ok()).toBeTruthy();
      
      const actions = await response.json();
      // Should at least receive the seed data action
      expect(actions.length).toBeGreaterThan(0);
    });
  });

  test.describe('Revoked Member Boundaries', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, 'kicked@test.com');
    });

    test('kicked member automatically loses visibility to actions via DB-level RLS revocation', async ({ page }) => {
      const response = await page.request.get(`/api/collective/${TEST_COLLECTIVE_ID}/actions`);
      expect(response.ok()).toBeTruthy();
      
      // Because `is_active` became false in memberships, the RLS subquery structurally fails
      const actions = await response.json();
      expect(actions).toEqual([]);
    });


  });

});
