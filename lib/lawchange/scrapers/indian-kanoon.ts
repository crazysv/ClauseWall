// ============================================
// SCRAPER: INDIAN KANOON
// Scrapes recent court judgments related to
// contract law from indiankanoon.org
// ============================================

import type { ScrapingResult, LawChange } from "@/types";

const SEARCH_QUERIES = [
  "contract+unfair+clause",
  "security+deposit+landlord",
  "non+compete+employment",
  "consumer+protection+unfair+terms",
  "rent+control+tenant+rights",
];

const REQUEST_TIMEOUT = 30_000;
const RATE_LIMIT_MS = 2_000;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithTimeout(url: string, timeoutMs = REQUEST_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ClauseWall/1.0; +https://clausewall.app)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}

function isWithinLastDays(dateStr: string, days: number): boolean {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return d.getTime() >= cutoff;
  } catch {
    return false;
  }
}

/**
 * Parse Indian Kanoon search results HTML to extract judgment entries.
 * Uses basic regex-based parsing since cheerio may not be available
 * in all environments. Falls back gracefully.
 */
function parseSearchResults(html: string): Partial<LawChange>[] {
  const results: Partial<LawChange>[] = [];

  try {
    // Indian Kanoon uses <div class="result"> blocks
    const resultBlocks = html.split(/class="result"/).slice(1);

    for (const block of resultBlocks.slice(0, 10)) {
      try {
        // Extract title and URL
        const titleMatch = block.match(/<a\s+href="([^"]*)"[^>]*>([^<]*)<\/a>/i);
        if (!titleMatch) continue;

        const href = titleMatch[1];
        const title = titleMatch[2].trim();
        if (!title || title.length < 10) continue;

        // Build source URL
        const sourceUrl = href.startsWith("http")
          ? href
          : `https://indiankanoon.org${href}`;

        // Extract date
        const dateMatch = block.match(
          /(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s*,?\s*\d{4})/i
        );
        const datePublished = dateMatch
          ? new Date(dateMatch[1]).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];

        // Only include recent results (last 30 days for court judgments)
        if (!isWithinLastDays(datePublished, 30)) continue;

        // Extract court name from title or block
        const courtMatch = block.match(
          /(Supreme Court|High Court|District Court|Tribunal|Commission|Authority)[^<]*/i
        );

        // Extract snippet/summary
        const snippetMatch = block.match(
          /class="snippet"[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/div>/i
        );
        const summary = snippetMatch
          ? snippetMatch[1]
              .replace(/<[^>]*>/g, "")
              .replace(/\s+/g, " ")
              .trim()
              .substring(0, 500)
          : title;

        results.push({
          source: "indian_kanoon",
          source_url: sourceUrl,
          change_type: "court_judgment",
          title: title.substring(0, 500),
          summary: summary || title,
          full_text: null,
          date_published: datePublished,
          date_effective: datePublished,
          court_name: courtMatch ? courtMatch[0].trim() : null,
          case_number: null,
          act_name: null,
          section_affected: null,
          affected_clause_types: [],
          affected_jurisdictions: [],
          affected_document_types: [],
          status: "scraped",
          classification_confidence: "low",
          is_verified: false,
          raw_scraped_data: null,
        });
      } catch {
        // Skip malformed result blocks
        continue;
      }
    }
  } catch {
    // Return empty if parsing fails entirely
  }

  return results;
}

/**
 * Scrape Indian Kanoon for recent court judgments related to contract law.
 */
export async function scrapeIndianKanoon(): Promise<{
  result: ScrapingResult;
  changes: Partial<LawChange>[];
}> {
  const startTime = Date.now();
  const allChanges: Partial<LawChange>[] = [];
  const seenUrls = new Set<string>();

  try {
    for (const query of SEARCH_QUERIES) {
      try {
        const url = `https://indiankanoon.org/search/?formInput=${query}&pagenum=0`;
        const response = await fetchWithTimeout(url);

        if (!response.ok) {
          console.warn(
            `[IndianKanoon] HTTP ${response.status} for query "${query}"`
          );
          await sleep(RATE_LIMIT_MS);
          continue;
        }

        const html = await response.text();
        const changes = parseSearchResults(html);

        for (const change of changes) {
          if (change.source_url && !seenUrls.has(change.source_url)) {
            seenUrls.add(change.source_url);
            allChanges.push(change);
          }
        }

        await sleep(RATE_LIMIT_MS);
      } catch (queryError) {
        console.warn(
          `[IndianKanoon] Query "${query}" failed:`,
          (queryError as Error).message
        );
        await sleep(RATE_LIMIT_MS);
        continue;
      }
    }

    return {
      result: {
        source: "indian_kanoon",
        success: true,
        changes_found: allChanges.length,
        new_changes: 0, // Calculated after DB insert
        error: null,
        duration_ms: Date.now() - startTime,
      },
      changes: allChanges,
    };
  } catch (error) {
    console.error("[IndianKanoon] Scraper failed:", (error as Error).message);
    return {
      result: {
        source: "indian_kanoon",
        success: false,
        changes_found: 0,
        new_changes: 0,
        error: (error as Error).message,
        duration_ms: Date.now() - startTime,
      },
      changes: [],
    };
  }
}
