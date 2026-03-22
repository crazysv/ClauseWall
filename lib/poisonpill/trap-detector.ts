// ============================================
// POISON PILL — AI-POWERED TRAP DETECTOR
// The main AI brain for deep trap analysis
// ============================================

import { callGroq } from "@/lib/ai/groq-client";
import type {
  PoisonPillTrap,
  ClauseConnection,
  TrapPatternType,
  TrapSeverity,
  RiskLevel,
} from "@/types";
import type { PotentialTrapMatch } from "./pattern-matcher";

// ---- Input type ----
interface ClauseForDetection {
  clause_number: number;
  original_text: string;
  clause_type: string;
  risk_level: string;
  risk_score: number;
  explanation: string;
  legal_citation: string | null;
  extracted_value: number | null;
  extracted_unit: string | null;
}

// ============================================
// SYSTEM PROMPT
// ============================================

const SYSTEM_PROMPT = `You are an expert Indian contract analyst specializing in detecting hidden trap patterns — combinations of seemingly innocent clauses that work together to create devastating effects for the signer. You are performing a SECOND-PASS analysis on a contract that has already been analyzed clause-by-clause.

Your task: Find CLAUSE COMBINATIONS that create traps.

IMPORTANT: Individual clause risks have already been assessed. You are looking for SYNERGISTIC EFFECTS — where clauses that might be rated 'safe' or 'warning' individually become 'dangerous' or 'devastating' when combined.

Known trap patterns to check for:

1. INFINITE LOOP — Auto-renewal + Long notice period + Exit penalty. Creates: Impossible to leave without paying. Missing exit window auto-renews.

2. ESCALATION TRAP — Late payment fee + Compounding + Acceleration. Creates: Small missed payment snowballs into massive debt.

3. WAIVER CHAIN — Arbitration + Confidentiality + Indemnity. Creates: No legal recourse possible without bankruptcy.

4. SCOPE CREEP — Vague duties + Broad non-compete + Total IP assignment. Creates: Employer owns everything, controls all work, prevents leaving.

5. SILENT AMENDMENT — Unilateral modification + Deemed acceptance + Email notice. Creates: Terms can change without real consent.

6. DEPOSIT TRAP — High deposit + Broad deductions + No inspection + Short claim window. Creates: Deposit never returned.

7. TERMINATION ASYMMETRY — Instant termination by them + Long notice by you + No severance + Non-compete. Creates: Fired without cause, no money, can't work elsewhere.

8. INSURANCE VOID — Multiple exclusions + Broad pre-existing + Long waiting + High co-pay. Creates: Insurance that covers almost nothing.

9. JURISDICTION TRAP — Foreign governing law + Their city jurisdiction + Short limitation. Creates: Practically impossible to dispute.

10. DATA HOSTAGE — They own your data + No portability + Deletion on exit + Short retrieval. Creates: Locked into service or lose everything.

ALSO: Detect ANY other clause combination that creates a synergistic negative effect. Don't limit yourself to these 10 patterns.

For each trap found, respond with JSON containing these fields:
- pattern_type: one of the 10 types above, or 'custom'
- trap_name: recognizable name (e.g., "The Infinite Loop")
- severity: devastating/severe/moderate/minor
- title: one-line title
- description: full explanation of how the trap works
- how_it_works: step-by-step how the trap activates
- real_world_impact: what this means in plain language for the signer
- mechanisms: array of objects with { step_number, clause_number, clause_type, clause_text_snippet (first 150 chars), role_in_trap, individual_risk (safe/warning/dangerous/illegal), contribution_to_trap }
- connections: array of { from_clause_number, to_clause_number, connection_type (enables/amplifies/blocks_escape/triggers/compounds/overrides), description, strength (strong/moderate/weak) }
- combined_risk_score: 0-100 for the combined trap (MUST be higher than individual average)
- individual_risk_average: average risk score of individual clauses
- risk_multiplier: combined / individual ratio
- financial_worst_case: number in INR or null if not quantifiable
- financial_explanation: how the money damage compounds
- trigger_event: what activates the trap (e.g., "missing notice deadline")
- escape_difficulty: impossible/very_hard/hard/moderate/easy
- escape_options: array of ways to escape or mitigate
- legal_citations: array of Indian laws that may help
- negotiation_priority: must_change/should_change/nice_to_change
- which_clause_to_target: which single clause number to negotiate first to break the trap
- why_target_this_clause: why targeting this clause breaks the entire trap

Respond ONLY in JSON: { "traps": [...] }

Critical rules:
- Only flag GENUINE trap combinations. Don't invent connections that don't exist.
- The combined_risk_score MUST be higher than individual_risk_average for it to be a trap.
- Consider the document_type and jurisdiction when assessing severity.
- Reference specific Indian laws where applicable.
- Be specific — quote clause text, reference clause numbers.
- If no traps are found, return { "traps": [] }`;

