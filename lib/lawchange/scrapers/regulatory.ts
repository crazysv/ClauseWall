// ============================================
// SCRAPER: REGULATORY BODIES
// Scrapes RBI, IRDAI, TRAI for circulars
// and regulatory changes
// ============================================

import type { ScrapingResult, LawChange } from "@/types";

const REQUEST_TIMEOUT = 30_000;
const RATE_LIMIT_MS = 2_000;

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

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── RBI ────────────────────────────────────────────────────────────────

const RBI_KEYWORDS = [
  "lending",
  "interest rate",
  "emi",
  "loan",
  "restructuring",
  "credit card",
  "banking",
  "digital payment",
  "nbfc",
  "consumer",
  "fair practice",
  "customer",
  "charges",
  "fee",
  "penalty",
  "penal",
];

function parseRBIPage(html: string): Partial<LawChange>[] {
  const results: Partial<LawChange>[] = [];

  try {
    // RBI circulars page uses table or list format
    const linkRegex =
      /<a\s+href="([^"]*(?:Notification|CircularDisplay|Content)[^"]*)"[^>]*>([^<]+)<\/a>/gi;
    let match: RegExpExecArray | null;
    const seenUrls = new Set<string>();

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      const title = match[2].trim();

      if (!title || title.length < 15) continue;

      const lower = title.toLowerCase();
      const isRelevant = RBI_KEYWORDS.some((kw) => lower.includes(kw));
      if (!isRelevant) continue;

      const sourceUrl = href.startsWith("http")
        ? href
        : `https://www.rbi.org.in${href}`;

      if (seenUrls.has(sourceUrl)) continue;
      seenUrls.add(sourceUrl);

      // Extract circular number if present
      const circularMatch = title.match(/(?:RBI\/\d{4}-\d{2}\/\d+|DOR\.[^-]+[-/]\d+)/i);

      results.push({
        source: "rbi",
        source_url: sourceUrl,
        change_type: "circular",
        title: title.substring(0, 500),
        summary: `RBI circular: ${title}`,
        full_text: null,
        date_published: new Date().toISOString().split("T")[0],
        date_effective: null,
        court_name: null,
        case_number: circularMatch ? circularMatch[0] : null,
        act_name: "Reserve Bank of India Act / Banking Regulation Act",
        section_affected: null,
        affected_clause_types: [],
        affected_jurisdictions: ["ALL-INDIA"],
        affected_document_types: ["loan"],
        status: "scraped",
        classification_confidence: "low",
        is_verified: false,
        raw_scraped_data: null,
      });

      if (results.length >= 10) break;
    }
  } catch {
    // Return partial results
  }

  return results;
}

