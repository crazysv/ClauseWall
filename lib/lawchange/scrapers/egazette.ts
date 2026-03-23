// ============================================
// SCRAPER: eGAZETTE
// Scrapes egazette.gov.in for government
// notifications and extraordinary gazettes
// ============================================

import type { ScrapingResult, LawChange } from "@/types";

const REQUEST_TIMEOUT = 30_000;

const RELEVANT_KEYWORDS = [
  "rent",
  "tenancy",
  "lease",
  "labour",
  "labor",
  "employment",
  "consumer",
  "banking",
  "insurance",
  "rera",
  "real estate",
  "telecom",
  "contract",
  "arbitration",
  "digital",
  "data protection",
  "finance",
  "company",
  "securities",
];

async function fetchWithTimeout(
  url: string,
  timeoutMs = REQUEST_TIMEOUT
): Promise<Response> {
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

function isRelevant(text: string): boolean {
  const lower = text.toLowerCase();
  return RELEVANT_KEYWORDS.some((kw) => lower.includes(kw));
}

function parseEGazettePage(html: string): Partial<LawChange>[] {
  const results: Partial<LawChange>[] = [];

  try {
    // eGazette uses table rows with link entries
    const rowRegex =
      /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch: RegExpExecArray | null;
    const seenUrls = new Set<string>();

    while ((rowMatch = rowRegex.exec(html)) !== null) {
      const rowHtml = rowMatch[1];

      // Extract link and title
      const linkMatch = rowHtml.match(
        /<a\s+href="([^"]*)"[^>]*>([^<]+)<\/a>/i
      );
      if (!linkMatch) continue;

      const href = linkMatch[1];
      const title = linkMatch[2].trim();

      if (!title || title.length < 10) continue;
      if (!isRelevant(title) && !isRelevant(rowHtml)) continue;

      const sourceUrl = href.startsWith("http")
        ? href
        : `https://egazette.gov.in${href}`;

      if (seenUrls.has(sourceUrl)) continue;
      seenUrls.add(sourceUrl);

      // Extract date
      const dateMatch = rowHtml.match(
        /(\d{2}[/-]\d{2}[/-]\d{4}|\d{4}[/-]\d{2}[/-]\d{2})/
      );
      let datePublished = new Date().toISOString().split("T")[0];
      if (dateMatch) {
        try {
          const d = new Date(dateMatch[1]);
          if (!isNaN(d.getTime())) {
            datePublished = d.toISOString().split("T")[0];
          }
        } catch {
          // Use default
        }
      }

      // Extract ministry/department if available
      const deptMatch = rowHtml.match(
        /(?:Ministry|Department)\s+of\s+([^<,]+)/i
      );

      results.push({
        source: "egazette",
        source_url: sourceUrl,
        change_type: "notification",
        title: title.substring(0, 500),
        summary: `Government notification via eGazette: ${title}${
          deptMatch ? ` (${deptMatch[0].trim()})` : ""
        }`,
        full_text: null,
        date_published: datePublished,
        date_effective: null,
        court_name: null,
        case_number: null,
        act_name: deptMatch ? deptMatch[0].trim() : null,
        section_affected: null,
        affected_clause_types: [],
        affected_jurisdictions: ["ALL-INDIA"],
        affected_document_types: [],
        status: "scraped",
        classification_confidence: "low",
        is_verified: false,
        raw_scraped_data: null,
      });

      if (results.length >= 15) break;
    }
  } catch {
    // Return whatever we have
  }

  return results;
}

/**
 * Scrape eGazette for recent government notifications.
 */
export async function scrapeEGazette(): Promise<{
  result: ScrapingResult;
  changes: Partial<LawChange>[];
}> {
  const startTime = Date.now();

  try {
    // eGazette main page
    const response = await fetchWithTimeout("https://egazette.gov.in/");

    if (!response.ok) {
      return {
        result: {
          source: "egazette",
          success: false,
          changes_found: 0,
          new_changes: 0,
          error: `HTTP ${response.status}`,
          duration_ms: Date.now() - startTime,
        },
        changes: [],
      };
    }

    const html = await response.text();
    const changes = parseEGazettePage(html);

    return {
      result: {
        source: "egazette",
        success: true,
        changes_found: changes.length,
        new_changes: 0,
        error: null,
        duration_ms: Date.now() - startTime,
      },
      changes,
    };
  } catch (error) {
    console.error("[eGazette] Scraper failed:", (error as Error).message);

    // Retry once after 5 seconds
    try {
      await new Promise((r) => setTimeout(r, 5_000));
      const retryResponse = await fetchWithTimeout("https://egazette.gov.in/");
      if (retryResponse.ok) {
        const html = await retryResponse.text();
        const changes = parseEGazettePage(html);
        return {
          result: {
            source: "egazette",
            success: true,
            changes_found: changes.length,
            new_changes: 0,
            error: null,
            duration_ms: Date.now() - startTime,
          },
          changes,
        };
      }
    } catch {
      // Retry also failed
    }

    return {
      result: {
        source: "egazette",
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
