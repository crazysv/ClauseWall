// ============================================
// CLAUSEWALL — SHARE UTILITY FUNCTIONS
// ============================================

import {
  getDocumentTypeLabel,
  getStateName,
  getRiskLevel,
} from "@/lib/utils/constants";

// ── Types ─────────────────────────────────

interface ShareDocument {
  id: string;
  overall_risk_score: number;
  document_type: string;
  jurisdiction: string;
  safe_count: number;
  warning_count: number;
  dangerous_count: number;
  illegal_count: number;
  total_clauses: number;
  entity_name?: string | null;
  original_filename?: string | null;
}

// ── Core Functions ────────────────────────

/**
 * Get the shareable URL for a document
 */
export function getShareUrl(documentId: string): string {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://clause-wall.vercel.app";
  return `${baseUrl}/results/${documentId}`;
}

/**
 * Open WhatsApp with pre-filled text
 */
export function shareToWhatsApp(text: string): void {
  const encoded = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${encoded}`, "_blank");
}

/**
 * Open Twitter/X with pre-filled tweet
 */
export function shareToTwitter(text: string, url?: string): void {
  const params = new URLSearchParams();
  params.set("text", text);
  if (url) params.set("url", url);
  window.open(
    `https://twitter.com/intent/tweet?${params.toString()}`,
    "_blank"
  );
}

/**
 * Open LinkedIn share
 */
export function shareToLinkedIn(url: string): void {
  const encoded = encodeURIComponent(url);
  window.open(
    `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
    "_blank"
  );
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Download a data URL as a file
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

/**
 * Check if native share is available (mobile)
 */
export function canNativeShare(): boolean {
  return typeof navigator !== "undefined" && !!navigator.share;
}

/**
 * Use native share API (mobile)
 */
export async function nativeShare(data: {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}): Promise<boolean> {
  if (!canNativeShare()) return false;
  try {
    await navigator.share(data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert data URL to File (for native share with image)
 */
export function dataUrlToFile(
  dataUrl: string,
  filename: string
): File | null {
  try {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  } catch {
    return null;
  }
}

// ── Smart Share Text Generator ────────────

/**
 * Generate context-aware share text based on document type and risk
 */
export function generateSmartShareText(
  doc: ShareDocument,
  topRedFlag?: string | null,
  format: "whatsapp" | "twitter" | "generic" = "generic"
): string {
  const score = doc.overall_risk_score;
  const riskLevel = getRiskLevel(score);
  const docType = getDocumentTypeLabel(doc.document_type);
  const state = getStateName(doc.jurisdiction);
  const illegal = doc.illegal_count || 0;
  const dangerous = doc.dangerous_count || 0;
  const url = getShareUrl(doc.id);

  const riskEmoji =
    riskLevel === "safe"
      ? "✅"
      : riskLevel === "warning"
      ? "⚠️"
      : riskLevel === "dangerous"
      ? "🔴"
      : "⛔";

  const isHighRisk = score > 50;

  // ── Context-aware opening ──
  let opening = "";

  switch (doc.document_type) {
    case "rental":
      opening = isHighRisk
        ? `My rental agreement scored ${score}/100 ${riskEmoji} on ClauseWall`
        : `My rental agreement looks fair! Scored ${score}/100 ${riskEmoji}`;
      break;
    case "employment":
      opening = isHighRisk
        ? `My employment contract has ${illegal + dangerous} risky clauses ${riskEmoji}`
        : `My job contract looks clean — ${score}/100 ${riskEmoji}`;
      break;
    case "loan":
      opening = isHighRisk
        ? `Found ${illegal + dangerous} hidden traps in my loan agreement ${riskEmoji}`
        : `My loan agreement checks out — ${score}/100 ${riskEmoji}`;
      break;
    case "tos":
      opening = `Scanned Terms of Service — scored ${score}/100 ${riskEmoji}`;
      break;
    case "nda":
      opening = isHighRisk
        ? `This NDA has ${illegal + dangerous} concerning clauses ${riskEmoji}`
        : `NDA looks fair — ${score}/100 ${riskEmoji}`;
      break;
    case "freelance":
      opening = isHighRisk
        ? `Freelance contract scored ${score}/100 — watch out! ${riskEmoji}`
        : `Freelance contract is fair! ${score}/100 ${riskEmoji}`;
      break;
    default:
      opening = `Contract scored ${score}/100 ${riskEmoji} on ClauseWall`;
  }

  // ── Red flag context ──
  let redFlagText = "";
  if (topRedFlag && isHighRisk) {
    const shortFlag =
      topRedFlag.length > 80
        ? topRedFlag.substring(0, 77) + "..."
        : topRedFlag;
    redFlagText = `\n🚩 ${shortFlag}`;
  }

  // ── Stats ──
  let statsText = "";
  if (illegal > 0)
    statsText += `\n⛔ ${illegal} illegal clause${illegal > 1 ? "s" : ""} found`;
  if (dangerous > 0)
    statsText += `\n🔴 ${dangerous} dangerous clause${dangerous > 1 ? "s" : ""}`;

  // ── Format-specific output ──
  if (format === "whatsapp") {
    return [
      `🛡️ *${opening}*`,
      redFlagText,
      statsText,
      "",
      `📍 ${state} | 📄 ${docType}`,
      "",
      `Check your contract free 👇`,
      url,
      "",
      `_Powered by ClauseWall — India's AI Contract Analyzer_`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (format === "twitter") {
    let tweet = `${opening}${redFlagText}`;
    if (tweet.length < 200) {
      tweet += `\n\nCheck yours free at ClauseWall 🛡️🇮🇳`;
    }
    return tweet;
  }

  // Generic
  return [
    opening,
    redFlagText,
    statsText,
    "",
    `📍 ${state}`,
    `📄 ${docType}`,
    "",
    `Check your contract: ${url}`,
  ]
    .filter(Boolean)
    .join("\n");
}