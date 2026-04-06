import { test, expect } from '@playwright/test';

test.describe('Golden Funnel', () => {
  test.beforeEach(async ({ context }) => {
    // Inject the development-only E2E bypass cookie to skip Supabase Auth gates
    await context.addCookies([
      {
        name: 'e2e-bypass-auth',
        value: 'true',
        domain: 'localhost',
        path: '/',
      }
    ]);
  });

  test('Upload/Paste flow UI renders correctly', async ({ page }) => {
    await page.goto('/upload');
    await expect(page).toHaveURL(/\/upload/);
    await expect(page.locator('text=Analyze Your Contract')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Paste Text')).toBeVisible();
  });

  test('Analyze page/progress UI renders correctly', async ({ page }) => {
    await page.goto('/analyze/e2e-mock-doc-123');
    await expect(page).toHaveURL(/\/analyze\/e2e-mock-doc-123/);
  });

  test('Results page shell renders after navigation', async ({ page }) => {
    await page.goto('/results/e2e-mock-doc-123');
    await expect(page).toHaveURL(/\/results\/e2e-mock-doc-123/);
  });
});
