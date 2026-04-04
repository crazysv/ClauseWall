// ============================================
// GET visualization data for D3 graph rendering
// Returns nodes + links for a clause type
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getGraphVisualization } from "@/lib/graph";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clauseType = searchParams.get("clauseType");
    const jurisdiction = searchParams.get("jurisdiction") || "ALL-INDIA";
    const maxDepth = parseInt(searchParams.get("maxDepth") || "3", 10);

    if (!clauseType) {
      return NextResponse.json(
        { error: "clauseType is required" },
        { status: 400 },
      );
    }

    const graphData = await getGraphVisualization(
      clauseType,
      jurisdiction,
      Math.min(maxDepth, 5),
    );

    return NextResponse.json({
      success: true,
      clauseType,
      jurisdiction,
      depth: maxDepth,
      nodeCount: graphData.nodes.length,
      linkCount: graphData.links.length,
      graph: graphData,
    });
  } catch (error) {
    console.error("[ClauseWall] [API] Graph traverse failed:", error);
    return NextResponse.json(
      { error: "Failed to traverse knowledge graph" },
      { status: 500 },
    );
  }
}
