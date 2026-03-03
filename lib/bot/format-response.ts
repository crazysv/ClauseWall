// ============================================
// FORMAT ANALYSIS RESULTS FOR TELEGRAM
// ============================================

import type { QuickAnalysisResult } from "./quick-analyzer";

const SEVERITY_EMOJI: Record<string, string> = {
  illegal: "⛔",
  dangerous: "🔴",
  warning: "⚠️",
};

const RISK_EMOJI: Record<string, string> = {
  "Low Risk": "🟢",
  "Medium Risk": "🟡",
  "High Risk": "🔴",
  "Critical Risk": "⛔",
};

// ---- TELEGRAM RESPONSE ----

export function formatTelegramResponse(
  result: QuickAnalysisResult,
  options?: {
    appUrl?: string;
    resultUrl?: string;
    showAnalyzingNote?: boolean;
  }
): string {
  const riskEmoji = RISK_EMOJI[result.risk_label] || "📊";

  let msg = `🛡️ <b>ClauseWall Quick Scan</b>\n\n`;
  msg += `📄 Type: ${result.document_type_detected} • ${result.total_clauses_found} clauses found\n`;
  msg += `\n━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (result.red_flags.length > 0) {
    msg += `🚨 <b>Potential Issues Found:</b>\n\n`;
    for (const flag of result.red_flags) {
      const emoji = SEVERITY_EMOJI[flag.severity] || "⚠️";
      msg += `${emoji} <b>${escapeHtml(flag.title)}</b>\n`;
      msg += `   └ ${escapeHtml(flag.explanation)}\n\n`;
    }
  } else {
    msg += `✅ No major red flags found in quick scan!\n\n`;
  }

  if (result.safe_highlights.length > 0) {
    for (const h of result.safe_highlights) {
      msg += `✅ ${escapeHtml(h)}\n`;
    }
    msg += `\n`;
  }

  msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  msg += `💬 <i>${escapeHtml(result.one_line_verdict)}</i>\n\n`;

  msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  msg += `⏳ <b>Full verified analysis in progress...</b>\n`;
  msg += `📋 Checking against 750+ Indian legal rules\n`;
  msg += `⏱️ Results will be sent in ~30-60 seconds`;

  return msg;
}

// ---- WELCOME MESSAGE ----

export function getWelcomeMessageTelegram(): string {
  return `🛡️ <b>Welcome to ClauseWall!</b>

I analyze contracts and flag predatory, illegal, or unfair clauses using Indian law.

<b>Send me:</b>
📄 A <b>PDF</b> of your contract
📸 A <b>photo</b> of a paper contract
📝 <b>Paste the text</b> of any agreement

<b>I'll flag:</b>
⛔ Illegal clauses (with exact law citations)
🔴 Dangerous one-sided terms
⚠️ Warnings worth reviewing

<b>I check against 750+ rules including:</b>
• Indian Contract Act 1872
• Model Tenancy Act 2021
• State Rent Control Acts
• Employment & Labor Laws
• RBI Lending Guidelines
• Consumer Protection Act 2019
• DPDP Act 2023

<i>Your documents are private and never stored.</i>

Send a contract to get started! 👇`;
}

// ---- HELPERS ----

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}