// ============================================
// MAIN DETECTION FUNCTION
// ============================================

export async function detectPoisonPills(
  clauses: ClauseForDetection[],
  potentialMatches: PotentialTrapMatch[],
  textConnections: ClauseConnection[],
  documentType: string,
  jurisdiction: string,
  entityName: string | null
): Promise<PoisonPillTrap[]> {
  try {
    // Build user prompt
    const matchSummary =
      potentialMatches.length > 0
        ? potentialMatches
            .map(
              (m) =>
                `- ${m.pattern_name} (${m.confidence} confidence): clauses ${m.matching_clauses.join(", ")}`
            )
            .join("\n")
        : "None detected by pre-screening.";

    const connectionSummary =
      textConnections.length > 0
        ? textConnections
            .map(
              (c) =>
                `- Clause ${c.from_clause_number} → Clause ${c.to_clause_number} (${c.connection_type}): ${c.description}`
            )
            .join("\n")
        : "No cross-references found.";

    const clauseList = clauses
      .map((c) => {
        const truncated =
          c.original_text.length > 300
            ? c.original_text.substring(0, 300) + "..."
            : c.original_text;
        return `Clause ${c.clause_number} [${c.clause_type}] (Risk: ${c.risk_level}, Score: ${c.risk_score}):\n"${truncated}"`;
      })
      .join("\n\n");

    const userMessage = `Document type: ${documentType}
Jurisdiction: ${jurisdiction}
Entity: ${entityName || "Unknown"}

Pre-screened potential traps found:
${matchSummary}

Text-based clause connections found:
${connectionSummary}

All clauses in this contract (${clauses.length} total):

${clauseList}

Find all clause combination traps in this contract.`;

    // Call Groq
    const response = await callGroq(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      {
        temperature: 0.1,
        maxTokens: 4096,
      }
    );

    // Parse response
    const parsed = parseAIResponse(response);

    // Validate and sanitize
    const validatedTraps = validateTraps(parsed, clauses);

    // Sort: devastating first, then by combined_risk_score
    validatedTraps.sort((a, b) => {
      const severityOrder: Record<TrapSeverity, number> = {
        devastating: 0,
        severe: 1,
        moderate: 2,
        minor: 3,
      };
      const sevDiff =
        (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3);
      if (sevDiff !== 0) return sevDiff;
      return b.combined_risk_score - a.combined_risk_score;
    });

    // If too many traps, filter out 'minor' ones
    if (validatedTraps.length > 10) {
      return validatedTraps.filter((t) => t.severity !== "minor");
    }

    return validatedTraps;
  } catch (error) {
    console.error("[PoisonPill] AI detection failed:", error);
    return [];
  }
}

// ============================================
// RESPONSE PARSING
// ============================================

function parseAIResponse(response: string): any[] {
  try {
    // Try direct parse
    const data = JSON.parse(response);
    if (Array.isArray(data.traps)) return data.traps;
    if (Array.isArray(data)) return data;
    return [];
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        if (Array.isArray(data.traps)) return data.traps;
        if (Array.isArray(data)) return data;
      } catch {
        // Fall through
      }
    }

    // Try to find JSON object in the response
    const objectMatch = response.match(/\{[\s\S]*"traps"[\s\S]*\}/);
    if (objectMatch) {
      try {
        const data = JSON.parse(objectMatch[0]);
        if (Array.isArray(data.traps)) return data.traps;
      } catch {
        // Fall through
      }
    }

    console.error("[PoisonPill] Failed to parse AI response");
    return [];
  }
}

// ============================================
// VALIDATION
// ============================================

const VALID_PATTERN_TYPES: TrapPatternType[] = [
  "infinite_loop", "escalation_trap", "waiver_chain", "scope_creep",
  "silent_amendment", "deposit_trap", "termination_asymmetry",
  "insurance_void", "jurisdiction_trap", "data_hostage", "custom",
];

const VALID_SEVERITIES: TrapSeverity[] = [
  "devastating", "severe", "moderate", "minor",
];

const VALID_RISK_LEVELS: RiskLevel[] = ["safe", "warning", "dangerous", "illegal"];

