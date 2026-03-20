// ============================================
// PROOF FORMATTER
// Formats proof trees for human-readable display
// ============================================

import type { ProofTree, ProofNode, ProofSummaryData } from "./types";

// ---- Derivation chain (standard) ----

export function formatDerivationChain(proofTree: ProofTree): string[] {
  if (!proofTree.derivationChain || proofTree.derivationChain.length === 0) {
    return generateChainFromTree(proofTree);
  }
  return proofTree.derivationChain;
}

function generateChainFromTree(proofTree: ProofTree): string[] {
  const chain: string[] = [];
  let stepNum = 1;

  const walk = (node: ProofNode): void => {
    // Process children first (bottom-up for derivation)
    for (const child of node.children) {
      walk(child);
    }

    switch (node.type) {
      case "extraction":
        chain.push(
          `Step ${stepNum} — EXTRACTION: ${node.label} (confidence: ${Math.round((node.metadata.confidence ?? 0) * 100)}%)`
        );
        stepNum++;
        break;
      case "fact":
        chain.push(
          `Step ${stepNum} — FACT: ${node.label}`
        );
        stepNum++;
        break;
      case "rule":
        chain.push(
          `Step ${stepNum} — RULE MATCH: ${node.label}${node.metadata.statute ? ` (${node.metadata.statute})` : ""}`
        );
        stepNum++;
        break;
      case "comparison":
        chain.push(
          `Step ${stepNum} — COMPARISON: ${node.metadata.leftOperand} ${node.metadata.operator ?? "=="} ${node.metadata.rightOperand} → ${node.metadata.comparisonResult ? "TRUE" : "FALSE"}`
        );
        stepNum++;
        break;
      case "condition_check":
        chain.push(
          `Step ${stepNum} — CHECK: ${node.label} → ${node.status === "proven" ? "PASS" : "FAIL"}`
        );
        stepNum++;
        break;
      case "inference":
        chain.push(
          `Step ${stepNum} — DERIVATION: ${node.description}`
        );
        stepNum++;
        break;
      case "conclusion":
        chain.push(
          `Step ${stepNum} — CONCLUSION: ${node.label}`
        );
        stepNum++;
        break;
    }
  };

  // Walk bottom-up: process extractions/facts first, conclusion last
  walkBottomUp(proofTree.conclusion, chain, { stepNum: 1 });
  return chain;
}

function walkBottomUp(
  node: ProofNode,
  chain: string[],
  counter: { stepNum: number }
): void {
  // Process leaf nodes first
  for (const child of node.children) {
    walkBottomUp(child, chain, counter);
  }

  const step = counter.stepNum;
  counter.stepNum++;

  switch (node.type) {
    case "extraction": {
      const conf = Math.round((node.metadata.confidence ?? 0) * 100);
      chain.push(
        `Step ${step} — EXTRACTION: ${node.label} (confidence: ${conf}%)`
      );
      break;
    }
    case "fact":
      chain.push(`Step ${step} — FACT: ${node.label}`);
      break;
    case "rule":
      chain.push(
        `Step ${step} — RULE MATCH: ${node.label}${node.metadata.statute ? ` (${node.metadata.statute})` : ""}`
      );
      break;
    case "comparison":
      chain.push(
        `Step ${step} — COMPARISON: ${node.metadata.leftOperand} ${node.metadata.operator ?? "=="} ${node.metadata.rightOperand} → ${node.metadata.comparisonResult ? "TRUE" : "FALSE"}`
      );
      break;
    case "condition_check":
      chain.push(
        `Step ${step} — CHECK: ${node.label} → ${node.status === "proven" ? "PASS" : "FAIL"}`
      );
      break;
    case "inference":
      chain.push(`Step ${step} — DERIVATION: ${node.description}`);
      break;
    case "conclusion":
      chain.push(`Step ${step} — CONCLUSION: ${node.label}`);
      break;
  }
}

// ---- ELI5 (Explain Like I'm 5) ----