export async function scrapeRBI(): Promise<{
  result: ScrapingResult;
  changes: Partial<LawChange>[];
}> {
  const startTime = Date.now();

  try {
    const response = await fetchWithTimeout(
      "https://www.rbi.org.in/Scripts/BS_CircularIndexDisplay.aspx"
    );

    if (!response.ok) {
      return {
        result: {
          source: "rbi",
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
    const changes = parseRBIPage(html);

    return {
      result: {
        source: "rbi",
        success: true,
        changes_found: changes.length,
        new_changes: 0,
        error: null,
        duration_ms: Date.now() - startTime,
      },
      changes,
    };
  } catch (error) {
    console.error("[RBI] Scraper failed:", (error as Error).message);
    return {
      result: {
        source: "rbi",
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

// ─── IRDAI ──────────────────────────────────────────────────────────────

const IRDAI_KEYWORDS = [
  "insurance",
  "claim",
  "settlement",
  "policy",
  "exclusion",
  "premium",
  "consumer",
  "protection",
  "health",
  "motor",
  "life",
  "pension",
  "annuity",
];

function parseIRDAIPage(html: string): Partial<LawChange>[] {
  const results: Partial<LawChange>[] = [];

  try {
    const linkRegex =
      /<a\s+href="([^"]*)"[^>]*>([^<]{15,})<\/a>/gi;
    let match: RegExpExecArray | null;
    const seenUrls = new Set<string>();

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      const title = match[2].trim();

      const lower = title.toLowerCase();
      const isRelevant = IRDAI_KEYWORDS.some((kw) => lower.includes(kw));
      if (!isRelevant) continue;

      const sourceUrl = href.startsWith("http")
        ? href
        : `https://www.irdai.gov.in${href}`;

      if (seenUrls.has(sourceUrl)) continue;
      seenUrls.add(sourceUrl);

      results.push({
        source: "irdai",
        source_url: sourceUrl,
        change_type: "regulation",
        title: title.substring(0, 500),
        summary: `IRDAI regulation/circular: ${title}`,
        full_text: null,
        date_published: new Date().toISOString().split("T")[0],
        date_effective: null,
        court_name: null,
        case_number: null,
        act_name: "Insurance Regulatory and Development Authority Act",
        section_affected: null,
        affected_clause_types: [],
        affected_jurisdictions: ["ALL-INDIA"],
        affected_document_types: ["insurance"],
        status: "scraped",
        classification_confidence: "low",
        is_verified: false,
        raw_scraped_data: null,
      });

      if (results.length >= 10) break;
    }
  } catch {
    // Return partial results
  }

  return results;
}

export async function scrapeIRDAI(): Promise<{
  result: ScrapingResult;
  changes: Partial<LawChange>[];
}> {
  const startTime = Date.now();

  try {
    const response = await fetchWithTimeout("https://www.irdai.gov.in/");

    if (!response.ok) {
      return {
        result: {
          source: "irdai",
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
    const changes = parseIRDAIPage(html);

    return {
      result: {
        source: "irdai",
        success: true,
        changes_found: changes.length,
        new_changes: 0,
        error: null,
        duration_ms: Date.now() - startTime,
      },
      changes,
    };
  } catch (error) {
    console.error("[IRDAI] Scraper failed:", (error as Error).message);
    return {
      result: {
        source: "irdai",
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

// ─── TRAI ───────────────────────────────────────────────────────────────

const TRAI_KEYWORDS = [
  "tariff",
  "service",
  "telecom",
  "broadband",
  "billing",
  "data",
  "privacy",
  "consumer",
  "complaint",
  "quality",
  "mobile",
  "internet",
  "spectrum",
  "ott",
];

function parseTRAIPage(html: string): Partial<LawChange>[] {
  const results: Partial<LawChange>[] = [];

  try {
    const linkRegex =
      /<a\s+href="([^"]*)"[^>]*>([^<]{15,})<\/a>/gi;
    let match: RegExpExecArray | null;
    const seenUrls = new Set<string>();

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      const title = match[2].trim();

      const lower = title.toLowerCase();
      const isRelevant = TRAI_KEYWORDS.some((kw) => lower.includes(kw));
      if (!isRelevant) continue;

      const sourceUrl = href.startsWith("http")
        ? href
        : `https://www.trai.gov.in${href}`;

      if (seenUrls.has(sourceUrl)) continue;
      seenUrls.add(sourceUrl);

      results.push({
        source: "trai",
        source_url: sourceUrl,
        change_type: "regulation",
        title: title.substring(0, 500),
        summary: `TRAI regulation/order: ${title}`,
        full_text: null,
        date_published: new Date().toISOString().split("T")[0],
        date_effective: null,
        court_name: null,
        case_number: null,
        act_name: "Telecom Regulatory Authority of India Act",
        section_affected: null,
        affected_clause_types: [],
        affected_jurisdictions: ["ALL-INDIA"],
        affected_document_types: ["tos"],
        status: "scraped",
        classification_confidence: "low",
        is_verified: false,
        raw_scraped_data: null,
      });

      if (results.length >= 10) break;
    }
  } catch {
    // Return partial results
  }

  return results;
}

export async function scrapeTRAI(): Promise<{
  result: ScrapingResult;
  changes: Partial<LawChange>[];
}> {
  const startTime = Date.now();

  try {
    const response = await fetchWithTimeout("https://www.trai.gov.in/");

    if (!response.ok) {
      return {
        result: {
          source: "trai",
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
    const changes = parseTRAIPage(html);

    return {
      result: {
        source: "trai",
        success: true,
        changes_found: changes.length,
        new_changes: 0,
        error: null,
        duration_ms: Date.now() - startTime,
      },
      changes,
    };
  } catch (error) {
    console.error("[TRAI] Scraper failed:", (error as Error).message);
    return {
      result: {
        source: "trai",
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
