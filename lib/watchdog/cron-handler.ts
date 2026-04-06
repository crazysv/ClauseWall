// ============================================
// CRON HANDLER
// Main orchestrator for scheduled ToS monitoring
// ============================================

import { getCompaniesDueForScrape, updateCompanyScrapedAt, saveSnapshot, getLatestSnapshot, saveChangeRecord } from "./snapshot-manager";
import { scrapeWithRetry } from "./scraper";
import { calculateReadability } from "./text-cleaner";
import { performSemanticDiff } from "./semantic-diff";
import { classifyChanges } from "./change-classifier";
import { checkChangeLegality } from "./legality-checker";
import { dispatchAlerts } from "./alert-dispatcher";
import type { MonitoredCompany, TosDocType } from "@/types";
import type { CronRunResult } from "./types";
import { log } from "@/lib/logger";

/**
 * Run the watchdog cron job
 */
export async function runWatchdogCron(maxCompanies = 10): Promise<CronRunResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let companiesProcessed = 0;
  let companiesSkipped = 0;
  let changesDetected = 0;
  let alertsSent = 0;

  log.info("watchdog.cron", "Starting watchdog cron");

  try {
    const companies = await getCompaniesDueForScrape(maxCompanies);
    log.info("watchdog.cron", "Companies due for scraping", { count: companies.length });

    for (const company of companies) {
      try {
        const result = await processCompany(company);
        companiesProcessed++;

        if (result.changesDetected > 0) {
          changesDetected += result.changesDetected;
          alertsSent += result.alertsSent;
        }
      } catch (err) {
        const msg = `Failed to process ${company.name}: ${(err as Error).message}`;
        log.error("watchdog.cron", msg);
        errors.push(msg);
        companiesSkipped++;
      }

      // Rate limit: 2 seconds between companies
      await new Promise((r) => setTimeout(r, 2000));
    }
  } catch (err) {
    errors.push(`Cron init error: ${(err as Error).message}`);
  }

  const result: CronRunResult = {
    companies_processed: companiesProcessed,
    companies_skipped: companiesSkipped,
    changes_detected: changesDetected,
    alerts_sent: alertsSent,
    errors,
    duration_ms: Date.now() - startTime,
  };

  log.info("watchdog.cron", "Cron run complete", { companiesProcessed, companiesSkipped, changesDetected, alertsSent, durationMs: result.duration_ms, errorCount: errors.length });
  return result;
}

/**
 * Process a single company: scrape all ToS URLs, diff, classify, alert
 */
async function processCompany(company: MonitoredCompany): Promise<{
  changesDetected: number;
  alertsSent: number;
}> {
  let changesDetected = 0;
  let alertsSent = 0;

  const tosUrls = company.tos_urls as Array<{ label: string; url: string; type: string }>;

  for (const tosEntry of tosUrls) {
    try {
      log.info("watchdog", "Scraping company", { company: company.name, tosLabel: tosEntry.label });

      // Scrape
      const scrapeResult = await scrapeWithRetry(
        tosEntry.url,
        (company.scrape_config as Record<string, unknown>) as import("./types").ScrapeConfig | undefined
      );

      if (!scrapeResult.success || !scrapeResult.clean_text) {
        log.warn("watchdog", "Scrape failed", { company: company.name, tosType: tosEntry.type });
        continue;
      }

      // Get latest snapshot for comparison
      const latestSnapshot = await getLatestSnapshot(company.id, tosEntry.type as TosDocType);

      // Save new snapshot
      const readability = calculateReadability(scrapeResult.clean_text);
      const { snapshot: newSnapshot, isNew } = await saveSnapshot(
        company.id,
        tosEntry.type as TosDocType,
        {
          raw_html: scrapeResult.raw_html,
          clean_text: scrapeResult.clean_text,
          text_hash: scrapeResult.text_hash,
          word_count: scrapeResult.word_count,
          readability_score: readability,
          section_count: scrapeResult.sections.length,
          url_scraped: tosEntry.url,
          scrape_status: "success",
        }
      );

      if (!isNew || !newSnapshot) {
        log.debug("watchdog", "No change detected", { company: company.name, tosType: tosEntry.type });
        continue;
      }

      // If we have a previous snapshot, perform diff
      if (latestSnapshot && latestSnapshot.clean_text) {
        log.info("watchdog", "Change detected, running diff", { company: company.name, tosType: tosEntry.type });

        const diffResult = await performSemanticDiff(
          latestSnapshot.clean_text,
          scrapeResult.clean_text,
          company.name
        );

        if (diffResult.changes.length > 0) {
          // Classify changes
          const classification = classifyChanges(diffResult.changes);

          // Check legality for critical/major changes
          const legalityIssues = await checkChangeLegality(diffResult.changes, company.name);

          // Save change record
          const changeRecord = await saveChangeRecord({
            company_id: company.id,
            old_snapshot_id: latestSnapshot.id,
            new_snapshot_id: newSnapshot.id,
            tos_type: tosEntry.type as TosDocType,
            change_number: null,
            changes: diffResult.changes,
            ...classification,
            legality_issues: legalityIssues.length > 0 ? legalityIssues : null,
            summary: diffResult.overall_summary,
            is_published: true,
            detected_at: new Date().toISOString(),
            analyzed_at: new Date().toISOString(),
          });

          if (changeRecord) {
            changesDetected++;

            // Dispatch alerts
            const alertResult = await dispatchAlerts(changeRecord, company);
            alertsSent += alertResult.sent;
          }
        }
      }
    } catch (err) {
      log.errorWithCause("watchdog", "Error processing ToS URL", err, { url: tosEntry.url });
    }

    // Rate limit between URLs
    await new Promise((r) => setTimeout(r, 1000));
  }

  // Update company's last_scraped_at
  await updateCompanyScrapedAt(company.id);

  return { changesDetected, alertsSent };
}
