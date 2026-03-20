// ============================================
// CLAUSEWALL LEGAL KNOWLEDGE GRAPH — TYPES
// ============================================

export type GraphNodeType =
  | "law"
  | "section"
  | "clause_type"
  | "interpretation"
  | "jurisdiction"
  | "authority"
  | "penalty"
  | "case_ref"
  | "guideline"
  | "regulation"
  | "document_type"
  | "remedy";

export type GraphEdgeType =
  | "HAS_SECTION"
  | "PROHIBITS"
  | "LIMITS"
  | "REQUIRES"
  | "INTERPRETED_IN"
  | "SUPPORTS"
  | "ENFORCED_BY"
  | "PENALTY_IS"
  | "APPLIES_IN"
  | "OVERRIDES"
  | "SUPPLEMENTS"
  | "REMEDY_IS"
  | "RELATED_TO"
  | "CITED_IN"
  | "REGULATES"
  | "PART_OF";

// ---- DB row shapes ----

export interface GraphNode {
  id: string;
  node_type: GraphNodeType;
  node_key: string;
  label: string;
  short_label: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  is_active: boolean;
}

export interface GraphEdge {
  id: string;
  source_node_id: string;
  target_node_id: string;
  edge_type: GraphEdgeType;
  metadata: Record<string, unknown>;
  weight: number;
  is_active: boolean;
}

// ---- In-memory graph structures ----

export interface InMemoryNode extends GraphNode {
  outgoing: InMemoryEdge[];
  incoming: InMemoryEdge[];
}

export interface InMemoryEdge {
  id: string;
  source: string;
  target: string;
  edge_type: GraphEdgeType;
  metadata: Record<string, unknown>;
  weight: number;
}

// ---- Detail table shapes ----

export interface CourtCaseData {
  id: string;
  graph_node_id: string | null;
  case_name: string;
  citation: string | null;
  year: number;
  court: string;
  bench: string | null;
  jurisdiction: string;
  clause_types: string[];
  laws_cited: string[];
  outcome: string | null;
  key_ruling: string;
  ruling_details: string | null;
  relevance_tags: string[];
  source_url: string | null;
  is_landmark: boolean;
  is_verified: boolean;
}

export interface LegalAuthorityData {
  id: string;
  graph_node_id: string | null;
  authority_name: string;
  authority_type: string | null;
  jurisdiction: string;
  handles_clause_types: string[];
  address: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  filing_fee: string | null;
  typical_timeline: string | null;
  how_to_file: string | null;
  is_active: boolean;
}

// ---- Context attached to a clause after graph enrichment ----

export interface ClauseGraphContext {
  primary_law: {
    name: string;
    section: string;
    description: string | null;
  } | null;
  supporting_laws: {
    name: string;
    section: string;
    relationship: string;
  }[];
  court_cases: {
    case_name: string;
    year: number;
    court: string;
    outcome: string | null;
    key_ruling: string;
    is_landmark: boolean;
  }[];
  authorities: {
    name: string;
    type: string | null;
    jurisdiction: string;
    how_to_file: string | null;
    filing_fee: string | null;
    timeline: string | null;
  }[];
  penalties: {
    description: string;
    law_reference: string;
  }[];
  interpretations: {
    text: string;
    source: string;
  }[];
  remedies: {
    description: string;
    authority: string | null;
  }[];
  win_rate: number | null;
  total_related_cases: number;
  graph_depth: number;
}

// ---- D3 visualization ----

export interface GraphVisualizationData {
  nodes: VisNode[];
  links: VisLink[];
}

export interface VisNode {
  id: string;
  label: string;
  short_label: string;
  type: GraphNodeType;
  metadata: Record<string, unknown>;
}

export interface VisLink {
  source: string;
  target: string;
  type: GraphEdgeType;
  label: string;
  weight: number;
}