export function formatELI5(proofTree: ProofTree): string[] {
  const steps: string[] = [];
  let stepNum = 1;

  const simplify = (node: ProofNode): void => {
    for (const child of node.children) {
      simplify(child);
    }

    switch (node.type) {
      case "extraction": {
        const val = node.metadata.extractedValue;
        const predicate = node.label.split("=")[0]?.trim() || "something";
        const friendlyPredicate = humanizePredicate(predicate);
        steps.push(
          `Step ${stepNum}: The contract says ${friendlyPredicate} is ${val}`
        );
        stepNum++;
        break;
      }
      case "fact": {
        steps.push(`Step ${stepNum}: ${simplifyLabel(node.label)}`);
        stepNum++;
        break;
      }
      case "rule": {
        const statute = node.metadata.statute || "the law";
        steps.push(
          `Step ${stepNum}: There's a law (${statute}) that sets rules for this`
        );
        stepNum++;
        break;
      }
      case "comparison": {
        const left = node.metadata.leftOperand;
        const right = node.metadata.rightOperand;
        const op = node.metadata.operator;
        const result = node.metadata.comparisonResult;

        if (op === ">" && result) {
          steps.push(
            `Step ${stepNum}: ${left} is more than ${right} — that's too much!`
          );
        } else if (op === "<" && result) {
          steps.push(
            `Step ${stepNum}: ${left} is less than ${right} — that's too little!`
          );
        } else if (op === "==" && result) {
          steps.push(
            `Step ${stepNum}: ${left} equals ${right} — that matches!`
          );
        } else {
          steps.push(
            `Step ${stepNum}: Comparing ${left} with ${right} — ${result ? "problem found" : "looks okay"}`
          );
        }
        stepNum++;
        break;
      }
      case "condition_check": {
        steps.push(
          `Step ${stepNum}: Checking: ${simplifyLabel(node.label)} → ${node.status === "proven" ? "Yes ✓" : "No ✗"}`
        );
        stepNum++;
        break;
      }
      case "inference": {
        steps.push(
          `Step ${stepNum}: Putting it all together — ${simplifyDescription(node.description)}`
        );
        stepNum++;
        break;
      }
      case "conclusion": {
        const risk = node.metadata.riskLevel || "unknown";
        const emoji = risk === "illegal" ? "🚫" : risk === "dangerous" ? "⚠️" : risk === "warning" ? "⚡" : "✅";
        const remedy = node.metadata.remedy;
        let msg = `Step ${stepNum}: ${emoji} This clause is ${risk.toUpperCase()}`;
        if (remedy) {
          msg += `. What you should ask for: ${remedy}`;
        }
        steps.push(msg);
        stepNum++;
        break;
      }
    }
  };

  simplify(proofTree.conclusion);
  return steps;
}

// ---- Professional (legal language) ----

export function formatProfessional(proofTree: ProofTree): string[] {
  const steps: string[] = [];
  let stepNum = 1;

  const formal = (node: ProofNode): void => {
    for (const child of node.children) {
      formal(child);
    }

    switch (node.type) {
      case "extraction": {
        const conf = Math.round((node.metadata.confidence ?? 0) * 100);
        steps.push(
          `${stepNum}. MATERIAL FACT — Extracted datum: ${node.label}. ` +
          `Source: AI text analysis of contractual provision. ` +
          `Confidence level: ${conf}%.` +
          (node.metadata.originalText
            ? ` Originating text: "${node.metadata.originalText.substring(0, 120)}..."`
            : "")
        );
        stepNum++;
        break;
      }
      case "rule": {
        steps.push(
          `${stepNum}. APPLICABLE LAW — ${node.metadata.ruleName || node.label}. ` +
          `Statutory reference: ${node.metadata.statute || "N/A"}. ` +
          (node.metadata.statuteText
            ? `Relevant provision: "${node.metadata.statuteText}"`
            : "")
        );
        stepNum++;
        break;
      }
      case "comparison": {
        steps.push(
          `${stepNum}. ANALYSIS — The extracted value (${node.metadata.leftOperand}) ` +
          `${describeOperator(String(node.metadata.operator || "=="))} ` +
          `the statutory threshold (${node.metadata.rightOperand}). ` +
          `Result: ${node.metadata.comparisonResult ? "Threshold breached" : "Within permissible limits"}.`
        );
        stepNum++;
        break;
      }
      case "conclusion": {
        const risk = (node.metadata.riskLevel || "").toUpperCase();
        steps.push(
          `${stepNum}. LEGAL OPINION — Based on the foregoing analysis, ` +
          `the subject clause is determined to be ${risk} ` +
          `under ${node.metadata.statute || "applicable law"}. ` +
          (node.metadata.violation || node.description) +
          (node.metadata.remedy
            ? ` RECOMMENDED REMEDY: ${node.metadata.remedy}.`
            : "") +
          (node.metadata.penalty
            ? ` POTENTIAL PENALTY: ${node.metadata.penalty}.`
            : "")
        );
        stepNum++;
        break;
      }
      default: {
        if (node.description) {
          steps.push(`${stepNum}. ${node.description}`);
          stepNum++;
        }
        break;
      }
    }
  };

  formal(proofTree.conclusion);
  return steps;
}

