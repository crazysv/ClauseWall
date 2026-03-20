// ============================================
// CLAUSEWALL KNOWLEDGE GRAPH — PUBLIC API
// ============================================

export { loadGraph, invalidateGraphCache, InMemoryGraph } from "./graph-engine";

export {
  getClauseContext,
  getCourtCasesForClause,
  getAuthoritiesForClause,
  getGraphVisualization,
  enrichClauseWithGraph,
  enrichDocumentClauses,
} from "./graph-query";

export type {
  GraphNodeType,
  GraphEdgeType,
  GraphNode,
  GraphEdge,
  InMemoryNode,
  InMemoryEdge,
  CourtCaseData,
  LegalAuthorityData,
  ClauseGraphContext,
  GraphVisualizationData,
  VisNode,
  VisLink,
} from "./types";