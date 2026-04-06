import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import type { ProofNode, ProofTree } from "@/lib/reasoning/types";
import {
  formatELI5,
  formatProfessional,
} from "@/lib/reasoning/proof-formatter";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const rl = await rateLimit(request, "AI_MEDIUM", user.id);
    if (!rl.success) return rateLimitResponse(rl);

    const body = await request.json();
    const { proofNodeId, proofTree, mode } = body as {
      proofNodeId: string;
      proofTree: ProofTree;
      mode?: "eli5" | "professional" | "standard";
    };

    if (!proofNodeId || !proofTree) {
      return NextResponse.json(
        { error: "proofNodeId and proofTree are required" },
        { status: 400 },
      );
    }

    // Find the node in the proof tree
    const node = findNodeById(proofTree.conclusion, proofNodeId);

    if (!node) {
      return NextResponse.json(
        { error: "Proof node not found" },
        { status: 404 },
      );
    }

    // Generate explanation based on node type and mode
    const explanation = generateExplanation(
      node,
      proofTree,
      mode || "standard",
    );

    return NextResponse.json({
      success: true,
      explanation,
    });
  } catch (error) {
    console.error("[ClauseWall] [API] Explain step failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to explain proof step" },
      { status: 500 },
    );
  }
}

// ---- Helpers ----

function findNodeById(node: ProofNode, id: string): ProofNode | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

function generateExplanation(
  node: ProofNode,
  proofTree: ProofTree,
  mode: string,
): {
  title: string;
  description: string;
  details: string[];
  metadata: Record<string, string | number | boolean | undefined>;
} {
  const details: string[] = [];

  // Mode-specific formatting
  if (mode === "eli5") {
    const eli5Steps = formatELI5(proofTree);
    return {
      title: simplifyType(node.type),
      description: node.description,
      details: eli5Steps,
      metadata: cleanMetadata(node.metadata),
    };
  }

  if (mode === "professional") {
    const proSteps = formatProfessional(proofTree);
    return {
      title: formalizeType(node.type),
      description: node.description,
      details: proSteps,
      metadata: cleanMetadata(node.metadata),
    };
  }

  // Standard mode — detailed explanation based on node type
  switch (node.type) {
    case "extraction":
      details.push(`Value: ${node.metadata.extractedValue}`);
      details.push(
        `Confidence: ${Math.round((node.metadata.confidence ?? 0) * 100)}%`,
      );
      if (node.metadata.originalText) {
        details.push(
          `Source text: "${node.metadata.originalText.substring(0, 200)}"`,
        );
      }
      break;

    case "rule":
      details.push(`Rule ID: ${node.metadata.ruleId}`);
      details.push(`Rule: ${node.metadata.ruleName}`);
      if (node.metadata.statute) {
        details.push(`Statute: ${node.metadata.statute}`);
      }
      if (node.metadata.statuteText) {
        details.push(`Statute text: "${node.metadata.statuteText}"`);
      }
      break;

    case "comparison":
      details.push(`Left operand: ${node.metadata.leftOperand}`);
      details.push(`Operator: ${node.metadata.operator}`);
      details.push(`Right operand: ${node.metadata.rightOperand}`);
      details.push(
        `Result: ${node.metadata.comparisonResult ? "TRUE (threshold breached)" : "FALSE (within limits)"}`,
      );
      break;

    case "conclusion":
      details.push(`Risk level: ${node.metadata.riskLevel}`);
      if (node.metadata.violation) {
        details.push(`Violation: ${node.metadata.violation}`);
      }
      if (node.metadata.remedy) {
        details.push(`Recommended remedy: ${node.metadata.remedy}`);
      }
      if (node.metadata.penalty) {
        details.push(`Potential penalty: ${node.metadata.penalty}`);
      }
      break;

    default:
      details.push(node.description);
      break;
  }

  return {
    title: humanReadableType(node.type),
    description: node.description,
    details,
    metadata: cleanMetadata(node.metadata),
  };
}

function cleanMetadata(
  metadata: ProofNode["metadata"],
): Record<string, string | number | boolean | undefined> {
  const clean: Record<string, string | number | boolean | undefined> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value !== undefined && value !== null) {
      clean[key] = value as string | number | boolean;
    }
  }
  return clean;
}

function humanReadableType(type: string): string {
  const map: Record<string, string> = {
    extraction: "📊 Value Extraction",
    fact: "📋 Known Fact",
    rule: "⚖️ Legal Rule",
    condition_check: "🔍 Condition Check",
    comparison: "⚡ Value Comparison",
    inference: "🔗 Logical Inference",
    conclusion: "🎯 Conclusion",
  };
  return map[type] || type;
}

function simplifyType(type: string): string {
  const map: Record<string, string> = {
    extraction: "What we found in the text",
    fact: "Something we know",
    rule: "What the law says",
    condition_check: "What we checked",
    comparison: "How the numbers compare",
    inference: "Putting it together",
    conclusion: "The bottom line",
  };
  return map[type] || type;
}

function formalizeType(type: string): string {
  const map: Record<string, string> = {
    extraction: "Material Fact — Extracted Datum",
    fact: "Established Fact",
    rule: "Applicable Legal Provision",
    condition_check: "Prerequisite Condition",
    comparison: "Quantitative Analysis",
    inference: "Legal Reasoning Chain",
    conclusion: "Legal Determination",
  };
  return map[type] || type;
}