// ---- Confidence calculation ----

export function calculateOverallConfidence(proofTree: ProofTree): number {
  let minConfidence = 1.0;
  let hasUncertain = false;
  let hasAssumed = false;

  const walk = (node: ProofNode): void => {
    if (node.metadata.confidence !== undefined && node.metadata.confidence > 0) {
      minConfidence = Math.min(minConfidence, node.metadata.confidence);
    }
    if (node.status === "uncertain") hasUncertain = true;
    if (node.status === "assumed") hasAssumed = true;

    for (const child of node.children) {
      walk(child);
    }
  };

  walk(proofTree.conclusion);

  // Floor at 0.1 to avoid zero
  let confidence = Math.max(minConfidence, 0.1);

  // Cap based on proof quality
  if (hasAssumed) confidence = Math.min(confidence, 0.5);
  if (hasUncertain) confidence = Math.min(confidence, 0.7);

  return Math.round(confidence * 100) / 100;
}

// ---- Proof summary (for UI) ----

export function getProofSummary(proofTree: ProofTree): ProofSummaryData {
  const confidence = calculateOverallConfidence(proofTree);
  const verifiedPercent =
    proofTree.totalSteps > 0
      ? Math.round((proofTree.verifiedSteps / proofTree.totalSteps) * 100)
      : 0;

  // Find main statute
  let mainStatute: string | null = null;
  let mainViolation: string | null = null;

  const findStatute = (node: ProofNode): void => {
    if (node.metadata.statute && !mainStatute) {
      mainStatute = node.metadata.statute;
    }
    if (node.metadata.violation && !mainViolation) {
      mainViolation = node.metadata.violation;
    }
    for (const child of node.children) {
      findStatute(child);
    }
  };

  findStatute(proofTree.conclusion);

  // Map verdict to risk level
  const verdictRiskMap: Record<string, string> = {
    proven_illegal: "illegal",
    proven_dangerous: "dangerous",
    proven_warning: "warning",
    proven_safe: "safe",
    unprovable: "unknown",
    insufficient_data: "unknown",
  };

  return {
    verdict: proofTree.verdict,
    stepsCount: proofTree.totalSteps,
    verifiedPercent,
    confidence,
    mainStatute,
    mainViolation,
    riskLevel: verdictRiskMap[proofTree.verdict] || "unknown",
    isProvable: proofTree.verdict.startsWith("proven_"),
  };
}

// ---- Helpers ----

function humanizePredicate(predicate: string): string {
  const map: Record<string, string> = {
    deposit_months: "the security deposit (in months)",
    notice_period_days: "the notice period (in days)",
    notice_period_months: "the notice period (in months)",
    lock_in_months: "the lock-in period (in months)",
    lock_in_years: "the lock-in period (in years)",
    rent_escalation_percent: "the rent increase (percentage)",
    non_compete_months: "the non-compete period (in months)",
    non_compete_years: "the non-compete period (in years)",
    training_bond_months: "the training bond period (in months)",
    late_fee_percent: "the late fee (percentage)",
    interest_rate_percent: "the interest rate (percentage)",
    prepayment_penalty_percent: "the prepayment penalty (percentage)",
    is_one_sided: "whether it's one-sided",
    has_forfeiture: "whether there's a forfeiture clause",
    has_penalty: "whether there's a penalty clause",
  };

  return map[predicate] || predicate.replace(/_/g, " ");
}

function simplifyLabel(label: string): string {
  return label
    .replace(/clause_type_is_/g, "this is a ")
    .replace(/_/g, " ")
    .replace(/deposit months/g, "security deposit (months)")
    .replace(/notice period days/g, "notice period (days)");
}

function simplifyDescription(description: string): string {
  return description
    .replace(/All \d+ conditions satisfied\.\s*/g, "")
    .replace(/Rule fires with /g, "this is ")
    .replace(/violation:\s*/gi, "a violation — ")
    .replace(/compliance:\s*/gi, "okay — ");
}

function describeOperator(op: string): string {
  switch (op) {
    case ">": return "exceeds";
    case "<": return "is below";
    case ">=": return "meets or exceeds";
    case "<=": return "does not exceed";
    case "==": return "equals";
    case "!=": return "differs from";
    case "contains": return "contains";
    case "matches": return "matches the pattern of";
    default: return "relates to";
  }
}
