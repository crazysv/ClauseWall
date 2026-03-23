// ============================================
// SCRIPT: ANALYZE LAW IMPACT
// Analyzes impact of classified changes on
// stored contracts.
// Run: npx tsx scripts/analyze-law-impact.ts
// ============================================

import { analyzeAllPendingChanges } from "../lib/lawchange/impact-analyzer";

async function main() {
  console.log("⚖️  Starting law change impact analysis...");
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log("");

  const result = await analyzeAllPendingChanges();

  console.log("");
  console.log("═══════════════════════════════════════════");
  console.log("📊 IMPACT ANALYSIS REPORT");
  console.log("═══════════════════════════════════════════");
  console.log(`Changes analyzed: ${result.analyzed}`);
  console.log(`Impacts created: ${result.impacts_created}`);
  console.log("");
  console.log("✅ Impact analysis complete.");
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
