// ============================================
// WATCHDOG PUBLIC API
// Re-exports all watchdog modules
// ============================================

export { scrapeToSPage, scrapeWithRetry } from "./scraper";
export { cleanHtml, splitIntoParagraphs, calculateReadability } from "./text-cleaner";
export { getLatestSnapshot, saveSnapshot, getSnapshotHistory, getCompaniesDueForScrape, getCompanyChanges, saveChangeRecord } from "./snapshot-manager";
export { performSemanticDiff } from "./semantic-diff";
export { classifyChanges, shouldAlert, getHighestSeverity, getChangesNeedingLegalityCheck } from "./change-classifier";
export { checkChangeLegality } from "./legality-checker";
export { calculateTosScore, getScoreColor, getScoreLabel } from "./score-calculator";
export { getCompanies, getCompanyBySlug, seedCompanies, COMPANY_SEED_DATA, SECTOR_LABELS, SECTOR_ICONS } from "./company-registry";
export { dispatchAlerts } from "./alert-dispatcher";
export { createCampaign, signCampaign, getCampaigns, getCampaignById, getCampaignSignatories } from "./campaign-manager";
export { runWatchdogCron } from "./cron-handler";
