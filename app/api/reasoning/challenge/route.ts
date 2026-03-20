import { NextRequest, NextResponse } from "next/server";
import { callGroq } from "@/lib/ai/groq-client";
import type { ProofNode, ProofTree } from "@/lib/reasoning/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { proofNodeId, proofTree, userChallenge } = body as {
      proofNodeId: string;
      proofTree: ProofTree;
      userChallenge: string;
    };

    if (!proofNodeId || !proofTree || !userChallenge) {
      return NextResponse.json(
        { error: "proofNodeId, proofTree, and userChallenge are required" },
        { status: 400 }
      );
    }

    // Find the node
    const node = findNodeById(proofTree.conclusion, proofNodeId);

    if (!node) {
      return NextResponse.json(
        { error: "Proof node not found" },
        { status: 404 }
      );
    }

    // Build context for Groq
    const nodeContext = buildNodeContext(node);
    const statuteRef = node.metadata.statute || findStatuteInTree(proofTree.conclusion);

    const response = await callGroq(
      [
        {
          role: "system",
          content: `You are a legal expert analyzing Indian contract law. A user has challenged one step in a formal proof of a contract clause violation. Your job is to:
1. Acknowledge the user's challenge
2. Explain why the proof step is (or isn't) valid
3. Reference specific statutes and legal principles
4. Be balanced — if the challenge has merit, say so
5. Keep your response under 5 sentences

Respond in JSON format:
{
  "rebuttal": "Your detailed response",
  "meritScore": 0-100 (how much merit the user's challenge has),
  "sources": ["statute or case references"]
}`,
        },
        {
          role: "user",
          content: `The user is challenging this step in a proof tree:

PROOF STEP TYPE: ${node.type}
STEP DESCRIPTION: ${node.description}
STEP DETAILS: ${nodeContext}
${statuteRef ? `STATUTE: ${statuteRef}` : ""}
OVERALL CLAUSE: "${proofTree.clauseText.substring(0, 300)}"

USER CHALLENGE: "${userChallenge}"

Respond in JSON format.`,
        },
      ],
      {
        temperature: 0.4,
        maxTokens: 512,
      }
    );

    const parsed = JSON.parse(response);

    return NextResponse.json({
      success: true,
      rebuttal: parsed.rebuttal || "Unable to evaluate this challenge.",
      meritScore: parsed.meritScore ?? 50,
      sources: parsed.sources || [],
      challengedStep: {
        id: node.id,
        type: node.type,
        label: node.label,
      },
    });
  } catch (error) {
    console.error("[ClauseWall] [API] Challenge failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process challenge" },
      { status: 500 }
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

function buildNodeContext(node: ProofNode): string {
  const parts: string[] = [];

  if (node.metadata.extractedValue !== undefined) {
    parts.push(`Extracted value: ${node.metadata.extractedValue}`);
  }
  if (node.metadata.leftOperand !== undefined) {
    parts.push(
      `Comparison: ${node.metadata.leftOperand} ${node.metadata.operator || "=="} ${node.metadata.rightOperand} = ${node.metadata.comparisonResult}`
    );
  }
  if (node.metadata.ruleName) {
    parts.push(`Rule: ${node.metadata.ruleName}`);
  }
  if (node.metadata.statuteText) {
    parts.push(`Statute text: ${node.metadata.statuteText}`);
  }
  if (node.metadata.violation) {
    parts.push(`Violation: ${node.metadata.violation}`);
  }
  if (node.metadata.remedy) {
    parts.push(`Remedy: ${node.metadata.remedy}`);
  }
  if (node.metadata.originalText) {
    parts.push(`Source text: "${node.metadata.originalText.substring(0, 150)}"`);
  }

  return parts.join(". ") || node.description;
}

function findStatuteInTree(node: ProofNode): string | null {
  if (node.metadata.statute) return node.metadata.statute;
  for (const child of node.children) {
    const found = findStatuteInTree(child);
    if (found) return found;
  }
  return null;
}