function validateTraps(
  rawTraps: any[],
  clauses: ClauseForDetection[]
): PoisonPillTrap[] {
  const clauseNumbers = new Set(clauses.map((c) => c.clause_number));
  const validated: PoisonPillTrap[] = [];
  let idCounter = 1;

  for (const raw of rawTraps) {
    try {
      // Validate pattern_type
      const patternType: TrapPatternType = VALID_PATTERN_TYPES.includes(
        raw.pattern_type
      )
        ? raw.pattern_type
        : "custom";

      // Validate severity
      const severity: TrapSeverity = VALID_SEVERITIES.includes(raw.severity)
        ? raw.severity
        : "moderate";

      // Validate mechanisms — must reference real clause numbers
      const mechanisms = Array.isArray(raw.mechanisms)
        ? raw.mechanisms
            .filter((m: any) => clauseNumbers.has(m.clause_number))
            .map((m: any, idx: number) => ({
              step_number: m.step_number || idx + 1,
              clause_number: m.clause_number,
              clause_type: String(m.clause_type || "unknown"),
              clause_text_snippet: String(
                m.clause_text_snippet || ""
              ).substring(0, 150),
              role_in_trap: String(m.role_in_trap || ""),
              individual_risk: VALID_RISK_LEVELS.includes(m.individual_risk)
                ? m.individual_risk
                : "warning",
              contribution_to_trap: String(m.contribution_to_trap || ""),
            }))
        : [];

      // Skip if no valid mechanisms
      if (mechanisms.length < 2) continue;

      // Validate connections
      const connections = Array.isArray(raw.connections)
        ? raw.connections
            .filter(
              (c: any) =>
                clauseNumbers.has(c.from_clause_number) &&
                clauseNumbers.has(c.to_clause_number)
            )
            .map((c: any) => ({
              from_clause_number: c.from_clause_number,
              to_clause_number: c.to_clause_number,
              connection_type: [
                "enables", "amplifies", "blocks_escape", "triggers",
                "compounds", "overrides", "references", "depends_on",
              ].includes(c.connection_type)
                ? c.connection_type
                : "enables",
              description: String(c.description || ""),
              strength: ["strong", "moderate", "weak"].includes(c.strength)
                ? c.strength
                : "moderate",
            }))
        : [];

      // Validate scores
      const individualAvg = Math.max(
        0,
        Math.min(100, Number(raw.individual_risk_average) || 30)
      );
      const combinedScore = Math.max(
        individualAvg + 1,
        Math.min(100, Number(raw.combined_risk_score) || 60)
      );
      const multiplier = individualAvg > 0
        ? Math.round((combinedScore / individualAvg) * 10) / 10
        : 1;

      // Validate escape difficulty
      const escapeDifficulty = [
        "impossible", "very_hard", "hard", "moderate", "easy",
      ].includes(raw.escape_difficulty)
        ? raw.escape_difficulty
        : "hard";

      // Validate negotiation priority
      const negPriority = [
        "must_change", "should_change", "nice_to_change",
      ].includes(raw.negotiation_priority)
        ? raw.negotiation_priority
        : "should_change";

      // Validate which_clause_to_target
      const targetClause = clauseNumbers.has(raw.which_clause_to_target)
        ? raw.which_clause_to_target
        : mechanisms[0]?.clause_number || 1;

      const trap: PoisonPillTrap = {
        id: `trap_${patternType}_${idCounter++}`,
        pattern_type: patternType,
        trap_name: String(raw.trap_name || raw.pattern_type || "Unknown Trap"),
        severity,
        title: String(raw.title || raw.trap_name || "Hidden Trap Detected"),
        description: String(raw.description || ""),
        how_it_works: String(raw.how_it_works || ""),
        real_world_impact: String(raw.real_world_impact || ""),
        mechanisms,
        connections,
        individual_risk_average: individualAvg,
        combined_risk_score: combinedScore,
        risk_multiplier: multiplier,
        financial_worst_case:
          raw.financial_worst_case != null
            ? Number(raw.financial_worst_case)
            : null,
        financial_explanation: String(raw.financial_explanation || ""),
        trigger_event: String(raw.trigger_event || ""),
        escape_difficulty: escapeDifficulty,
        escape_options: Array.isArray(raw.escape_options)
          ? raw.escape_options.map(String)
          : [],
        legal_citations: Array.isArray(raw.legal_citations)
          ? raw.legal_citations.map(String)
          : [],
        negotiation_priority: negPriority,
        which_clause_to_target: targetClause,
        why_target_this_clause: String(raw.why_target_this_clause || ""),
      };

      validated.push(trap);
    } catch (err) {
      console.error("[PoisonPill] Skipping invalid trap:", err);
      continue;
    }
  }

  return validated;
}
