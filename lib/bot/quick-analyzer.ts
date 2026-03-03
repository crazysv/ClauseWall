// ============================================
// QUICK ANALYZER
// Text/PDF: Groq only
// Images: Gemini 2.5 Flash (returns extracted text + analysis)
// ============================================

import { callGeminiVision } from "@/lib/bot/gemini-client";
import { callGroq } from "@/lib/ai/groq-client";

// ---- TYPES ----

export interface QuickRedFlag {
  severity: "illegal" | "dangerous" | "warning";
  title: string;
  explanation: string;
  law_reference: string | null;
}

export interface QuickAnalysisResult {
  risk_score: number;
  risk_label: string;
  document_type_detected: string;
  total_clauses_found: number;
  red_flags: QuickRedFlag[];
  safe_highlights: string[];
  one_line_verdict: string;
  extracted_text?: string; // Only for image analysis — OCR'd text
}

// ---- SYSTEM PROMPT FOR TEXT ANALYSIS ----

const QUICK_SYSTEM_PROMPT = `You are ClauseWall — India's AI contract analyzer.

Analyze the contract and identify ALL predatory, illegal, dangerous, or unfair clauses.

Indian laws to check:
- Indian Contract Act 1872 (Sections 16, 23, 27, 28, 73, 74)
- Model Tenancy Act 2021 (Sections 4, 8, 22)
- State Rent Control Acts (Maharashtra, Karnataka, Delhi, Tamil Nadu, etc.)
- Payment of Wages Act 1936
- Industrial Disputes Act 1947
- Shops & Establishment Acts
- RBI Master Directions (lending, prepayment, penal interest)
- Consumer Protection Act 2019
- RERA 2016
- Information Technology Act 2000
- DPDP Act 2023
- Specific Relief Act 1963

RESPOND ONLY AS JSON:
{
  "risk_score": <0-100>,
  "risk_label": "<Low Risk|Medium Risk|High Risk|Critical Risk>",
  "document_type_detected": "<rental|employment|loan|tos|freelance|insurance|nda|other>",
  "total_clauses_found": <number>,
  "red_flags": [
    {
      "severity": "<illegal|dangerous|warning>",
      "title": "<5-8 word title>",
      "explanation": "<1-2 sentence plain English>",
      "law_reference": "<specific Indian law section or null>"
    }
  ],
  "safe_highlights": ["<positive clause description>"],
  "one_line_verdict": "<one sentence verdict>"
}

Rules:
- Maximum 5 red flags (most severe first — illegal before dangerous before warning)
- Maximum 2 safe highlights
- Be SPECIFIC about law violations (cite exact section)
- Use plain English anyone can understand
- Scoring: 0-30 = Low Risk, 31-55 = Medium Risk, 56-80 = High Risk, 81-100 = Critical Risk
- If the text is NOT a contract, set risk_score to 0 and say so in verdict`;

// ---- IMAGE ANALYSIS PROMPT (includes OCR extraction) ----

const IMAGE_PROMPT = `You are ClauseWall, India's AI contract analyzer.

This is a PHOTO of a contract/agreement document.

Step 1: Read ALL text in the image carefully (OCR).
Step 2: Analyze for predatory, illegal, or unfair clauses under Indian law.
Step 3: Return analysis AND the extracted text as JSON.

Check against: Indian Contract Act 1872, Model Tenancy Act 2021, state Rent Control Acts,
Payment of Wages Act, Consumer Protection Act 2019, RBI guidelines, RERA, DPDP Act 2023.

Return ONLY valid JSON (no other text):
{
  "risk_score": <0-100>,
  "risk_label": "<Low Risk|Medium Risk|High Risk|Critical Risk>",
  "document_type_detected": "<type>",
  "total_clauses_found": <number>,
  "red_flags": [
    {"severity": "<illegal|dangerous|warning>", "title": "<short title>", "explanation": "<plain English>", "law_reference": "<Indian law or null>"}
  ],
  "safe_highlights": ["<positive aspect>"],
  "one_line_verdict": "<one sentence>",
  "extracted_text": "<ALL text you read from the image, exactly as written, preserving original structure and formatting>"
}

IMPORTANT: The "extracted_text" field must contain the COMPLETE text from the image. Do not summarize — include every word.
If image is unclear or not a contract, say so in the verdict and set extracted_text to empty string.`;

// ============================================
// TEXT/PDF ANALYSIS — Groq only
// ============================================

export async function quickAnalyze(
  text: string,
  documentType?: string,
  jurisdiction?: string
): Promise<QuickAnalysisResult> {
  const maxChars = 6000;
  let contractText = text;

  if (text.length > maxChars) {
    const firstPart = Math.floor(maxChars * 0.6);
    const lastPart = maxChars - firstPart;
    contractText =
      text.substring(0, firstPart) +
      "\n\n[...contract continues...]\n\n" +
      text.substring(text.length - lastPart);
  }

  let userMessage = `Analyze this contract:\n\n${contractText}`;
  if (jurisdiction) userMessage += `\n\nJurisdiction: ${jurisdiction}`;
  if (documentType) userMessage += `\nDocument Type: ${documentType}`;

  const response = await callGroq(
    [
      { role: "system", content: QUICK_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    { temperature: 0.1, maxTokens: 2048 }
  );

  const parsed = parseAndValidate(response);
  return parsed;
}

// ============================================
// IMAGE ANALYSIS — Gemini 2.5 Flash (OCR + Analysis)
// Also returns extracted text for full analysis
// ============================================

export async function quickAnalyzeImage(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<QuickAnalysisResult> {
  console.log("[ClauseWall] Image analyze: Using Gemini 2.5 Flash...");

  const response = await callGeminiVision(IMAGE_PROMPT, imageBase64, mimeType, {
    temperature: 0.1,
    maxTokens: 8192, // Higher limit to include extracted_text
  });

  const parsed = parseAndValidate(response);
  console.log(
    `[ClauseWall] Image analyze: ✅ Gemini succeeded. Extracted ${
      parsed.extracted_text?.length || 0
    } chars of text`
  );
  return parsed;
}

// ============================================
// HELPER — Parse and validate response
// ============================================

function parseAndValidate(response: string): QuickAnalysisResult {
  let parsed: QuickAnalysisResult;

  try {
    parsed = JSON.parse(response);
  } catch {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }
    parsed = JSON.parse(jsonMatch[0]);
  }

  if (typeof parsed.risk_score !== "number") parsed.risk_score = 50;
  if (!parsed.risk_label) parsed.risk_label = "Medium Risk";
  if (!parsed.document_type_detected)
    parsed.document_type_detected = "other";
  if (typeof parsed.total_clauses_found !== "number")
    parsed.total_clauses_found = 0;
  if (!Array.isArray(parsed.red_flags)) parsed.red_flags = [];
  if (!Array.isArray(parsed.safe_highlights)) parsed.safe_highlights = [];
  if (!parsed.one_line_verdict)
    parsed.one_line_verdict = "Analysis completed.";

  parsed.risk_score = Math.max(0, Math.min(100, parsed.risk_score));

  // extracted_text is optional — only from image analysis
  if (parsed.extracted_text && typeof parsed.extracted_text !== "string") {
    parsed.extracted_text = undefined;
  }

  return parsed;
}