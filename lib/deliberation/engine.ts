// ============================================
// ADVERSARIAL DELIBERATION ENGINE
// Orchestrates three-agent sequential debate
// with rate limiting and graceful degradation
// ============================================

import { callGroq } from "@/lib/ai/groq-client";
import type {
  AgentRole,
  AgentTone,
  AgentArgument,
  ArbiterVerdict,
  ClauseDeliberation,
  DeliberationResult,
  DeliberationProgress,
  DeliberationVerdict,
  DeliberationSummary,
} from "./types";
import {
  getPredatorPrompt,
  getGuardianPrompt,
  getArbiterPrompt,
} from "./prompts";

// ============================================
// TOKEN BUCKET RATE LIMITER
// Prevents exceeding Groq's 30 req/min limit
// ============================================

class TokenBucket {
  private callTimestamps: number[] = [];
  private maxCallsPerWindow: number = 25; // Keep 5 call buffer below 30
  private windowMs: number = 60_000;

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    // Clean up timestamps older than window
    this.callTimestamps = this.callTimestamps.filter(
      (t) => now - t < this.windowMs
    );

    // If at capacity, wait until oldest exits window
    while (this.callTimestamps.length >= this.maxCallsPerWindow) {
      const oldestTimestamp = this.callTimestamps[0];
      const waitTime = this.windowMs - (Date.now() - oldestTimestamp) + 100;
      console.log(
        `[ClauseWall] [Deliberation] Rate limit: waiting ${waitTime}ms`
      );
      await new Promise((resolve) => setTimeout(resolve, Math.max(100, waitTime)));
      // Re-clean after waiting
      const nowAfterWait = Date.now();
      this.callTimestamps = this.callTimestamps.filter(
        (t) => nowAfterWait - t < this.windowMs
      );
    }

    // Record this call
    this.callTimestamps.push(Date.now());
  }
}

const rateLimiter = new TokenBucket();

// ============================================
// AGENT NAME RESOLVER
// ============================================

function getAgentName(role: AgentRole): string {
  switch (role) {
    case "predator":
      return "Corporate Defense Counsel";
    case "guardian":
      return "Consumer Rights Advocate";
    case "arbiter":
      return "Judicial Arbiter";
  }
}

// ============================================
// UUID GENERATOR
// ============================================

function generateId(): string {
  // Use crypto.randomUUID if available, otherwise fallback
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: timestamp + random hex
  return (
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).substring(2, 10) +
    "-" +
    Math.random().toString(36).substring(2, 10)
  );
}

// ============================================
// RESPONSE PARSING — ROBUST JSON EXTRACTION
// ============================================

/**
 * Extract JSON from a potentially messy Groq response.
 * Handles: clean JSON, markdown fences, trailing text, partial JSON.
 */
function extractJson(raw: string): Record<string, unknown> | null {
  // Attempt 1: direct parse
  try {
    return JSON.parse(raw);
  } catch {
    // continue
  }

  // Attempt 2: extract from markdown code fences
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      // continue
    }
  }

  // Attempt 3: extract from first { to last }
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(raw.substring(firstBrace, lastBrace + 1));
    } catch {
      // continue
    }
  }

  return null;
}

/**
 * Validate and clamp a tone value
 */
function validateTone(tone: unknown): AgentTone {
  const valid: AgentTone[] = ["aggressive", "measured", "conciliatory"];
  if (typeof tone === "string" && valid.includes(tone as AgentTone)) {
    return tone as AgentTone;
  }
  return "measured";
}

/**
 * Validate and clamp a confidence value
 */
function clampConfidence(value: unknown): number {
  const num = Number(value);
  if (isNaN(num)) return 0.5;
  return Math.min(1, Math.max(0, num));
}

/**
 * Validate a verdict string
 */
function validateVerdict(verdict: unknown): DeliberationVerdict {
  const valid: DeliberationVerdict[] = [
    "fair",
    "unfair",
    "partially_fair",
    "illegal",
  ];
  if (typeof verdict === "string" && valid.includes(verdict as DeliberationVerdict)) {
    return verdict as DeliberationVerdict;
  }
  // Try common variations
  if (typeof verdict === "string") {
    const lower = verdict.toLowerCase().replace(/[\s-]/g, "_");
    if (lower === "partially_fair" || lower === "partial") return "partially_fair";
    if (lower === "illegal") return "illegal";
    if (lower === "unfair") return "unfair";
    if (lower === "fair") return "fair";
  }
  return "partially_fair";
}

