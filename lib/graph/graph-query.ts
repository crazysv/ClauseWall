// ============================================
// CLAUSEWALL KNOWLEDGE GRAPH — QUERY LAYER
// High-level queries used by the analysis engine
// ============================================

import { loadGraph } from "./graph-engine";
import { createClient } from "@/lib/supabase/server";
import type {
  ClauseGraphContext,
  CourtCaseData,
  LegalAuthorityData,
  GraphVisualizationData,
  GraphEdgeType,
  InMemoryNode,
  VisNode,
  VisLink,
} from "./types";

// ============================================
// CONSTANTS
// ============================================

const CONSUMER_WIN_OUTCOMES = [
  "tenant_won",
  "employee_won",
  "consumer_won",
  "borrower_won",
];

const REGULATING_EDGE_TYPES: GraphEdgeType[] = [
  "PROHIBITS",
  "LIMITS",
  "REQUIRES",
  "REGULATES",
];

// ============================================
// HELPERS
// ============================================

function emptyContext(): ClauseGraphContext {
  return {
    primary_law: null,
    supporting_laws: [],
    court_cases: [],
    authorities: [],
    penalties: [],
    interpretations: [],
    remedies: [],
    win_rate: null,
    total_related_cases: 0,
    graph_depth: 0,
  };
}

function formatEdgeType(edgeType: string): string {
  const map: Record<string, string> = {
    PROHIBITS: "Prohibits",
    LIMITS: "Limits",
    REQUIRES: "Requires",
    REGULATES: "Regulates",
    SUPPLEMENTS: "Supplements",
    OVERRIDES: "Overrides",
    RELATED_TO: "Related to",
    HAS_SECTION: "Contains",
    INTERPRETED_IN: "Interpreted in",
    SUPPORTS: "Supports",
    ENFORCED_BY: "Enforced by",
    PENALTY_IS: "Penalty",
    APPLIES_IN: "Applies in",
    REMEDY_IS: "Remedy",
    CITED_IN: "Cited in",
    PART_OF: "Part of",
  };
  return map[edgeType] || edgeType;
}

