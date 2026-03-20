// ============================================
// NEUROSYMBOLIC INFERENCE ENGINE
// Prolog-style backward/forward chaining in TypeScript
// Purpose-built for Indian contract law reasoning
// ============================================

import type {
  Fact,
  LogicalRule,
  Condition,
  ProofNode,
  ProofTree,
  ProofVerdict,
  ProofStatus,
  InferenceResult,
  ConditionEvaluation,
  RuleEvaluation,
  RuleFiring,
} from "./types";

// ---- UUID generator (no external dependency) ----

function generateId(): string {
  return "pn_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

function createProofNode(
  type: ProofNode["type"],
  label: string,
  description: string,
  status: ProofStatus,
  depth: number,
  metadata: ProofNode["metadata"] = {},
  children: ProofNode[] = []
): ProofNode {
  return {
    id: generateId(),
    type,
    label,
    description,
    status,
    children,
    depth,
    metadata,
    timestamp: new Date().toISOString(),
  };
}

// ============================================
// KNOWLEDGE BASE — stores facts + rules
// ============================================

export class KnowledgeBase {
  private facts: Map<string, Fact> = new Map();
  private rules: LogicalRule[] = [];
  private sessionId: string;

  constructor() {
    this.sessionId = "session_" + Date.now().toString(36);
  }

  // ---- Fact management ----

  assertFact(fact: Fact): void {
    const existing = this.facts.get(fact.predicate);
    // Replace only if new fact has higher confidence
    if (!existing || fact.source.confidence >= existing.source.confidence) {
      this.facts.set(fact.predicate, fact);
    }
  }

  retractFact(predicate: string): void {
    this.facts.delete(predicate);
  }

  getFact(predicate: string): Fact | undefined {
    return this.facts.get(predicate);
  }

  getAllFacts(): Fact[] {
    return Array.from(this.facts.values());
  }

  // ---- Rule management ----

  loadRules(rules: LogicalRule[]): void {
    // Sort by priority descending (higher priority first)
    this.rules = [...rules].sort((a, b) => b.priority - a.priority);
  }

  getRules(): LogicalRule[] {
    return this.rules;
  }

  // ---- Condition evaluation ----

  evaluateCondition(condition: Condition): ConditionEvaluation {
    const fact = this.facts.get(condition.predicate);
    const now = new Date().toISOString();

    switch (condition.type) {
      case "comparison": {
        if (!fact) {
          return {
            result: false,
            detail: `Missing fact: ${condition.predicate}`,
            confidence: 0,
            proofNode: createProofNode(
              "condition_check",
              `Missing: ${condition.predicate}`,
              `Required fact '${condition.predicate}' is not available`,
              "failed",
              0,
              { missingFact: condition.predicate }
            ),
          };
        }

        const leftValue = fact.value;
        const rightValue = condition.reference
          ? this.facts.get(condition.reference)?.value ?? condition.value
          : condition.value;

        if (rightValue === undefined || rightValue === null) {
          return {
            result: false,
            detail: `No comparison value for ${condition.predicate}`,
            confidence: 0,
            proofNode: createProofNode(
              "condition_check",
              `No target value for ${condition.predicate}`,
              `Cannot compare — no target value specified`,
              "failed",
              0
            ),
          };
        }

        // For comparison, rightValue must be a scalar
        const scalarRight = Array.isArray(rightValue) ? rightValue[0] : rightValue;
        const compResult = this.compare(leftValue, condition.operator ?? "==", scalarRight);
        const negate = condition.negate ?? false;
        const finalResult = negate ? !compResult : compResult;

        return {
          result: finalResult,
          detail: `${condition.predicate}: ${leftValue} ${condition.operator ?? "=="} ${rightValue} → ${finalResult}`,
          confidence: fact.source.confidence,
          proofNode: createProofNode(
            "comparison",
            `${condition.predicate}: ${leftValue} ${condition.operator ?? "=="} ${rightValue}`,
            `Compared extracted value ${leftValue} against threshold ${rightValue} using operator '${condition.operator ?? "=="}'`,
            finalResult ? "proven" : "failed",
            0,
            {
              leftOperand: leftValue,
              operator: condition.operator ?? "==",
              rightOperand: rightValue as string | number | boolean,
              comparisonResult: finalResult,
              extractedValue: leftValue,
              confidence: fact.source.confidence,
              originalText: fact.source.clauseText,
            }
          ),
        };
      }

      case "existence": {
        const exists = fact !== undefined && fact.value !== null && fact.value !== undefined;
        const negate = condition.negate ?? false;
        const finalResult = negate ? !exists : exists;

        return {
          result: finalResult,
          detail: `${condition.predicate} ${exists ? "exists" : "missing"}${negate ? " (negated)" : ""}`,
          confidence: exists ? (fact?.source.confidence ?? 0.5) : 0.5,
          proofNode: createProofNode(
            "condition_check",
            `${negate ? "NOT " : ""}${condition.predicate} exists`,
            `Checked ${negate ? "absence" : "presence"} of fact '${condition.predicate}'`,
            finalResult ? "proven" : "failed",
            0,
            {
              extractedValue: fact?.value,
              confidence: exists ? (fact?.source.confidence ?? 0.5) : 0.5,
            }
          ),
        };
      }

      case "membership": {
        if (!fact) {
          return {
            result: false,
            detail: `Missing fact: ${condition.predicate}`,
            confidence: 0,
            proofNode: createProofNode(
              "condition_check",
              `Missing: ${condition.predicate}`,
              `Required fact '${condition.predicate}' is not available`,
              "failed",
              0,
              { missingFact: condition.predicate }
            ),
          };
        }

        const memberSet = Array.isArray(condition.value) ? condition.value : [condition.value];
        const isMember = memberSet.some(
          (v) => String(v).toLowerCase() === String(fact.value).toLowerCase()
        );
        const negate = condition.negate ?? false;
        const finalResult = negate ? !isMember : isMember;

        return {
          result: finalResult,
          detail: `${fact.value} ${isMember ? "in" : "not in"} [${memberSet.join(", ")}]`,
          confidence: fact.source.confidence,
          proofNode: createProofNode(
            "condition_check",
            `${condition.predicate} ∈ {${memberSet.join(", ")}}`,
            `Checked if '${fact.value}' is ${negate ? "not " : ""}a member of the allowed set`,
            finalResult ? "proven" : "failed",
            0,
            {
              extractedValue: fact.value,
              confidence: fact.source.confidence,
            }
          ),
        };
      }

      case "range": {
        if (!fact) {
          return {
            result: false,
            detail: `Missing fact: ${condition.predicate}`,
            confidence: 0,
            proofNode: createProofNode(
              "condition_check",
              `Missing: ${condition.predicate}`,
              `Required fact '${condition.predicate}' is not available`,
              "failed",
              0,
              { missingFact: condition.predicate }
            ),
          };
        }

        const rangeValues = Array.isArray(condition.value) ? condition.value : [0, condition.value];
        const numValue = Number(fact.value);
        const low = Number(rangeValues[0]);
        const high = Number(rangeValues[1]);
        const inRange = numValue >= low && numValue <= high;
        const negate = condition.negate ?? false;
        const finalResult = negate ? !inRange : inRange;

        return {
          result: finalResult,
          detail: `${fact.value} ${inRange ? "in" : "outside"} range [${low}, ${high}]`,
          confidence: fact.source.confidence,
          proofNode: createProofNode(
            "comparison",
            `${condition.predicate}: ${fact.value} in [${low}–${high}]`,
            `Checked if ${fact.value} falls within range ${low} to ${high}`,
            finalResult ? "proven" : "failed",
            0,
            {
              leftOperand: numValue,
              rightOperand: `${low}–${high}`,
              comparisonResult: finalResult,
              confidence: fact.source.confidence,
            }
          ),
        };
      }

      case "pattern": {
        if (!fact) {
          return {
            result: false,
            detail: `Missing fact: ${condition.predicate}`,
            confidence: 0,
            proofNode: createProofNode(
              "condition_check",
              `Missing: ${condition.predicate}`,
              `Required fact '${condition.predicate}' is not available`,
              "failed",
              0,
              { missingFact: condition.predicate }
            ),
          };
        }

        const pattern = new RegExp(String(condition.value ?? ""), "i");
        const matches = pattern.test(String(fact.value));
        const negate = condition.negate ?? false;
        const finalResult = negate ? !matches : matches;

        return {
          result: finalResult,
          detail: `${fact.value} ${matches ? "matches" : "doesn't match"} pattern ${condition.value}`,
          confidence: fact.source.confidence,
          proofNode: createProofNode(
            "condition_check",
            `${condition.predicate} matches pattern`,
            `Checked if '${fact.value}' matches pattern '${condition.value}'`,
            finalResult ? "proven" : "failed",
            0,
            {
              extractedValue: fact.value,
              confidence: fact.source.confidence,
            }
          ),
        };
      }

      default:
        return {
          result: false,
          detail: `Unknown condition type: ${condition.type}`,
          confidence: 0,
          proofNode: createProofNode(
            "condition_check",
            "Unknown condition",
            `Unrecognized condition type: ${condition.type}`,
            "failed",
            0
          ),
        };
    }
  }

  // ---- Rule evaluation ----

  evaluateRule(rule: LogicalRule): RuleEvaluation {
    const proofNodes: ProofNode[] = [];
    const failedConditions: string[] = [];
    const missingFacts: string[] = [];
    let minConfidence = 1.0;
    let allPass = true;

    for (const condition of rule.conditions) {
      const evaluation = this.evaluateCondition(condition);
      proofNodes.push(evaluation.proofNode);

      if (!evaluation.result) {
        allPass = false;
        if (evaluation.confidence === 0) {
          missingFacts.push(condition.predicate);
        } else {
          failedConditions.push(evaluation.detail);
        }
      }

      if (evaluation.confidence > 0 && evaluation.confidence < minConfidence) {
        minConfidence = evaluation.confidence;
      }
    }

    return {
      fires: allPass,
      proofNodes,
      confidence: allPass ? minConfidence : 0,
      failedConditions,
      missingFacts,
    };
  }

  // ---- Forward chaining ----

  forwardChain(): InferenceResult {
    const violations: RuleFiring[] = [];
    const warnings: RuleFiring[] = [];
    const compliance: RuleFiring[] = [];
    const unmatchedRules: string[] = [];
    let bestProofTree: ProofTree | null = null;
    let bestPriority = -1;

    for (const rule of this.rules) {
      const evaluation = this.evaluateRule(rule);

      if (evaluation.fires) {
        // Build proof tree for this fired rule
        const proofTree = this.buildProofTree(
          "", // clause text filled by caller
          rule,
          evaluation.proofNodes,
          evaluation.confidence
        );

        const firing: RuleFiring = {
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
        };

        if (rule.conclusion.type === "violation") {
          violations.push(firing);
        } else if (rule.conclusion.type === "warning") {
          warnings.push(firing);
        } else {
          compliance.push(firing);
        }

        // Track highest-priority proof tree
        if (rule.priority > bestPriority && rule.conclusion.type === "violation") {
          bestPriority = rule.priority;
          bestProofTree = proofTree;
        } else if (bestProofTree === null) {
          bestProofTree = proofTree;
        }
      } else if (evaluation.missingFacts.length > 0) {
        unmatchedRules.push(rule.id);
      }
    }

    return {
      proofTree: bestProofTree,
      violations,
      warnings,
      compliance,
      unmatchedRules,
      totalRulesChecked: this.rules.length,
      totalRulesFired: violations.length + warnings.length + compliance.length,
    };
  }

  // ---- Proof tree construction ----

  buildProofTree(
    clauseText: string,
    rule: LogicalRule,
    conditionNodes: ProofNode[],
    confidence: number
  ): ProofTree {
    const now = new Date().toISOString();
    const allFacts = this.getAllFacts();

    // Build fact extraction nodes (depth 3)
    const factNodes: ProofNode[] = allFacts
      .filter((f) => rule.conditions.some((c) => c.predicate === f.predicate))
      .map((fact) =>
        createProofNode(
          "extraction",
          `${fact.predicate} = ${fact.value}`,
          `Extracted from ${fact.source.type}: ${fact.source.clauseText ? `"${fact.source.clauseText.substring(0, 100)}..."` : "user input"}`,
          fact.source.confidence >= 0.7 ? "proven" : "uncertain",
          3,
          {
            extractedValue: fact.value,
            originalText: fact.source.clauseText,
            confidence: fact.source.confidence,
          }
        )
      );

    // Build rule node (depth 2)
    const ruleNode = createProofNode(
      "rule",
      `Rule ${rule.id}: ${rule.name}`,
      `${rule.statute.code} — ${rule.description}`,
      "proven",
      2,
      {
        ruleId: rule.id,
        ruleName: rule.name,
        statute: rule.statute.code,
        statuteText: rule.statute.text,
      },
      // Condition nodes are children of the rule node
      conditionNodes.map((n) => ({ ...n, depth: 3 }))
    );

    // Build inference node (depth 1)
    const inferenceNode = createProofNode(
      "inference",
      `Applied ${rule.name}`,
      `All ${rule.conditions.length} conditions satisfied. Rule fires with ${rule.conclusion.type}: ${rule.conclusion.riskLevel}`,
      "proven",
      1,
      {},
      [ruleNode, ...factNodes]
    );

    // Fill message template with actual values
    let filledMessage = rule.conclusion.message;
    for (const fact of allFacts) {
      filledMessage = filledMessage.replace(
        new RegExp(`\\{${fact.predicate}\\}`, "g"),
        String(fact.value)
      );
    }
    // Fill max_value / limit placeholders from rule conditions
    for (const cond of rule.conditions) {
      if (cond.value !== undefined && !Array.isArray(cond.value)) {
        filledMessage = filledMessage.replace(
          new RegExp(`\\{max_value\\}|\\{limit_value\\}|\\{${cond.predicate}_limit\\}`, "g"),
          String(cond.value)
        );
      }
    }

    // Build conclusion node (depth 0 = root)
    const conclusionNode = createProofNode(
      "conclusion",
      `${rule.conclusion.riskLevel.toUpperCase()}: ${filledMessage}`,
      rule.conclusion.detailedExplanation || filledMessage,
      "proven",
      0,
      {
        riskLevel: rule.conclusion.riskLevel,
        violation: filledMessage,
        remedy: rule.remedy,
        penalty: rule.penalty,
        statute: rule.statute.code,
      },
      [inferenceNode]
    );

    // Count nodes
    const countNodes = (node: ProofNode): number => {
      return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
    };

    const totalSteps = countNodes(conclusionNode);
    const verifiedSteps = totalSteps; // All from DB rules = verified
    const aiAssistedSteps = allFacts.filter(
      (f) => f.source.extractionMethod === "groq_llama3"
    ).length;

    // Generate derivation chain
    const derivationChain = this.generateDerivationChain(
      rule,
      allFacts,
      conditionNodes,
      filledMessage
    );

    // Determine verdict
    const verdictMap: Record<string, ProofVerdict> = {
      illegal: "proven_illegal",
      dangerous: "proven_dangerous",
      warning: "proven_warning",
      safe: "proven_safe",
    };
    const verdict: ProofVerdict =
      verdictMap[rule.conclusion.riskLevel] ?? "proven_warning";

    return {
      id: generateId(),
      clauseText,
      query: `Is this clause legal under ${rule.jurisdiction} law?`,
      conclusion: conclusionNode,
      verdict,
      totalSteps,
      verifiedSteps,
      aiAssistedSteps,
      confidence,
      derivationChain,
      rulesApplied: [rule.id],
      factsUsed: allFacts.filter((f) =>
        rule.conditions.some((c) => c.predicate === f.predicate)
      ),
      createdAt: now,
    };
  }

  // ---- Derivation chain text generation ----

  private generateDerivationChain(
    rule: LogicalRule,
    facts: Fact[],
    conditionNodes: ProofNode[],
    filledMessage: string
  ): string[] {
    const chain: string[] = [];
    let stepNum = 1;

    // Extraction steps
    for (const fact of facts) {
      if (rule.conditions.some((c) => c.predicate === fact.predicate)) {
        const confPct = Math.round(fact.source.confidence * 100);
        const sourceLabel =
          fact.source.type === "user_input"
            ? "user provided"
            : fact.source.type === "extraction"
              ? "extracted from clause"
              : "derived";

        chain.push(
          `Step ${stepNum} — ${fact.source.type === "extraction" ? "EXTRACTION" : "FACT"}: ` +
            `${fact.predicate} = ${fact.value} (${sourceLabel}, confidence: ${confPct}%)`
        );
        stepNum++;
      }
    }

    // Rule match step
    chain.push(
      `Step ${stepNum} — RULE MATCH: Rule ${rule.id} applies (${rule.statute.code})`
    );
    stepNum++;

    // Comparison steps
    for (const node of conditionNodes) {
      if (node.type === "comparison" && node.metadata.leftOperand !== undefined) {
        chain.push(
          `Step ${stepNum} — COMPARISON: ${node.metadata.leftOperand} ${node.metadata.operator ?? "=="} ${node.metadata.rightOperand} → ${node.metadata.comparisonResult ? "TRUE" : "FALSE"}`
        );
        stepNum++;
      }
    }

    // Conclusion step
    chain.push(
      `Step ${stepNum} — CONCLUSION: ${rule.conclusion.riskLevel.toUpperCase()} — ${filledMessage}`
    );

    return chain;
  }

  // ---- Comparison helper ----

  private compare(
    left: string | number | boolean,
    operator: string,
    right: string | number | boolean
  ): boolean {
    // Coerce to numbers if both can be numeric
    const numLeft = Number(left);
    const numRight = Number(right);
    const bothNumeric = !isNaN(numLeft) && !isNaN(numRight);

    switch (operator) {
      case ">":
        return bothNumeric ? numLeft > numRight : String(left) > String(right);
      case "<":
        return bothNumeric ? numLeft < numRight : String(left) < String(right);
      case ">=":
        return bothNumeric ? numLeft >= numRight : String(left) >= String(right);
      case "<=":
        return bothNumeric ? numLeft <= numRight : String(left) <= String(right);
      case "==":
        return bothNumeric
          ? numLeft === numRight
          : String(left).toLowerCase() === String(right).toLowerCase();
      case "!=":
        return bothNumeric
          ? numLeft !== numRight
          : String(left).toLowerCase() !== String(right).toLowerCase();
      case "contains":
        return String(left).toLowerCase().includes(String(right).toLowerCase());
      case "matches":
        try {
          return new RegExp(String(right), "i").test(String(left));
        } catch {
          return false;
        }
      default:
        return String(left) === String(right);
    }
  }
}
