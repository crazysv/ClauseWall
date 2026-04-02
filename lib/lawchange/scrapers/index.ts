// ============================================
// SCRAPER ORCHESTRATOR
// Runs all scrapers sequentially, stores
// results, and generates daily report.
// ============================================

import type { ScrapingResult, LawChange, DailyScrapingReport } from "@/types";
import { getLawChangeDB } from "../db";
import { scrapeIndianKanoon } from "./indian-kanoon";
import { scrapePRSLegislative } from "./prs-legislative";
import { scrapeEGazette } from "./egazette";
import { scrapeRBI, scrapeIRDAI, scrapeTRAI } from "./regulatory";

const DELAY_BETWEEN_SOURCES_MS = 2_000;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Store scraped law changes in the database.
 * Uses UPSERT with ON CONFLICT (source_url) DO NOTHING for deduplication.
 */
export async function storeScrapedChanges(
  changes: Partial<LawChange>[]
): Promise<{ inserted: number; duplicates: number }> {
  if (changes.length === 0) return { inserted: 0, duplicates: 0 };

  const db = getLawChangeDB();
  let inserted = 0;
  let duplicates = 0;

  // Insert one at a time to handle conflicts gracefully
  for (const change of changes) {
    try {
      const { error } = await db.from("law_changes").insert({
        source: change.source,
        source_url: change.source_url,
        change_type: change.change_type,
        title: change.title,
        summary: change.summary,
        full_text: change.full_text || null,
        date_published: change.date_published,
        date_effective: change.date_effective || null,
        court_name: change.court_name || null,
        case_number: change.case_number || null,
        act_name: change.act_name || null,
        section_affected: change.section_affected || null,
        affected_clause_types: change.affected_clause_types || [],
        affected_jurisdictions: change.affected_jurisdictions || [],
        affected_document_types: change.affected_document_types || [],
        impact_type: change.impact_type || null,
        status: "scraped",
        classification_confidence: "low",
        is_verified: false,
        raw_scraped_data: change.raw_scraped_data || null,
      });

      if (error) {
        // Unique constraint violation = duplicate
        if (
          error.code === "23505" ||
          error.message?.includes("duplicate") ||
          error.message?.includes("unique")
        ) {
          duplicates++;
        } else {
          console.warn(
            `[Scraper] Insert failed for "${change.title}":`,
            error.message
          );
          duplicates++;
        }
      } else {
        inserted++;
      }
    } catch (err) {
      console.warn(
        `[Scraper] Exception inserting "${change.title}":`,
        (err as Error).message
      );
      duplicates++;
    }
  }

  return { inserted, duplicates };
}

/**
 * Run all scrapers sequentially, store results, and return daily report.
 */
export async function runAllScrapers(): Promise<DailyScrapingReport> {
  const today = new Date().toISOString().split("T")[0];
  const results: ScrapingResult[] = [];
  let totalChangesFound = 0;
  let totalNewChanges = 0;


  // Define all scrapers
  const scrapers = [
    { name: "Indian Kanoon", fn: scrapeIndianKanoon },
    { name: "PRS Legislative", fn: scrapePRSLegislative },
    { name: "eGazette", fn: scrapeEGazette },
    { name: "RBI", fn: scrapeRBI },
    { name: "IRDAI", fn: scrapeIRDAI },
    { name: "TRAI", fn: scrapeTRAI },
  ];

  for (const scraper of scrapers) {

    try {
      const { result, changes } = await scraper.fn();

      // Store scraped changes
      if (changes.length > 0) {
        const { inserted, duplicates } = await storeScrapedChanges(changes);
        result.new_changes = inserted;

      } else {

      }

      results.push(result);
      totalChangesFound += result.changes_found;
      totalNewChanges += result.new_changes;

      // Log to scraping_logs table
      try {
        const db = getLawChangeDB();
        await db.from("scraping_logs").insert({
          date: today,
          source: result.source,
          success: result.success,
          changes_found: result.changes_found,
          new_changes: result.new_changes,
          error: result.error || null,
          duration_ms: result.duration_ms,
        });
      } catch (logError) {
        console.warn(
          `[Scraper] Failed to log scraping result:`,
          (logError as Error).message
        );
      }
    } catch (scraperError) {
      console.error(
        `[Scraper]   ❌ ${scraper.name} crashed:`,
        (scraperError as Error).message
      );
      results.push({
        source: scraper.name.toLowerCase().replace(/\s+/g, "_") as any,
        success: false,
        changes_found: 0,
        new_changes: 0,
        error: (scraperError as Error).message,
        duration_ms: 0,
      });
    }

    // Delay between sources
    await sleep(DELAY_BETWEEN_SOURCES_MS);
  }

  const report: DailyScrapingReport = {
    date: today,
    sources_checked: scrapers.length,
    sources_succeeded: results.filter((r) => r.success).length,
    sources_failed: results.filter((r) => !r.success).length,
    total_changes_found: totalChangesFound,
    new_changes: totalNewChanges,
    results,
  };


  return report;
}