/**
 * Ensure a value is a string array
 */
function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v) => typeof v === "string").map(String);
}

// ============================================
// AGENT RESPONSE PARSERS
// ============================================

/**
 * Parse a Predator or Guardian response into an AgentArgument
 */
function parseAgentResponse(
  rawResponse: string,
  role: AgentRole,
  fallbackMessage: string
): AgentArgument {
  const parsed = extractJson(rawResponse);

  if (parsed) {
    const argument =
      typeof parsed.argument === "string" && parsed.argument.length >= 50
        ? parsed.argument
        : fallbackMessage;

    const keyPoints = toStringArray(parsed.keyPoints);

    return {
      role,
      agentName: getAgentName(role),
      argument,
      keyPoints: keyPoints.length > 0 ? keyPoints : ["Analysis could not be fully structured"],
      citations: toStringArray(parsed.citations),
      confidence: clampConfidence(parsed.confidence),
      tone: validateTone(parsed.tone),
      respondingTo:
        role === "guardian"
          ? "predator"
          : role === "arbiter"
            ? "guardian"
            : undefined,
      timestamp: new Date().toISOString(),
      wasRecovered: argument === fallbackMessage,
    };
  }

  // Complete parse failure — return recovered fallback
  return {
    role,
    agentName: getAgentName(role),
    argument: fallbackMessage,
    keyPoints: ["Analysis could not be fully structured"],
    citations: [],
    confidence: 0.5,
    tone: "measured",
    respondingTo:
      role === "guardian"
        ? "predator"
        : role === "arbiter"
          ? "guardian"
          : undefined,
    timestamp: new Date().toISOString(),
    wasRecovered: true,
  };
}

/**
 * Parse an Arbiter response into AgentArgument + ArbiterVerdict
 */
function parseArbiterResponse(
  rawResponse: string,
  fallbackVerdict: DeliberationVerdict
): { argument: AgentArgument; verdict: ArbiterVerdict } {
  const parsed = extractJson(rawResponse);

  const argument = parseAgentResponse(
    rawResponse,
    "arbiter",
    "The Judicial Arbiter was unable to complete their analysis. Based on the arguments presented, this clause requires careful legal review before signing."
  );

  if (parsed) {
    const verdict: ArbiterVerdict = {
      verdict: validateVerdict(parsed.verdict ?? fallbackVerdict),
      confidence: clampConfidence(parsed.confidence),
      reasoning:
        typeof parsed.reasoning === "string" && parsed.reasoning.length > 10
          ? parsed.reasoning
          : argument.argument.substring(0, 200),
      keyFactors: toStringArray(parsed.keyFactors).length > 0
        ? toStringArray(parsed.keyFactors)
        : ["Insufficient data for detailed factor analysis"],
      predatorValidPoints: toStringArray(parsed.predatorValidPoints),
      guardianValidPoints: toStringArray(parsed.guardianValidPoints),
      predatorWeaknesses: toStringArray(parsed.predatorWeaknesses),
      guardianWeaknesses: toStringArray(parsed.guardianWeaknesses),
      suggestedModification:
        typeof parsed.suggestedModification === "string" &&
        parsed.suggestedModification.length > 10
          ? parsed.suggestedModification
          : "No specific modification suggested. The clause should be reviewed by a qualified legal professional.",
      legalReferences: toStringArray(parsed.legalReferences),
    };

    return { argument, verdict };
  }

  // Complete parse failure — use fallback verdict
  return {
    argument,
    verdict: createFallbackVerdict(fallbackVerdict),
  };
}

// ============================================
// FALLBACK CONSTRUCTORS
// ============================================

