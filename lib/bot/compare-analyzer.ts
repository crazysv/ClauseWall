// ============================================
// CONTRACT COMPARISON ANALYZER
// Single AI call to compare two contracts
// ============================================

import { callGroq } from "@/lib/ai/groq-client";

export interface ClauseComparison {
  clause_type: string;
  contract_a: {
    summary: string;
    risk_level: "safe" | "warning" | "dangerous" | "illegal";
    value: string;
  };
  contract_b: {
    summary: string;
    risk_level: "safe" | "warning" | "dangerous" | "illegal";
    value: string;
  };
  winner: "A" | "B" | "tie";
  explanation: string;
}

export interface ComparisonResult {
  score_a: number;
  score_b: number;
  label_a: string;
  label_b: string;
  winner: "A" | "B" | "tie";
  verdict: string;
  clause_comparisons: ClauseComparison[];
  key_differences: string[];
  recommendation: string;
}

const COMPARE_SYSTEM_PROMPT = `You are ClauseWall — India's AI contract analyzer.

Compare two contracts and determine which one is fairer/safer for the user (tenant/employee/borrower).

Check against Indian laws:
- Indian Contract Act 1872
- Model Tenancy Act 2021
- State Rent Control Acts
- Payment of Wages Act 1936
- RBI Lending Guidelines
- Consumer Protection Act 2019
- DPDP Act 2023

RESPOND ONLY AS JSON:
{
  "score_a": <0-100 risk score for Contract A>,
  "score_b": <0-100 risk score for Contract B>,
  "label_a": "<Low Risk|Medium Risk|High Risk|Critical Risk>",
  "label_b": "<Low Risk|Medium Risk|High Risk|Critical Risk>",
  "winner": "<A|B|tie>",
  "verdict": "<one sentence — which contract is better and why>",
  "clause_comparisons": [
    {
      "clause_type": "<e.g., security_deposit, notice_period, etc.>",
      "contract_a": {
        "summary": "<what Contract A says>",
        "risk_level": "<safe|warning|dangerous|illegal>",
        "value": "<key value, e.g., 10 months>"
      },
      "contract_b": {
        "summary": "<what Contract B says>",
        "risk_level": "<safe|warning|dangerous|illegal>",
        "value": "<key value, e.g., 2 months>"
      },
      "winner": "<A|B|tie>",
      "explanation": "<why one is better>"
    }
  ],
  "key_differences": ["<difference 1>", "<difference 2>", "<difference 3>"],
  "recommendation": "<2-3 sentence recommendation for the user>"
}

Rules:
- Compare at least 3 and maximum 8 clause types
- Lower score = safer contract
- Be SPECIFIC about values and differences
- Cite Indian law where relevant
- Use plain English anyone can understand
- If one contract is clearly worse, say so directly`;

export async function compareContracts(
  textA: string,
  textB: string,
  documentType?: string
): Promise<ComparisonResult> {
  const maxChars = 4000;

  // Truncate both contracts smartly
  const truncate = (text: string) => {
    if (text.length <= maxChars) return text;
    const first = Math.floor(maxChars * 0.6);
    const last = maxChars - first;
    return (
      text.substring(0, first) +
      "\n[...continues...]\n" +
      text.substring(text.length - last)
    );
  };

  const contractA = truncate(textA);
  const contractB = truncate(textB);

  let userMessage = `Compare these two contracts:\n\n`;
  userMessage += `=== CONTRACT A ===\n${contractA}\n\n`;
  userMessage += `=== CONTRACT B ===\n${contractB}`;
  if (documentType) userMessage += `\n\nDocument Type: ${documentType}`;

  const response = await callGroq(
    [
      { role: "system", content: COMPARE_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    { temperature: 0.1, maxTokens: 4096 }
  );

  const parsed = parseAndValidate(response);
  return parsed;
}

function parseAndValidate(response: string): ComparisonResult {
  let parsed: ComparisonResult;

  try {
    parsed = JSON.parse(response);
  } catch {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No valid JSON in comparison response");
    parsed = JSON.parse(jsonMatch[0]);
  }

  // Defaults
  if (typeof parsed.score_a !== "number") parsed.score_a = 50;
  if (typeof parsed.score_b !== "number") parsed.score_b = 50;
  if (!parsed.label_a) parsed.label_a = "Medium Risk";
  if (!parsed.label_b) parsed.label_b = "Medium Risk";
  if (!parsed.winner) parsed.winner = "tie";
  if (!parsed.verdict) parsed.verdict = "Both contracts have similar risk levels.";
  if (!Array.isArray(parsed.clause_comparisons)) parsed.clause_comparisons = [];
  if (!Array.isArray(parsed.key_differences)) parsed.key_differences = [];
  if (!parsed.recommendation) parsed.recommendation = "Review both contracts carefully.";

  parsed.score_a = Math.max(0, Math.min(100, parsed.score_a));
  parsed.score_b = Math.max(0, Math.min(100, parsed.score_b));

  return parsed;
}

// ---- FORMAT FOR TELEGRAM ----

export function formatComparisonTelegram(result: ComparisonResult): string {
  const emojiA = getScoreEmoji(result.score_a);
  const emojiB = getScoreEmoji(result.score_b);
  const winnerEmoji = result.winner === "A" ? "🅰️" : result.winner === "B" ? "🅱️" : "🤝";

  let msg = `🔍 <b>ClauseWall Contract Comparison</b>\n\n`;

  msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  msg += `🅰️ <b>Contract A:</b> ${result.score_a}/100 ${emojiA} ${result.label_a}\n`;
  msg += `🅱️ <b>Contract B:</b> ${result.score_b}/100 ${emojiB} ${result.label_b}\n\n`;

  msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  msg += `📊 <b>Clause-by-Clause:</b>\n\n`;

  for (const comp of result.clause_comparisons) {
    const winIcon = comp.winner === "A" ? "🅰️" : comp.winner === "B" ? "🅱️" : "🤝";
    const riskA = getRiskEmoji(comp.contract_a.risk_level);
    const riskB = getRiskEmoji(comp.contract_b.risk_level);

    msg += `<b>${escapeHtml(comp.clause_type.replace(/_/g, " ").toUpperCase())}</b> ${winIcon}\n`;
    msg += `  🅰️ ${riskA} ${escapeHtml(comp.contract_a.value)}\n`;
    msg += `  🅱️ ${riskB} ${escapeHtml(comp.contract_b.value)}\n\n`;
  }

  msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (result.key_differences.length > 0) {
    msg += `⚡ <b>Key Differences:</b>\n`;
    for (const diff of result.key_differences) {
      msg += `  • ${escapeHtml(diff)}\n`;
    }
    msg += `\n`;
  }

  msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  msg += `${winnerEmoji} <b>Verdict:</b> ${escapeHtml(result.verdict)}\n\n`;
  msg += `💡 <i>${escapeHtml(result.recommendation)}</i>`;

  return msg;
}

function getScoreEmoji(score: number): string {
  if (score >= 80) return "⛔";
  if (score >= 60) return "🔴";
  if (score >= 30) return "🟡";
  return "🟢";
}

function getRiskEmoji(level: string): string {
  switch (level) {
    case "illegal": return "⛔";
    case "dangerous": return "🔴";
    case "warning": return "⚠️";
    case "safe": return "✅";
    default: return "📄";
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}