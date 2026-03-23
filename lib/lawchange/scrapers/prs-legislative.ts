// ============================================
// SCRAPER: PRS LEGISLATIVE RESEARCH
// Scrapes prsindia.org for bills and amendments
// ============================================

import type { ScrapingResult, LawChange } from "@/types";

const REQUEST_TIMEOUT = 30_000;
const RATE_LIMIT_MS = 2_000;

const RELEVANT_KEYWORDS = [
  "contract",
  "consumer",
  "tenancy",
  "rent",
  "labour",
  "labor",
  "employment",
  "data protection",
  "privacy",
  "finance",
  "banking",
  "insurance",
  "real estate",
  "rera",
  "arbitration",
  "commercial",
  "digital",
  "e-commerce",
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

function parsePRSPage(html: string): Partial<LawChange>[] {
  const results: Partial<LawChange>[] = [];

  try {
    // PRS uses various HTML patterns — extract links with titles
    const linkRegex =
      /<a\s+href="(\/billtrack\/[^"]*|\/theprsblog\/[^"]*)"[^>]*>([^<]+)<\/a>/gi;
    let match: RegExpExecArray | null;
    const seenUrls = new Set<string>();

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      const title = match[2].trim();

      if (!title || title.length < 15) continue;
      if (!isRelevant(title)) continue;

      const sourceUrl = `https://prsindia.org${href}`;
      if (seenUrls.has(sourceUrl)) continue;
      seenUrls.add(sourceUrl);

      // Determine change type based on URL
      const changeType = href.includes("billtrack")
        ? ("amendment" as const)
        : ("guideline" as const);

      // Extract date if present near the link
      const dateRegex =
        /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*,?\s*\d{4})/i;
      const surroundingText = html.substring(
        Math.max(0, (match.index || 0) - 200),
        (match.index || 0) + 500
      );
      const dateMatch = surroundingText.match(dateRegex);
      const datePublished = dateMatch
        ? new Date(dateMatch[1]).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      results.push({
        source: "prs_legislative",
        source_url: sourceUrl,
        change_type: changeType,
        title: title.substring(0, 500),
        summary: `Bill/amendment tracked by PRS Legislative Research: ${title}`,
        full_text: null,
        date_published: datePublished,
        date_effective: null,
        court_name: null,
        case_number: null,
        act_name: title,
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
 * Scrape PRS Legislative Research for recent bills and amendments.
 */
export async function scrapePRSLegislative(): Promise<{
  result: ScrapingResult;
  changes: Partial<LawChange>[];
}> {
  const startTime = Date.now();
  const allChanges: Partial<LawChange>[] = [];
  const seenUrls = new Set<string>();

  const urls = [
    "https://prsindia.org/billtrack",
    "https://prsindia.org/theprsblog",
  ];

  try {
    for (const url of urls) {
      try {
        const response = await fetchWithTimeout(url);

        if (!response.ok) {
          console.warn(`[PRS] HTTP ${response.status} for ${url}`);
          continue;
        }

        const html = await response.text();
        const changes = parsePRSPage(html);

        for (const change of changes) {
          if (change.source_url && !seenUrls.has(change.source_url)) {
            seenUrls.add(change.source_url);
            allChanges.push(change);
          }
        }

        await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
      } catch (pageError) {
        console.warn(
          `[PRS] Page ${url} failed:`,
          (pageError as Error).message
        );
        continue;
      }
    }

    return {
      result: {
        source: "prs_legislative",
        success: true,
        changes_found: allChanges.length,
        new_changes: 0,
        error: null,
        duration_ms: Date.now() - startTime,
      },
      changes: allChanges,
    };
  } catch (error) {
    console.error("[PRS] Scraper failed:", (error as Error).message);
    return {
      result: {
        source: "prs_legislative",
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
