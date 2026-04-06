const { chromium } = require('playwright');
const http = require('http');

(async () => {
  // Wait for the dev server to be available
  console.log("Checking if http://localhost:3000 is open...");
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addCookies([
    {
      name: 'e2e-bypass-auth',
      value: 'true',
      url: 'http://localhost:3000',
      path: '/'
    }
  ]);
  const page = await context.newPage();
  
  try {
    console.log("Navigating to /upload...");
    await page.goto('http://localhost:3000/upload', { timeout: 10000 });
    console.log("URL is:", page.url());
    const content = await page.content();
    console.log("Content size:", content.length);
    if (content.includes("Analyze Your Contract")) {
        console.log("Analyze Your Contract text FOUND!");
    } else {
        console.log("Text NOT FOUND.\n", content.slice(0, 1000));
    }
  } catch (err) {
    console.error("Failed to load page:", err);
  }
  await browser.close();
})();
