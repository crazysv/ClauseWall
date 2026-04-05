// ============================================
// ADVERSARIAL CLAUSE DETECTION ENGINE
// Thinks like a predatory drafter to detect tricks
// ============================================

import { callGroq } from "@/lib/ai/groq-client";
import type { AdversarialResult } from "@/types";
import { safeParseJson, safeString, safeNumber, safeArray, safeStringArray, safeArrayMap, safeEnum } from "./output-guards";

const ADVERSARIAL_SYSTEM_PROMPT = `You are a legal deception analyst specializing in Indian contracts. Your job is to analyze a contract clause from TWO perspectives:

PERSPECTIVE 1 — NAIVE READER: How a normal person would read this clause.
PERSPECTIVE 2 — PREDATORY LAWYER: How a lawyer who DRAFTED this to exploit the weaker party intended it.

Your task is to identify the GAP between these two readings and expose any hidden deception.

DISGUISE TECHNIQUES YOU MUST CHECK FOR:

1. vague_quantifier — Words like "reasonable", "appropriate", "adequate", "necessary" that give unlimited discretion to one party.

2. unilateral_reference — Phrases like "as determined by Owner/Company", "at the sole discretion of", "as per management's decision" that give one party all decision power.

3. external_schedule — References like "as per Schedule B", "per Annexure", "subject to terms in appendix" that hide real terms in another document the reader may not have seen.

4. double_negative — Phrasing like "not unreasonable", "shall not be denied without cause" that confuses readers into thinking it's protective when it isn't.

5. passive_voice_shift — Phrases like "deposit may be adjusted", "rent shall be revised" that hide WHO has the power to act.

6. buried_exception — References like "except as provided in clause 14(b)(iii)" that create escape hatches buried deep in the contract.

7. false_mutual — Clauses that say "either party may terminate" but penalties only apply to one party.

8. time_bomb — Terms like "first 12 months", "initial period" where conditions change dramatically after a hidden period.

9. scope_creep — "including but not limited to" that creates unlimited scope disguised as examples.

10. consent_assumed — "deemed to have agreed", "silence constitutes acceptance" that removes need for actual consent.

11. liability_shift — "tenant shall indemnify and hold harmless" that shifts all risk to weaker party.

12. definition_manipulation — Unusual definitions in preamble that redefine common words to change meaning.

13. false_standard — "as per market standard", "industry practice" with no actual standard defined.

SCORING:
- 0-2: Transparent — clause says what it means
- 3-4: Slightly Obscured — minor vagueness, likely not intentional
- 5-6: Deliberately Vague — crafted to give one party advantage
- 7-8: Deceptive — multiple techniques used to hide true intent
- 9-10: Predatory Disguise — systematically designed to exploit

You MUST respond with ONLY valid JSON in this exact format:
{
  "deception_score": <number 0-10>,
  "deception_level": "<none|low|medium|high|extreme>",
  "disguise_techniques": [
    {
      "technique": "<technique_key from list above>",
      "label": "<human readable name>",
      "phrase": "<exact phrase from clause that uses this technique>",
      "explanation": "<why this phrase is deceptive in plain English>",
      "severity": "<low|medium|high>"
    }
  ],
  "decoded_meaning": "<what this clause ACTUALLY means in plain Hindi-English>",
  "hidden_powers": ["<power 1 this clause secretly gives>", "<power 2>"],
  "cross_references": ["<any external documents referenced>"],
  "vague_terms": ["<exploitable vague word 1>", "<word 2>"],
  "one_sided_triggers": ["<phrase giving unilateral power 1>"],
  "surface_reading": "<what a normal person would THINK this clause says>",
  "true_reading": "<what a predatory lawyer INTENDED this clause to do>",
  "risk_amplification": <number 1-5, how many times riskier than it appears>
}

If the clause is genuinely transparent with no deception, return deception_score 0-1 with empty arrays.`;

/**
 * Analyze a clause for hidden deception and disguise techniques
 */
export async function analyzeAdversarial(
  clauseText: string,
  clauseType: string,
  jurisdiction: string,
  documentType: string
): Promise<AdversarialResult> {
  try {
    const response = await callGroq(
      [
        {
          role: "system",
          content: ADVERSARIAL_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Analyze this clause for hidden deception:

CLAUSE TYPE: ${clauseType}
DOCUMENT TYPE: ${documentType}
JURISDICTION: ${jurisdiction}

CLAUSE TEXT:
"${clauseText}"

Respond with JSON only.`,
        },
      ],
      {
        temperature: 0.2,
        maxTokens: 2048,
      }
    );

    const parsed = safeParseJson(response);
    if (!parsed) {
      console.error("[ClauseWall] [Adversarial] Failed to parse response");
      return createFallbackAdversarialResult();
    }

    const DECEPTION_LEVELS = ["none", "low", "medium", "high", "extreme"] as const;
    const SEVERITIES = ["low", "medium", "high"] as const;

    // Validate and sanitize with guards
    return {
      deception_score: safeNumber(parsed.deception_score, 0, 0, 10),
      deception_level: safeEnum(parsed.deception_level, DECEPTION_LEVELS, "low"),
      disguise_techniques: safeArrayMap(parsed.disguise_techniques, (t) => {
        const item = t as Record<string, unknown> | null;
        if (!item) return null;
        return {
          technique: safeString(item.technique, "unknown", 100),
          label: safeString(item.label, "Unknown Technique", 200),
          phrase: safeString(item.phrase, ""),
          explanation: safeString(item.explanation, ""),
          severity: safeEnum(item.severity, SEVERITIES, "medium"),
        };
      }),
      decoded_meaning: safeString(parsed.decoded_meaning, "Could not decode."),
      hidden_powers: safeStringArray(parsed.hidden_powers),
      cross_references: safeStringArray(parsed.cross_references),
      vague_terms: safeStringArray(parsed.vague_terms),
      one_sided_triggers: safeStringArray(parsed.one_sided_triggers),
      surface_reading: safeString(parsed.surface_reading, ""),
      true_reading: safeString(parsed.true_reading, ""),
      risk_amplification: safeNumber(parsed.risk_amplification, 1, 1, 5),
    };
  } catch (error) {
    console.error("[ClauseWall] [Adversarial] Analysis failed:", error);
    return createFallbackAdversarialResult();
  }
}

function createFallbackAdversarialResult(): AdversarialResult {
  return {
    deception_score: 0,
    deception_level: "low",
    disguise_techniques: [],
    decoded_meaning: "Adversarial analysis could not be completed. Manual review recommended.",
    hidden_powers: [],
    cross_references: [],
    vague_terms: [],
    one_sided_triggers: [],
    surface_reading: "",
    true_reading: "",
    risk_amplification: 1,
  };
}