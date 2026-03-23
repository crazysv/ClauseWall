// ============================================
// SCRIPT: SCRAPE LEGAL CHANGES
// Standalone script for GitHub Actions
// Run: npx tsx scripts/scrape-legal-changes.ts
// ============================================

import { runAllScrapers } from "../lib/lawchange/scrapers";

async function main() {
  console.log("🔍 Starting legal source scraping...");
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log("");

  const report = await runAllScrapers();

  console.log("");
  console.log("═══════════════════════════════════════════");
  console.log("📊 SCRAPING REPORT");
  console.log("═══════════════════════════════════════════");
  console.log(`Sources checked: ${report.sources_checked}`);
  console.log(`Sources succeeded: ${report.sources_succeeded}`);
  console.log(`Sources failed: ${report.sources_failed}`);
  console.log(`Total changes found: ${report.total_changes_found}`);
  console.log(`New changes stored: ${report.new_changes}`);
  console.log("");

  for (const result of report.results) {
    const icon = result.success ? "✅" : "❌";
    console.log(
      `  ${icon} ${result.source}: ${result.changes_found} found, ${result.new_changes} new (${result.duration_ms}ms)${
        result.error ? ` — ${result.error}` : ""
      }`
    );
  }

  console.log("");
  console.log("✅ Scraping complete.");

  // Exit with error code if ALL sources failed
  if (report.sources_succeeded === 0 && report.sources_checked > 0) {
    console.error("❌ All sources failed!");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
