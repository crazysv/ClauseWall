// ============================================
// EXTENSION API — Quick ToS Analysis
// POST /api/extension/analyze
// Saves results to database for "View Full Analysis" link
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { callGroq } from "@/lib/ai/groq-client";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

// ── CORS Headers ────────────────────────────

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

// ── Specialized Extension Prompt ────────────

const EXTENSION_SYSTEM_PROMPT = `You are ClauseWall, an AI contract analyzer for Indian users. You're analyzing a Terms of Service, Privacy Policy, or legal page from a website.

Quickly identify the most concerning and predatory clauses that affect users.

RESPOND IN THIS EXACT JSON FORMAT — no markdown, no text outside JSON:
{
  "risk_score": <0-100 overall risk>,
  "risk_level": "safe" | "warning" | "dangerous" | "illegal",
  "summary": "<2 sentence summary of key concerns>",
  "total_clauses_estimated": <estimated number of distinct clauses/sections>,
  "clause_counts": {
    "safe": <estimated count>,
    "warning": <estimated count>,
    "dangerous": <estimated count>,
    "illegal": <estimated count>
  },
  "top_issues": [
    {
      "text": "<EXACT quote from the document, max 300 chars>",
      "risk_level": "warning" | "dangerous" | "illegal",
      "risk_score": <0-100>,
      "title": "<short 3-5 word title>",
      "explanation": "<1 sentence plain English explanation a student would understand>",
      "legal_issue": "<specific legal concern, reference Indian law if applicable>",
      "fair_alternative": "<how this clause should read if fair, or null>"
    }
  ]
}

FOCUS ON THESE PREDATORY PATTERNS:
1. Forced arbitration — prevents suing in court
2. Blanket data sharing with unnamed third parties
3. Unilateral modification of terms without notice
4. Auto-renewal traps without clear disclosure
5. Excessive limitation of liability
6. Jurisdiction outside India (disadvantages Indian users)
7. Waiver of consumer rights (Consumer Protection Act, 2019)
8. Excessive data collection (IT Act, 2000, Section 43A)
9. No refund / no cancellation policy (unfair trade practice)
10. One-sided termination rights (company can terminate, user can't)
11. Content licensing — company owns user-generated content
12. Forced consent bundling — must agree to everything or nothing
13. Indemnification — user bears all legal costs
14. Binding changes — changes apply even without re-consent

RULES:
- Find 5-10 most concerning clauses maximum
- "text" MUST be exact quotes from the document — not paraphrased
- Be honest — if the ToS is genuinely fair, give a low score
- Focus on impact on Indian users and Indian law
- Keep explanations extremely simple — one sentence max
- If fewer than 5 concerning clauses exist, return fewer
- For safe documents (score < 20), top_issues can be empty array
- Reference Indian Consumer Protection Act, 2019 and IT Act, 2000 where relevant`;

// ── Main Handler ────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── Rate Limiting ──
    const rl = await rateLimit(req, "AI_MEDIUM");
    if (!rl.success) return rateLimitResponse(rl);

    const body = await req.json();
    const { url, text, title } = body as {
      url: string;
      text: string;
      title: string;
    };

    // Validate
    if (!text || text.trim().length < 100) {
      return NextResponse.json(
        {
          error: true,
          message:
            "Not enough text content to analyze. Page might not contain legal text.",
          risk_score: 0,
          risk_level: "safe",
          summary: "Could not analyze — insufficient text content.",
          clause_counts: { safe: 0, warning: 0, dangerous: 0, illegal: 0 },
          top_issues: [],
          document_id: null,
        },
        { headers: corsHeaders },
      );
    }

    // Truncate text to avoid token limits
    const truncatedText = text.substring(0, 25000);

    // Build user prompt
    const userPrompt = `Analyze this legal page from: ${url || "unknown website"}
Title: ${title || "Unknown"}

--- DOCUMENT TEXT ---
${truncatedText}
--- END OF DOCUMENT ---

Identify the top predatory/concerning clauses. Return JSON only.`;

    // Call Groq
    const response = await callGroq(
      [
        { role: "system", content: EXTENSION_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      {
        temperature: 0.1,
        maxTokens: 4096,
        retries: 2,
      },
    );

    // Parse response
    const analysis = JSON.parse(response);

    // Validate and sanitize response
    const riskScore = Math.min(100, Math.max(0, analysis.risk_score || 0));
    const riskLevel = validateRiskLevel(analysis.risk_level);
    const clauseCounts = {
      safe: analysis.clause_counts?.safe || 0,
      warning: analysis.clause_counts?.warning || 0,
      dangerous: analysis.clause_counts?.dangerous || 0,
      illegal: analysis.clause_counts?.illegal || 0,
    };
    const topIssues = (analysis.top_issues || [])
      .slice(0, 10)
      .map((issue: any, index: number) => ({
        text: (issue.text || "").substring(0, 500),
        risk_level: validateRiskLevel(issue.risk_level),
        risk_score: Math.min(100, Math.max(0, issue.risk_score || 50)),
        title: (issue.title || "Concerning Clause").substring(0, 60),
        explanation: (issue.explanation || "").substring(0, 300),
        legal_issue: (issue.legal_issue || "").substring(0, 300),
        fair_alternative: (issue.fair_alternative || "").substring(0, 500),
        clause_number: index + 1,
      }));


    const result = {
      risk_score: riskScore,
      risk_level: riskLevel,
      summary: analysis.summary || "Analysis complete.",
      total_clauses_estimated:
        analysis.total_clauses_estimated || topIssues.length,
      clause_counts: clauseCounts,
      top_issues: topIssues,
      document_id: null, // Stateless extension scan
      analyzed_url: url || "",
      analyzed_at: new Date().toISOString(),
    };

    return NextResponse.json(result, { headers: corsHeaders });
  } catch (error: any) {
    console.error("[ClauseWall Extension API] Error:", error);

    return NextResponse.json(
      {
        error: true,
        message: error.message || "Analysis failed. Please try again.",
        risk_score: 0,
        risk_level: "safe",
        summary: "Analysis failed.",
        clause_counts: { safe: 0, warning: 0, dangerous: 0, illegal: 0 },
        top_issues: [],
        document_id: null,
      },
      { status: 500, headers: corsHeaders },
    );
  }
}

// ── Helpers ──────────────────────────────────

function validateRiskLevel(level: string): string {
  const valid = ["safe", "warning", "dangerous", "illegal"];
  return valid.includes(level) ? level : "warning";
}
