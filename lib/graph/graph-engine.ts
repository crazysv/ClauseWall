// ============================================
// CLAUSEWALL KNOWLEDGE GRAPH — IN-MEMORY ENGINE
// Loads graph from Supabase, caches, traverses
// ============================================

import { createClient } from "@/lib/supabase/server";
import type {
  GraphNode,
  GraphEdge,
  GraphNodeType,
  GraphEdgeType,
  InMemoryNode,
  InMemoryEdge,
} from "./types";

// ---- Module-level cache ----
let cachedGraph: InMemoryGraph | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// ============================================
// IN-MEMORY GRAPH CLASS
// ============================================

export class InMemoryGraph {
  private nodes: Map<string, InMemoryNode>;
  private nodesByType: Map<string, Set<string>>;
  private nodesByKey: Map<string, string>; // "type:key" → id

  constructor(dbNodes: GraphNode[], dbEdges: GraphEdge[]) {
    this.nodes = new Map();
    this.nodesByType = new Map();
    this.nodesByKey = new Map();

    // ---- Index nodes ----
    for (const node of dbNodes) {
      if (!node.is_active) continue;

      const memNode: InMemoryNode = {
        ...node,
        outgoing: [],
        incoming: [],
      };
      this.nodes.set(node.id, memNode);

      // Type index
      if (!this.nodesByType.has(node.node_type)) {
        this.nodesByType.set(node.node_type, new Set());
      }
      this.nodesByType.get(node.node_type)!.add(node.id);

      // Key index (unique per type:key)
      this.nodesByKey.set(`${node.node_type}:${node.node_key}`, node.id);
    }

    // ---- Index edges ----
    for (const edge of dbEdges) {
      if (!edge.is_active) continue;

      const memEdge: InMemoryEdge = {
        id: edge.id,
        source: edge.source_node_id,
        target: edge.target_node_id,
        edge_type: edge.edge_type as GraphEdgeType,
        metadata: edge.metadata || {},
        weight: edge.weight,
      };

      const sourceNode = this.nodes.get(edge.source_node_id);
      const targetNode = this.nodes.get(edge.target_node_id);

      if (sourceNode) sourceNode.outgoing.push(memEdge);
      if (targetNode) targetNode.incoming.push(memEdge);
    }
  }

  // ---- Lookup methods ----

  findNode(type: GraphNodeType, key: string): InMemoryNode | null {
    const id = this.nodesByKey.get(`${type}:${key}`);
    return id ? this.nodes.get(id) ?? null : null;
  }

  getNode(id: string): InMemoryNode | null {
    return this.nodes.get(id) ?? null;
  }

  getNodesByType(type: GraphNodeType): InMemoryNode[] {
    const ids = this.nodesByType.get(type);
    if (!ids) return [];
    return Array.from(ids)
      .map((id) => this.nodes.get(id)!)
      .filter(Boolean);
  }

  // ---- Edge traversal ----

  /** Nodes reachable via outgoing edges of given type */
  getOutgoing(nodeId: string, edgeType?: GraphEdgeType): InMemoryNode[] {
    const node = this.nodes.get(nodeId);
    if (!node) return [];
    const edges = edgeType
      ? node.outgoing.filter((e) => e.edge_type === edgeType)
      : node.outgoing;
    return edges.map((e) => this.nodes.get(e.target)!).filter(Boolean);
  }

  /** Raw outgoing edges */
  getOutgoingEdges(nodeId: string, edgeType?: GraphEdgeType): InMemoryEdge[] {
    const node = this.nodes.get(nodeId);
    if (!node) return [];
    return edgeType
      ? node.outgoing.filter((e) => e.edge_type === edgeType)
      : [...node.outgoing];
  }

  /** Nodes reachable via incoming edges of given type */
  getIncoming(nodeId: string, edgeType?: GraphEdgeType): InMemoryNode[] {
    const node = this.nodes.get(nodeId);
    if (!node) return [];
    const edges = edgeType
      ? node.incoming.filter((e) => e.edge_type === edgeType)
      : node.incoming;
    return edges.map((e) => this.nodes.get(e.source)!).filter(Boolean);
  }

  /** Raw incoming edges */
  getIncomingEdges(nodeId: string, edgeType?: GraphEdgeType): InMemoryEdge[] {
    const node = this.nodes.get(nodeId);
    if (!node) return [];
    return edgeType
      ? node.incoming.filter((e) => e.edge_type === edgeType)
      : [...node.incoming];
  }

  // ---- BFS traversal ----

  traverse(
    startId: string,
    maxDepth: number = 3
  ): { nodes: InMemoryNode[]; edges: InMemoryEdge[] } {
    const visitedNodes = new Set<string>();
    const visitedEdges = new Set<string>();
    const resultNodes: InMemoryNode[] = [];
    const resultEdges: InMemoryEdge[] = [];
    const queue: Array<{ id: string; depth: number }> = [
      { id: startId, depth: 0 },
    ];

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (visitedNodes.has(id) || depth > maxDepth) continue;
      visitedNodes.add(id);

      const node = this.nodes.get(id);
      if (!node) continue;
      resultNodes.push(node);

      const allEdges = [...node.outgoing, ...node.incoming];
      for (const edge of allEdges) {
        if (!visitedEdges.has(edge.id)) {
          visitedEdges.add(edge.id);
          resultEdges.push(edge);
        }
        const neighborId = edge.source === id ? edge.target : edge.source;
        if (!visitedNodes.has(neighborId)) {
          queue.push({ id: neighborId, depth: depth + 1 });
        }
      }
    }

    return { nodes: resultNodes, edges: resultEdges };
  }

  // ---- Stats ----

  get nodeCount(): number {
    return this.nodes.size;
  }

  get edgeCount(): number {
    let count = 0;
    for (const node of this.nodes.values()) {
      count += node.outgoing.length;
    }
    return count;
  }

  isEmpty(): boolean {
    return this.nodes.size === 0;
  }
}

// ============================================
// LOAD + CACHE
// ============================================

export async function loadGraph(): Promise<InMemoryGraph> {
  const now = Date.now();
  if (cachedGraph && now - cacheTimestamp < CACHE_TTL) {
    return cachedGraph;
  }

  const supabase = await createClient();

  const [nodesRes, edgesRes] = await Promise.all([
    supabase.from("graph_nodes").select("*").eq("is_active", true),
    supabase.from("graph_edges").select("*").eq("is_active", true),
  ]);

  if (nodesRes.error) {
    console.error("[ClauseWall] [Graph] Failed to load nodes:", nodesRes.error);
    return new InMemoryGraph([], []);
  }
  if (edgesRes.error) {
    console.error("[ClauseWall] [Graph] Failed to load edges:", edgesRes.error);
    return new InMemoryGraph(nodesRes.data as GraphNode[], []);
  }

  cachedGraph = new InMemoryGraph(
    nodesRes.data as GraphNode[],
    edgesRes.data as GraphEdge[]
  );
  cacheTimestamp = now;


  return cachedGraph;
}

export function invalidateGraphCache(): void {
  cachedGraph = null;
  cacheTimestamp = 0;
}