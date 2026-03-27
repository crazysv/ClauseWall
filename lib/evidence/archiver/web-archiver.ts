// ============================================
// WEB ARCHIVER
// Screenshots + HTML capture for evidence
// Uses fetch + manual screenshot fallback
// ============================================

import type { WebArchiveResult } from "@/types/evidence";
import { hashContent } from "../storage";

/**
 * Archive a web page — fetch HTML + instruct user to screenshot
 * (Puppeteer omitted for Vercel Hobby plan compatibility)
 */
export async function archiveUrl(url: string): Promise<WebArchiveResult> {
  const archivedAt = new Date().toISOString();

  try {
    // Validate URL
    const parsed = new URL(url);
    if (["localhost", "127.0.0.1", "0.0.0.0"].includes(parsed.hostname)) {
      return { success: false, url, title: "", screenshot: null, html: null, archived_at: archivedAt, error: "Cannot archive localhost URLs" };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,*/*",
        "Accept-Language": "en-IN,en;q=0.9",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return {
        success: false,
        url,
        title: "",
        screenshot: null,
        html: null,
        archived_at: archivedAt,
        error: `HTTP ${response.status}: ${response.statusText}. Please take a manual screenshot and upload it.`,
      };
    }

    const html = await response.text();

    // Extract title from HTML
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : url;

    return {
      success: true,
      url,
      title,
      screenshot: null, // User uploads screenshot manually
      html,
      archived_at: archivedAt,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isTimeout = message.includes("abort");

    return {
      success: false,
      url,
      title: "",
      screenshot: null,
      html: null,
      archived_at: archivedAt,
      error: isTimeout
        ? "Request timed out. The website may be blocking automated access. Please take a manual screenshot."
        : `Failed to archive: ${message}`,
    };
  }
}

/**
 * Hash archived content for chain
 */
export function hashArchiveContent(html: string | null, screenshot: Buffer | null): {
  htmlHash: string | null;
  screenshotHash: string | null;
  combinedHash: string;
} {
  const htmlHash = html ? hashContent(html) : null;
  const screenshotHash = screenshot ? hashContent(screenshot) : null;
  const combinedHash = hashContent(`${htmlHash || "none"}|${screenshotHash || "none"}`);

  return { htmlHash, screenshotHash, combinedHash };
}