function dedup<T extends { id: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  return arr.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function calcWinRate(cases: CourtCaseData[]): number | null {
  if (cases.length === 0) return null;
  const wins = cases.filter((c) =>
    CONSUMER_WIN_OUTCOMES.includes(c.outcome || "")
  ).length;
  return Math.round((wins / cases.length) * 100);
}

// ============================================
// MAIN QUERY: getClauseContext
// ============================================

export async function getClauseContext(
  clauseType: string,
  jurisdiction: string,
  _documentType?: string
): Promise<ClauseGraphContext> {
  try {
    const graph = await loadGraph();

    if (graph.isEmpty()) {
      return await getContextFromDBOnly(clauseType, jurisdiction);
    }

    // Find clause_type node (try original key, then normalized)
    let clauseNode = graph.findNode("clause_type", clauseType);
    if (!clauseNode) {
      clauseNode = graph.findNode("clause_type", clauseType.replace(/-/g, "_"));
    }
    if (!clauseNode) {
      return await getContextFromDBOnly(clauseType, jurisdiction);
    }

    return await buildContextFromNode(clauseNode, jurisdiction);
  } catch (error) {
    console.error("[ClauseWall] [Graph] getClauseContext failed:", error);
    return emptyContext();
  }
}

// ============================================
// BUILD CONTEXT VIA GRAPH TRAVERSAL
// ============================================

async function buildContextFromNode(
  clauseNode: InMemoryNode,
  jurisdiction: string
): Promise<ClauseGraphContext> {
  const graph = await loadGraph();

  // ---- 1. Sections that regulate this clause type ----
  const sectionNodes: InMemoryNode[] = [];
  for (const edgeType of REGULATING_EDGE_TYPES) {
    sectionNodes.push(...graph.getIncoming(clauseNode.id, edgeType));
  }
  const uniqueSections = dedup(sectionNodes);

  // ---- 2. For each section → parent law + jurisdiction check ----
  const lawPairs: Array<{
    law: InMemoryNode;
    section: InMemoryNode;
    relationship: string;
    applies: boolean;
  }> = [];

  for (const section of uniqueSections) {
    const laws = graph.getIncoming(section.id, "HAS_SECTION");
    const edgeToClause = section.outgoing.find(
      (e) => e.target === clauseNode.id
    );
    const relationship = edgeToClause
      ? formatEdgeType(edgeToClause.edge_type)
      : "Related";

    for (const law of laws) {
      const jurisdictionNodes = graph.getIncoming(law.id, "APPLIES_IN");
      const applies =
        jurisdictionNodes.length === 0 ||
        jurisdictionNodes.some(
          (j) => j.node_key === jurisdiction || j.node_key === "ALL-INDIA"
        );

      lawPairs.push({ law, section, relationship, applies });
    }
  }

  // Sort: applicable first
  lawPairs.sort((a, b) => {
    if (a.applies && !b.applies) return -1;
    if (!a.applies && b.applies) return 1;
    return 0;
  });

  const primaryPair = lawPairs.find((p) => p.applies) || lawPairs[0] || null;

  const primaryLaw = primaryPair
    ? {
        name: primaryPair.law.label,
        section: primaryPair.section.label,
        description: primaryPair.section.description,
      }
    : null;

  const supportingLaws = lawPairs
    .filter((p) => p !== primaryPair)
    .map((p) => ({
      name: p.law.label,
      section: p.section.label,
      relationship: p.relationship,
    }));

  // ---- 3. Penalties ----
  const penaltyNodes: InMemoryNode[] = [
    ...graph.getOutgoing(clauseNode.id, "PENALTY_IS"),
  ];
  for (const section of uniqueSections) {
    penaltyNodes.push(...graph.getOutgoing(section.id, "PENALTY_IS"));
  }
  const penalties = dedup(penaltyNodes).map((p) => ({
    description: p.description || p.label,
    law_reference:
      (p.metadata as Record<string, string>)?.law_reference || "",
  }));

  // ---- 4. Interpretations ----
  const interpNodes: InMemoryNode[] = [];
  for (const section of uniqueSections) {
    interpNodes.push(
      ...graph
        .getOutgoing(section.id, "INTERPRETED_IN")
        .filter((n) => n.node_type === "interpretation")
    );
  }
  interpNodes.push(
    ...graph
      .getOutgoing(clauseNode.id, "RELATED_TO")
      .filter((n) => n.node_type === "interpretation")
  );
  const interpretations = dedup(interpNodes).map((i) => ({
    text: i.description || i.label,
    source: (i.metadata as Record<string, string>)?.source || "Legal interpretation",
  }));

  // ---- 5. Remedies ----
  const remedyNodes = graph.getOutgoing(clauseNode.id, "REMEDY_IS");
  const remedies = remedyNodes.map((r) => ({
    description: r.description || r.label,
    authority: (r.metadata as Record<string, string>)?.authority || null,
  }));

  // ---- 6. Court cases (from DB — reliable) ----
  const supabase = await createClient();

  const { data: casesRaw } = await supabase
    .from("court_cases")
    .select("*")
    .contains("clause_types", [clauseNode.node_key])
    .or(`jurisdiction.eq.${jurisdiction},jurisdiction.eq.ALL-INDIA`)
    .order("is_landmark", { ascending: false })
    .order("year", { ascending: false })
    .limit(10);

  const cases = (casesRaw as CourtCaseData[]) || [];
  const courtCases = cases.map((c) => ({
    case_name: c.case_name,
    year: c.year,
    court: c.court,
    outcome: c.outcome,
    key_ruling: c.key_ruling,
    is_landmark: c.is_landmark,
  }));

  // ---- 7. Authorities (from DB) ----
  const { data: authsRaw } = await supabase
    .from("legal_authorities")
    .select("*")
    .contains("handles_clause_types", [clauseNode.node_key])
    .or(`jurisdiction.eq.${jurisdiction},jurisdiction.eq.ALL-INDIA`)
    .eq("is_active", true)
    .limit(5);

  const auths = (authsRaw as LegalAuthorityData[]) || [];
  const authorities = auths.map((a) => ({
    name: a.authority_name,
    type: a.authority_type,
    jurisdiction: a.jurisdiction,
    how_to_file: a.how_to_file,
    filing_fee: a.filing_fee,
    timeline: a.typical_timeline,
  }));

  return {
    primary_law: primaryLaw,
    supporting_laws: supportingLaws,
    court_cases: courtCases,
    authorities,
    penalties,
    interpretations,
    remedies,
    win_rate: calcWinRate(cases),
    total_related_cases: cases.length,
    graph_depth: 3,
  };
}

// ============================================
// FALLBACK: DB-only context (no graph nodes)
// ============================================

async function getContextFromDBOnly(
  clauseType: string,
  jurisdiction: string
): Promise<ClauseGraphContext> {
  const supabase = await createClient();

  const [casesRes, authsRes] = await Promise.all([
    supabase
      .from("court_cases")
      .select("*")
      .contains("clause_types", [clauseType])
      .or(`jurisdiction.eq.${jurisdiction},jurisdiction.eq.ALL-INDIA`)
      .order("is_landmark", { ascending: false })
      .order("year", { ascending: false })
      .limit(10),
    supabase
      .from("legal_authorities")
      .select("*")
      .contains("handles_clause_types", [clauseType])
      .or(`jurisdiction.eq.${jurisdiction},jurisdiction.eq.ALL-INDIA`)
      .eq("is_active", true)
      .limit(5),
  ]);

  const cases = (casesRes.data as CourtCaseData[]) || [];
  const auths = (authsRes.data as LegalAuthorityData[]) || [];

  return {
    primary_law: null,
    supporting_laws: [],
    court_cases: cases.map((c) => ({
      case_name: c.case_name,
      year: c.year,
      court: c.court,
      outcome: c.outcome,
      key_ruling: c.key_ruling,
      is_landmark: c.is_landmark,
    })),
    authorities: auths.map((a) => ({
      name: a.authority_name,
      type: a.authority_type,
      jurisdiction: a.jurisdiction,
      how_to_file: a.how_to_file,
      filing_fee: a.filing_fee,
      timeline: a.typical_timeline,
    })),
    penalties: [],
    interpretations: [],
    remedies: [],
    win_rate: calcWinRate(cases),
    total_related_cases: cases.length,
    graph_depth: 0,
  };
}

// ============================================
// DIRECT LOOKUPS
// ============================================

export async function getCourtCasesForClause(
  clauseType: string,
  jurisdiction: string
): Promise<CourtCaseData[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("court_cases")
    .select("*")
    .contains("clause_types", [clauseType])
    .or(`jurisdiction.eq.${jurisdiction},jurisdiction.eq.ALL-INDIA`)
    .order("is_landmark", { ascending: false })
    .order("year", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[ClauseWall] [Graph] Court case query failed:", error);
    return [];
  }
  return (data as CourtCaseData[]) || [];
}

export async function getAuthoritiesForClause(
  clauseType: string,
  jurisdiction: string
): Promise<LegalAuthorityData[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("legal_authorities")
    .select("*")
    .contains("handles_clause_types", [clauseType])
    .or(`jurisdiction.eq.${jurisdiction},jurisdiction.eq.ALL-INDIA`)
    .eq("is_active", true)
    .limit(10);

  if (error) {
    console.error("[ClauseWall] [Graph] Authority query failed:", error);
    return [];
  }
  return (data as LegalAuthorityData[]) || [];
}

// ============================================
// VISUALIZATION DATA (for D3)
// ============================================

export async function getGraphVisualization(
  clauseType: string,
  jurisdiction: string,
  maxDepth: number = 3
): Promise<GraphVisualizationData> {
  try {
    const graph = await loadGraph();
    if (graph.isEmpty()) return { nodes: [], links: [] };

    let clauseNode = graph.findNode("clause_type", clauseType);
    if (!clauseNode) {
      clauseNode = graph.findNode("clause_type", clauseType.replace(/-/g, "_"));
    }
    if (!clauseNode) return { nodes: [], links: [] };

    const { nodes: traversedNodes, edges: traversedEdges } = graph.traverse(
      clauseNode.id,
      maxDepth
    );

    // Filter: keep jurisdiction-relevant nodes only
    const visNodes: VisNode[] = traversedNodes
      .filter((n) => {
        if (n.node_type === "jurisdiction") {
          return n.node_key === jurisdiction || n.node_key === "ALL-INDIA";
        }
        return true;
      })
      .map((n) => ({
        id: n.id,
        label: n.label,
        short_label: n.short_label || n.label.substring(0, 25),
        type: n.node_type,
        metadata: n.metadata,
      }));

    const nodeIds = new Set(visNodes.map((n) => n.id));

    // Deduplicated links
    const seenLinks = new Set<string>();
    const visLinks: VisLink[] = [];

    for (const edge of traversedEdges) {
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
      const key = `${edge.source}-${edge.target}-${edge.edge_type}`;
      if (seenLinks.has(key)) continue;
      seenLinks.add(key);

      visLinks.push({
        source: edge.source,
        target: edge.target,
        type: edge.edge_type,
        label: formatEdgeType(edge.edge_type),
        weight: edge.weight,
      });
    }

    return { nodes: visNodes, links: visLinks };
  } catch (error) {
    console.error("[ClauseWall] [Graph] Visualization query failed:", error);
    return { nodes: [], links: [] };
  }
}

// ============================================
// CLAUSE ENRICHMENT — saves graph context to DB
// ============================================

export async function enrichClauseWithGraph(
  clauseId: string,
  clauseType: string,
  jurisdiction: string
): Promise<void> {
  try {
    const context = await getClauseContext(clauseType, jurisdiction);

    const hasData =
      context.court_cases.length > 0 ||
      context.authorities.length > 0 ||
      context.supporting_laws.length > 0 ||
      context.primary_law !== null ||
      context.penalties.length > 0;

    if (!hasData) return;

    const supabase = await createClient();
    await supabase
      .from("clauses")
      .update({
        court_cases: context.court_cases,
        authorities: context.authorities,
        related_laws: [
          ...(context.primary_law
            ? [
                {
                  name: context.primary_law.name,
                  section: context.primary_law.section,
                  relationship: "Primary",
                },
              ]
            : []),
          ...context.supporting_laws,
        ],
        graph_context: context,
      })
      .eq("id", clauseId);
  } catch (error) {
    console.error(
      "[ClauseWall] [Graph] Enrichment failed for clause:",
      clauseId,
      error
    );
  }
}

/**
 * Enrich ALL clauses of a document with graph context
 */
export async function enrichDocumentClauses(
  documentId: string,
  jurisdiction: string
): Promise<number> {
  const supabase = await createClient();

  const { data: clauses, error } = await supabase
    .from("clauses")
    .select("id, clause_type, risk_level")
    .eq("document_id", documentId);

  if (error || !clauses) {
    console.error("[ClauseWall] [Graph] Failed to fetch clauses:", error);
    return 0;
  }

  let enriched = 0;

  for (const clause of clauses) {
    if (!clause.clause_type) continue;
    await enrichClauseWithGraph(
      clause.id,
      clause.clause_type,
      jurisdiction
    );
    enriched++;
  }


  return enriched;
}