import { test, expect } from '@playwright/test';

test.describe('Public Routes Sanity', () => {
  test('Landing page serves properly to public viewers', async ({ page }) => {
    await page.goto('/');
    // Should NOT redirect to /auth/login
    await expect(page).toHaveURL('/');
    // Check basic integrity of shell loaded
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('Wall of Shame serves to public', async ({ page }) => {
    await page.goto('/wall-of-shame');
    await expect(page).toHaveURL('/wall-of-shame');
  });

  test('Watchdog index serves properly publicly', async ({ page }) => {
    await page.goto('/watchdog');
    await expect(page).toHaveURL('/watchdog');
  });

  test('Market Intelligence serves publicly', async ({ page }) => {
    await page.goto('/market');
    await expect(page).toHaveURL('/market');
  });
});
