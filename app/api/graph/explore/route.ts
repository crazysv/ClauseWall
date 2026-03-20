// ============================================
// GET full graph data for explorer page
// Returns all nodes + edges (or filtered by type)
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { loadGraph } from "@/lib/graph";
import type { GraphNodeType, VisNode, VisLink } from "@/lib/graph/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const nodeType = searchParams.get("nodeType") as GraphNodeType | null;
    const jurisdiction = searchParams.get("jurisdiction");

    const graph = await loadGraph();

    if (graph.isEmpty()) {
      return NextResponse.json({
        success: true,
        graph: { nodes: [], links: [] },
        stats: { nodes: 0, edges: 0 },
      });
    }

    // Get all nodes, optionally filtered by type
    const validTypes: GraphNodeType[] = [
      "law", "section", "clause_type", "interpretation",
      "jurisdiction", "authority", "penalty", "case_ref",
      "guideline", "regulation", "document_type", "remedy",
    ];

    const typesToInclude = nodeType && validTypes.includes(nodeType)
      ? [nodeType]
      : validTypes;

    const nodes: VisNode[] = [];
    const nodeIds = new Set<string>();

    for (const type of typesToInclude) {
      const typeNodes = graph.getNodesByType(type);
      for (const node of typeNodes) {
        // Filter by jurisdiction if specified
        if (jurisdiction && node.node_type === "jurisdiction") {
          if (node.node_key !== jurisdiction && node.node_key !== "ALL-INDIA") {
            continue;
          }
        }
        nodes.push({
          id: node.id,
          label: node.label,
          short_label: node.short_label || node.label.substring(0, 25),
          type: node.node_type,
          metadata: node.metadata,
        });
        nodeIds.add(node.id);
      }
    }

    // Get edges between included nodes
    const seenLinks = new Set<string>();
    const links: VisLink[] = [];

    for (const node of nodes) {
      const memNode = graph.getNode(node.id);
      if (!memNode) continue;

      for (const edge of memNode.outgoing) {
        if (!nodeIds.has(edge.target)) continue;
        const key = `${edge.source}-${edge.target}-${edge.edge_type}`;
        if (seenLinks.has(key)) continue;
        seenLinks.add(key);

        const formatMap: Record<string, string> = {
          HAS_SECTION: "Contains",
          PROHIBITS: "Prohibits",
          LIMITS: "Limits",
          REQUIRES: "Requires",
          INTERPRETED_IN: "Interpreted in",
          SUPPORTS: "Supports",
          ENFORCED_BY: "Enforced by",
          PENALTY_IS: "Penalty",
          APPLIES_IN: "Applies in",
          OVERRIDES: "Overrides",
          SUPPLEMENTS: "Supplements",
          REMEDY_IS: "Remedy",
          RELATED_TO: "Related to",
          CITED_IN: "Cited in",
          REGULATES: "Regulates",
          PART_OF: "Part of",
        };

        links.push({
          source: edge.source,
          target: edge.target,
          type: edge.edge_type,
          label: formatMap[edge.edge_type] || edge.edge_type,
          weight: edge.weight,
        });
      }
    }

    return NextResponse.json({
      success: true,
      graph: { nodes, links },
      stats: {
        nodes: nodes.length,
        edges: links.length,
        nodeTypes: [...new Set(nodes.map((n) => n.type))],
      },
    });
  } catch (error) {
    console.error("[ClauseWall] [API] Graph explore failed:", error);
    return NextResponse.json(
      { error: "Failed to load graph explorer data" },
      { status: 500 }
    );
  }
}