function createFallbackArgument(
  role: AgentRole,
  message: string
): AgentArgument {
  return {
    role,
    agentName: getAgentName(role),
    argument: message,
    keyPoints: ["Unable to complete full analysis"],
    citations: [],
    confidence: 0.5,
    tone: "measured",
    respondingTo:
      role === "guardian"
        ? "predator"
        : role === "arbiter"
          ? "guardian"
          : undefined,
    timestamp: new Date().toISOString(),
    wasRecovered: true,
  };
}

function createFallbackVerdict(
  riskLevelOrVerdict?: string
): ArbiterVerdict {
  let verdict: DeliberationVerdict = "partially_fair";
  if (riskLevelOrVerdict === "illegal") verdict = "illegal";
  else if (riskLevelOrVerdict === "dangerous" || riskLevelOrVerdict === "unfair") verdict = "unfair";
  else if (riskLevelOrVerdict === "warning" || riskLevelOrVerdict === "partially_fair") verdict = "partially_fair";
  else if (riskLevelOrVerdict === "safe" || riskLevelOrVerdict === "fair") verdict = "fair";

  return {
    verdict,
    confidence: 0.5,
    reasoning:
      "The Judicial Arbiter was unable to complete the full deliberation. Manual legal review of this clause is strongly recommended.",
    keyFactors: ["Automated deliberation incomplete"],
    predatorValidPoints: [],
    guardianValidPoints: [],
    predatorWeaknesses: [],
    guardianWeaknesses: [],
    suggestedModification:
      "This clause should be reviewed by a qualified legal professional in the relevant jurisdiction.",
    legalReferences: [],
  };
}

// ============================================
// CORE: DELIBERATE A SINGLE CLAUSE
// ============================================

