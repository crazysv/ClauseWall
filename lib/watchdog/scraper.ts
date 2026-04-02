// ============================================
// WATCHDOG SCRAPING ENGINE
// Fetches ToS pages using fetch + cheerio
// ============================================

import * as cheerio from "cheerio";
import { createHash } from "crypto";
import type { ScrapeConfig, ScrapeResult, TextSection } from "./types";

// User-Agent rotation to avoid blocks
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

/** Default selectors to strip from HTML */
const DEFAULT_REMOVE_SELECTORS = [
  "script", "style", "noscript", "iframe",
  "nav", "footer", "header",
  "[class*='cookie']", "[id*='cookie']",
  "[class*='banner']", "[class*='popup']",
  "[class*='modal']", "[class*='overlay']",
  "[class*='newsletter']", "[class*='subscribe']",
  "[class*='social']", "[class*='share']",
  "[class*='sidebar']", "[class*='widget']",
  "[class*='ad-']", "[class*='ads']",
  "[class*='comment']",
];

/** Default content area selectors (tried in order) */
const CONTENT_SELECTORS = [
  "main",
  "article",
  "[role='main']",
  ".content", "#content",
  ".main-content", "#main-content",
  ".terms", "#terms",
  ".policy", "#policy",
  ".legal", "#legal",
  ".page-content", "#page-content",
  ".entry-content",
  ".post-content",
];

/**
 * Scrape a ToS/Privacy Policy page
 */
export async function scrapeToSPage(
  url: string,
  config?: ScrapeConfig
): Promise<ScrapeResult> {
  const startTime = Date.now();
  const timeout = config?.timeout || 30000;
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const headers: Record<string, string> = {
      "User-Agent": userAgent,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-IN,en-GB;q=0.9,en;q=0.8,hi;q=0.7",
      "Accept-Encoding": "gzip, deflate",
      ...(config?.headers || {}),
    };

    const response = await fetch(url, {
      headers,
      signal: controller.signal,
      redirect: config?.followRedirects === false ? "manual" : "follow",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Check if blocked (403, 429)
      const blocked = response.status === 403 || response.status === 429;
      return {
        success: false,
        raw_html: null,
        clean_text: null,
        text_hash: "",
        word_count: 0,
        scrape_duration_ms: Date.now() - startTime,
        sections: [],
        error: `HTTP ${response.status}: ${response.statusText}`,
        status_code: response.status,
        blocked,
      };
    }

    const rawHtml = await response.text();
    const $ = cheerio.load(rawHtml);

    // Remove unwanted elements
    const removeSelectors = [
      ...DEFAULT_REMOVE_SELECTORS,
      ...(config?.removeSelectors || []),
    ];
    removeSelectors.forEach((sel) => $(sel).remove());

    // Find main content area
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let $content: any = $("body");
    if (config?.contentSelector) {
      $content = $(config.contentSelector);
    } else {
      for (const sel of CONTENT_SELECTORS) {
        const $found = $(sel);
        if ($found.length > 0 && ($found.text() || "").trim().length > 200) {
          $content = $found;
          break;
        }
      }
    }

    // Extract sections by headings
    const sections: TextSection[] = [];
    let currentTitle = "Introduction";
    let currentContent = "";

    $content.find("*").each((_: number, el: unknown) => {
      const $el = $(el as never);
      const tagName = (el as unknown as { tagName?: string }).tagName?.toLowerCase() || "";

      if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName)) {
        if (currentContent.trim()) {
          sections.push({ title: currentTitle, content: currentContent.trim() });
        }
        currentTitle = $el.text().trim();
        currentContent = "";
      } else if (["p", "li", "td", "th", "div", "span", "blockquote"].includes(tagName)) {
        const text = $el.clone().children().remove().end().text().trim();
        if (text) {
          currentContent += text + "\n";
        }
      }
    });

    // Push last section
    if (currentContent.trim()) {
      sections.push({ title: currentTitle, content: currentContent.trim() });
    }

    // If no sections found from headings, fall back to full text
    if (sections.length === 0) {
      const fullText = normalizeText($content.text());
      if (fullText.length > 0) {
        sections.push({ title: "Full Document", content: fullText });
      }
    }

    // Create clean text
    const cleanText = sections
      .map((s) => `## ${s.title}\n\n${s.content}`)
      .join("\n\n");

    const normalizedCleanText = normalizeText(cleanText);
    const textHash = createHash("sha256").update(normalizedCleanText).digest("hex");
    const wordCount = normalizedCleanText.split(/\s+/).filter(Boolean).length;

    return {
      success: true,
      raw_html: rawHtml,
      clean_text: normalizedCleanText,
      text_hash: textHash,
      word_count: wordCount,
      scrape_duration_ms: Date.now() - startTime,
      sections,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isAborted = errorMessage.includes("abort");

    return {
      success: false,
      raw_html: null,
      clean_text: null,
      text_hash: "",
      word_count: 0,
      scrape_duration_ms: Date.now() - startTime,
      sections: [],
      error: isAborted ? `Timeout after ${timeout}ms` : errorMessage,
      blocked: false,
    };
  }
}

/**
 * Scrape with retries
 */
export async function scrapeWithRetry(
  url: string,
  config?: ScrapeConfig,
  maxRetries = 3
): Promise<ScrapeResult> {
  let lastResult: ScrapeResult | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = Math.pow(2, attempt) * 1000;

      await new Promise((r) => setTimeout(r, delay));
    }

    lastResult = await scrapeToSPage(url, config);

    if (lastResult.success) return lastResult;
    if (lastResult.blocked) {
      console.warn(`[Watchdog] Blocked scraping ${url} — skipping retries`);
      return lastResult;
    }
  }

  return lastResult!;
}

/**
 * Normalize text: collapse whitespace, standardize quotes
 */
function normalizeText(text: string): string {
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-width chars
    .replace(/\u00A0/g, " ") // non-breaking space
    .replace(/[\u2018\u2019]/g, "'") // curly quotes
    .replace(/[\u201C\u201D]/g, '"') // curly double quotes
    .replace(/\u2026/g, "...") // ellipsis
    .replace(/\u2013/g, "-") // en dash
    .replace(/\u2014/g, "--") // em dash
    .replace(/[ \t]+/g, " ") // collapse horizontal whitespace
    .replace(/\n{3,}/g, "\n\n") // max 2 newlines
    .trim();
}
