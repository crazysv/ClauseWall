import { test, expect } from '@playwright/test';

test.describe('Core Engine Golden Path', () => {
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

  test('Complete Upload -> Analysis Trigger Funnel', async ({ page }) => {
    // 1. Navigate to Upload Gateway
    await page.goto('/upload');
    await expect(page.locator('text=Analyze Your Contract')).toBeVisible({ timeout: 10000 });

    // 2. Switch to Paste Text mode to avoid file system dependency in CI
    await page.locator('button', { hasText: 'Paste Text' }).click();
    
    // 3. Inject a dense mock contract that passes the 50-character validation minimum
    const mockContractText = `
      MOCK EMPLOYMENT AGREEMENT
      1. This is a legally binding contract for testing the Claude AI ingestion engine.
      2. The employee agrees to work indefinitely without compensation.
      3. The employer retains all rights to the employee's soul.
      This dummy text guarantees the 50 character limit is surpassed for quick-scans natively.
    `;
    await page.locator('textarea').fill(mockContractText);

    // 4. Set Required Metadata via Radix Selectors
    // Select Document Type
    await page.locator('button:has-text("Select type...")').click();
    await page.locator('[role="option"]:has-text("Employment / Offer Letter")').click();

    // Select Jurisdiction
    await page.locator('button:has-text("Select state...")').click();
    await page.locator('[role="option"]:has-text("Maharashtra")').click();

    // 5. Trigger Analysis Engine
    const analyzeButton = page.locator('button', { hasText: /SCAN CONTRACT/i });
    await expect(analyzeButton).toBeEnabled({ timeout: 5000 });
    await analyzeButton.click();

    await expect(
      page.locator('text=/Quick Scanning|Instant Analysis|Contract Analysis/i').first()
    ).toBeVisible({ timeout: 15000 });
    
    /* 
      GAP EXPLANATION:
      At this juncture, the test intentionally stops short of waiting for the final `/api/quick-scan` JSON.
      Why?
      Because in an un-mocked CI environment, this attempts to hit the live OpenAI/Anthropic 
      API and real Supabase vector database, which inherently risks throwing HTTP 500s due to 
      missing environment secrets or causing massive CI bill-runup.
      
      To push this test to assert final Risk Scores, we will need to inject structured Playwright 
      Route interceptions (`page.route('/api/analyze', route => route.fulfill(...))`) in the 
      subsequent Production QA phase.
      
      However, getting to the "Extracting text" overlay proves the UI State Machine,
      React Forms, Zod Validations, and local model abstractions did not crash.
    */
  });
});
