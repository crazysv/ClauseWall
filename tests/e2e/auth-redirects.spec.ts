import { test, expect } from '@playwright/test';

test.describe('Auth Redirect Protection', () => {
  test('unauthenticated user trying to access /upload is severely redirected to login', async ({ page }) => {
    await page.goto('/upload');
    // The middleware should proactively redirect us natively
    await expect(page).toHaveURL(/.*\/auth\/login.*/);
    const params = new URL(page.url()).searchParams;
    expect(params.get('redirect')).toBe('/upload');
  });

  test('unauthenticated user trying to access /analyze gets cleanly bounced to login', async ({ page }) => {
    await page.goto('/analyze/123-mock-id');
    await expect(page).toHaveURL(/.*\/auth\/login.*/);
  });
});