export async function deliberateClause(
  clauseText: string,
  clauseType: string | undefined,
  documentType: string,
  jurisdiction: string,
  options?: {
    clauseId?: string;
    clauseIndex?: number;
    proofTreeSummary?: string;
    existingAnalysis?: { riskLevel: string; explanation: string };
  }
): Promise<ClauseDeliberation> {
  const startTime = Date.now();

  // Build context string
  const contextParts: string[] = [];
  if (clauseType) contextParts.push(`Clause type: ${clauseType}`);
  if (options?.existingAnalysis) {
    contextParts.push(
      `Initial AI assessment: ${options.existingAnalysis.riskLevel}`
    );
    contextParts.push(
      `Initial explanation: ${options.existingAnalysis.explanation.substring(0, 200)}`
    );
  }
  const contextString =
    contextParts.length > 0
      ? `\n\nAdditional context:\n${contextParts.join("\n")}`
      : "";

  // ── STEP 1: PREDATOR ──
  console.log("[ClauseWall] [Deliberation] Predator arguing...");
  let predatorArgument: AgentArgument;
  try {
    await rateLimiter.waitForSlot();

    const predatorSystemPrompt = getPredatorPrompt(documentType, jurisdiction);
    const predatorUserMessage = `Analyze and DEFEND this ${documentType} clause from ${jurisdiction}:\n\nCLAUSE TEXT:\n"${clauseText}"${contextString}\n\nRespond with JSON only.`;

    const predatorResponse = await callGroq(
      [
        { role: "system", content: predatorSystemPrompt },
        { role: "user", content: predatorUserMessage },
      ],
      { temperature: 0.3, maxTokens: 2048 }
    );

    predatorArgument = parseAgentResponse(
      predatorResponse,
      "predator",
      "The Defense Counsel could not formulate a substantive defense for this clause, which itself speaks to the clause's indefensibility."
    );
  } catch (error) {
    console.error("[ClauseWall] [Deliberation] Predator failed:", error);
    predatorArgument = createFallbackArgument(
      "predator",
      "The Defense Counsel was unable to respond. This inability to mount a defense may reflect poorly on the clause's defensibility."
    );
  }

  // ── STEP 2: GUARDIAN ──
  console.log("[ClauseWall] [Deliberation] Guardian arguing...");
  let guardianArgument: AgentArgument;
  try {
    await rateLimiter.waitForSlot();

    const guardianSystemPrompt = getGuardianPrompt(
      documentType,
      jurisdiction,
      predatorArgument.argument
    );
    const guardianUserMessage = `Analyze and ATTACK this ${documentType} clause from ${jurisdiction}. Counter the Defense Counsel's argument.\n\nCLAUSE TEXT:\n"${clauseText}"\n\nDEFENSE COUNSEL ARGUED:\n"${predatorArgument.argument}"${contextString}\n\nRespond with JSON only.`;

    const guardianResponse = await callGroq(
      [
        { role: "system", content: guardianSystemPrompt },
        { role: "user", content: guardianUserMessage },
      ],
      { temperature: 0.3, maxTokens: 2048 }
    );

    guardianArgument = parseAgentResponse(
      guardianResponse,
      "guardian",
      "The Consumer Advocate identifies significant concerns with this clause that warrant careful review before signing."
    );
    guardianArgument.respondingTo = "predator";
  } catch (error) {
    console.error("[ClauseWall] [Deliberation] Guardian failed:", error);
    guardianArgument = createFallbackArgument(
      "guardian",
      "The Consumer Advocate was unable to complete their analysis, but the clause warrants careful review before signing."
    );
    guardianArgument.respondingTo = "predator";
  }

  // ── STEP 3: ARBITER ──
  console.log("[ClauseWall] [Deliberation] Arbiter deliberating...");
  let arbiterArgument: AgentArgument;
  let arbiterVerdict: ArbiterVerdict;
  try {
    await rateLimiter.waitForSlot();

    const arbiterSystemPrompt = getArbiterPrompt(
      documentType,
      jurisdiction,
      predatorArgument.argument,
      guardianArgument.argument,
      options?.proofTreeSummary
    );
    const arbiterUserMessage = `Issue your verdict on this ${documentType} clause from ${jurisdiction}.\n\nCLAUSE TEXT:\n"${clauseText}"\n\nDEFENSE COUNSEL:\n"${predatorArgument.argument}"\n\nCONSUMER ADVOCATE:\n"${guardianArgument.argument}"\n\nRespond with JSON only.`;

    const arbiterResponse = await callGroq(
      [
        { role: "system", content: arbiterSystemPrompt },
        { role: "user", content: arbiterUserMessage },
      ],
      { temperature: 0.2, maxTokens: 3072 }
    );

    // Derive fallback verdict from existing analysis
    const fallbackVerdict: DeliberationVerdict =
      options?.existingAnalysis?.riskLevel === "illegal"
        ? "illegal"
        : options?.existingAnalysis?.riskLevel === "dangerous"
          ? "unfair"
          : options?.existingAnalysis?.riskLevel === "warning"
            ? "partially_fair"
            : "fair";

    const parsed = parseArbiterResponse(arbiterResponse, fallbackVerdict);
    arbiterArgument = parsed.argument;
    arbiterVerdict = parsed.verdict;
  } catch (error) {
    console.error("[ClauseWall] [Deliberation] Arbiter failed:", error);
    arbiterArgument = createFallbackArgument(
      "arbiter",
      "The Judicial Arbiter was unable to complete deliberation. Based on the arguments presented, this clause requires careful legal review."
    );
    arbiterVerdict = createFallbackVerdict(
      options?.existingAnalysis?.riskLevel
    );
  }

  // ── CONSTRUCT RESULT ──
  const deliberation: ClauseDeliberation = {
    id: generateId(),
    clauseId: options?.clauseId,
    clauseIndex: options?.clauseIndex,
    clauseText,
    clauseType,
    documentType,
    jurisdiction,
    predatorArgument,
    guardianArgument,
    arbiterArgument,
    arbiterVerdict,
    deliberationDuration: Date.now() - startTime,
    createdAt: new Date().toISOString(),
  };

  console.log(
    `[ClauseWall] [Deliberation] Clause complete: ${arbiterVerdict.verdict} (${deliberation.deliberationDuration}ms)`
  );

  return deliberation;
}

// ============================================
// CORE: DELIBERATE AN ENTIRE DOCUMENT
// ============================================

