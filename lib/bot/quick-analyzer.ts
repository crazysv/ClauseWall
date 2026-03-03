// ============================================
// QUICK ANALYZER — Single Groq call for bot responses
// Fast enough for webhook timeout (~3-5 seconds)
// ============================================

import { callGroq } from "@/lib/ai/groq-client";
import Groq from "groq-sdk";

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
}

// ---- SYSTEM PROMPT FOR QUICK SCAN ----

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

// ---- QUICK TEXT ANALYSIS ----

export async function quickAnalyze(
  text: string,
  documentType?: string,
  jurisdiction?: string
): Promise<QuickAnalysisResult> {
  // Smart truncation — keep beginning and end (most important parts of contracts)
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

  const parsed = JSON.parse(response) as QuickAnalysisResult;

  // Ensure red_flags is always an array
  if (!Array.isArray(parsed.red_flags)) parsed.red_flags = [];
  if (!Array.isArray(parsed.safe_highlights)) parsed.safe_highlights = [];

  return parsed;
}

// ---- QUICK IMAGE ANALYSIS (OCR + Analysis in one call) ----

export async function quickAnalyzeImage(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<QuickAnalysisResult> {
  // Get an API key for vision model
  const API_KEYS = [
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
    process.env.GROQ_API_KEY,
  ].filter(Boolean) as string[];

  if (API_KEYS.length === 0) throw new Error("No Groq API keys configured");

  const groq = new Groq({ apiKey: API_KEYS[0] });

  const response = await groq.chat.completions.create({
    model: "llama-3.2-11b-vision-preview", // 11b is faster than 90b
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `You are ClauseWall, India's AI contract analyzer.

This is a PHOTO of a contract/agreement document.

Step 1: Read ALL text in the image carefully (OCR).
Step 2: Analyze for predatory, illegal, or unfair clauses under Indian law.
Step 3: Return analysis as JSON.

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
  "one_line_verdict": "<one sentence>"
}

If image is unclear or not a contract, say so in the verdict.`,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
            },
          },
        ],
      },
    ],
    temperature: 0.1,
    max_tokens: 2048,
  });

  const content = response.choices[0]?.message?.content || "";

  // Vision models don't always return clean JSON — extract it
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse analysis from image");
  }

  const parsed = JSON.parse(jsonMatch[0]) as QuickAnalysisResult;
  if (!Array.isArray(parsed.red_flags)) parsed.red_flags = [];
  if (!Array.isArray(parsed.safe_highlights)) parsed.safe_highlights = [];

  return parsed;
}