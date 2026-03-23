// ============================================
// SCRIPT: CLASSIFY LAW CHANGES
// Classifies scraped changes that haven't
// been classified yet.
// Run: npx tsx scripts/classify-law-changes.ts
// ============================================

import { classifyPendingChanges } from "../lib/lawchange/classifier";

async function main() {
  console.log("🏷️  Starting law change classification...");
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log("");

  const result = await classifyPendingChanges();

  console.log("");
  console.log("═══════════════════════════════════════════");
  console.log("📊 CLASSIFICATION REPORT");
  console.log("═══════════════════════════════════════════");
  console.log(`Classified: ${result.classified}`);
  console.log(`Failed: ${result.failed}`);
  console.log("");
  console.log("✅ Classification complete.");
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