export async function deliberateDocument(
  clauses: Array<{
    text: string;
    type?: string;
    index: number;
    id?: string;
    riskLevel?: string;
    explanation?: string;
    proofTreeSummary?: string;
  }>,
  documentType: string,
  jurisdiction: string,
  documentId: string,
  onProgress?: (progress: DeliberationProgress) => void
): Promise<DeliberationResult> {
  const startTime = Date.now();
  const deliberations: ClauseDeliberation[] = [];

  console.log(
    `[ClauseWall] [Deliberation] Starting document deliberation: ${clauses.length} clauses`
  );

  for (let i = 0; i < clauses.length; i++) {
    const clause = clauses[i];

    // Report progress
    if (onProgress) {
      onProgress({
        totalClauses: clauses.length,
        currentClause: i + 1,
        currentAgent: "predator",
        status: "predator_arguing",
        message: `Deliberating clause ${i + 1} of ${clauses.length}...`,
        estimatedTimeRemaining: (clauses.length - i) * 5,
      });
    }

    // Deliberate this clause
    const deliberation = await deliberateClause(
      clause.text,
      clause.type,
      documentType,
      jurisdiction,
      {
        clauseId: clause.id,
        clauseIndex: clause.index,
        proofTreeSummary: clause.proofTreeSummary,
        existingAnalysis: clause.riskLevel
          ? {
              riskLevel: clause.riskLevel,
              explanation: clause.explanation || "",
            }
          : undefined,
      }
    );

    deliberations.push(deliberation);

    // Delay between clauses for rate limit safety
    if (i < clauses.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  // Calculate summary
  const summary = calculateSummary(deliberations);

  // Report completion
  if (onProgress) {
    onProgress({
      totalClauses: clauses.length,
      currentClause: clauses.length,
      currentAgent: null,
      status: "complete",
      message: "Deliberation complete",
    });
  }

  const totalDuration = Date.now() - startTime;

  console.log(
    `[ClauseWall] [Deliberation] Document complete: ${clauses.length} clauses in ${totalDuration}ms`
  );

  return {
    documentId,
    deliberations,
    summary,
    completedAt: new Date().toISOString(),
    totalDuration,
  };
}

// ============================================
// SUMMARY CALCULATION
// ============================================

function calculateSummary(
  deliberations: ClauseDeliberation[]
): DeliberationSummary {
  // Count verdicts
  let fairCount = 0;
  let unfairCount = 0;
  let partiallyFairCount = 0;
  let illegalCount = 0;
  let totalConfidence = 0;

  for (const d of deliberations) {
    switch (d.arbiterVerdict.verdict) {
      case "fair":
        fairCount++;
        break;
      case "unfair":
        unfairCount++;
        break;
      case "partially_fair":
        partiallyFairCount++;
        break;
      case "illegal":
        illegalCount++;
        break;
    }
    totalConfidence += d.arbiterVerdict.confidence;
  }

  // Find most contested clause (largest confidence gap between predator and guardian)
  let mostContestedIndex = 0;
  let largestGap = 0;
  for (let i = 0; i < deliberations.length; i++) {
    const d = deliberations[i];
    const gap = Math.abs(
      d.predatorArgument.confidence - d.guardianArgument.confidence
    );
    if (gap > largestGap) {
      largestGap = gap;
      mostContestedIndex = i;
    }
  }

  // Find strongest predator point (from highest-confidence predator)
  const sortedByPredatorConf = [...deliberations].sort(
    (a, b) => b.predatorArgument.confidence - a.predatorArgument.confidence
  );
  const strongestPredatorPoint =
    sortedByPredatorConf[0]?.predatorArgument.keyPoints[0] || "No strong defense points identified";

  // Find strongest guardian point (from highest-confidence guardian)
  const sortedByGuardianConf = [...deliberations].sort(
    (a, b) => b.guardianArgument.confidence - a.guardianArgument.confidence
  );
  const strongestGuardianPoint =
    sortedByGuardianConf[0]?.guardianArgument.keyPoints[0] || "No strong advocacy points identified";

  return {
    totalClauses: deliberations.length,
    fairCount,
    unfairCount,
    partiallyFairCount,
    illegalCount,
    averageConfidence:
      deliberations.length > 0
        ? Math.round((totalConfidence / deliberations.length) * 100) / 100
        : 0,
    mostContestedClause:
      deliberations[mostContestedIndex]?.clauseText.substring(0, 100) ||
      "N/A",
    mostContestedIndex,
    strongestPredatorPoint,
    strongestGuardianPoint,
  };
}
