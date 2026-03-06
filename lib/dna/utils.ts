import { RiskLevel } from "@/types";

// ============================================
// DNA NODE — Core data structure for all styles
// ============================================

export interface DNANode {
  index: number;
  clauseNumber: number;
  clauseType: string;
  riskLevel: RiskLevel;
  riskScore: number;
  color: string;
  riskColor: string;
  intensity: number;
  text: string;
  explanation: string;
}

// ============================================
// COLOR MAPPINGS
// ============================================

const TYPE_COLORS: Record<string, string> = {
  security_deposit: "#3B82F6", deposit: "#3B82F6",
  rent: "#06B6D4", rent_escalation: "#06B6D4",
  termination: "#F97316", notice_period: "#EAB308", notice: "#EAB308",
  penalty: "#EF4444", late_payment: "#EF4444",
  non_compete: "#A855F7", non_solicitation: "#A855F7",
  maintenance: "#22C55E", repair: "#22C55E",
  liability: "#DC2626", indemnity: "#EC4899",
  confidentiality: "#8B5CF6", nda: "#8B5CF6",
  arbitration: "#14B8A6", dispute_resolution: "#14B8A6",
  force_majeure: "#6366F1", insurance: "#0EA5E9",
  subletting: "#F59E0B", lock_in: "#F43F5E",
  renewal: "#10B981", assignment: "#D946EF",
  governing_law: "#64748B", payment: "#0891B2",
  warranty: "#059669", intellectual_property: "#7C3AED",
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  safe: "#22C55E",
  warning: "#EAB308",
  dangerous: "#EF4444",
  illegal: "#A855F7",
};

export function getClauseColor(type: string): string {
  const key = type?.toLowerCase().replace(/[\s\-]+/g, "_") || "";
  if (TYPE_COLORS[key]) return TYPE_COLORS[key];
  for (const [k, v] of Object.entries(TYPE_COLORS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return "#94A3B8";
}

// ============================================
// TRANSFORM CLAUSES TO DNA NODES
// ============================================

export function clausesToNodes(clauses: any[]): DNANode[] {
  return clauses.map((c, i) => ({
    index: i,
    clauseNumber: c.clause_number || i + 1,
    clauseType: c.clause_type || "unknown",
    riskLevel: (c.risk_level as RiskLevel) || "safe",
    riskScore: c.risk_score || 0,
    color: getClauseColor(c.clause_type),
    riskColor: RISK_COLORS[(c.risk_level as RiskLevel)] || "#94A3B8",
    intensity: ({ safe: 0.5, warning: 0.7, dangerous: 0.85, illegal: 1.0 } as Record<string, number>)[c.risk_level] || 0.5,
    text: (c.original_text || "").slice(0, 120),
    explanation: c.explanation || "",
  }));
}

// ============================================
// CONTRACT IDENTITY
// ============================================

export function generateContractId(docId: string): string {
  return `CW-${new Date().getFullYear()}-${docId.slice(0, 4).toUpperCase()}`;
}

export function generateUniqueHex(clauses: any[]): string {
  let hash = 0;
  const str = clauses.map((c) => `${c.clause_type}${c.risk_score}`).join("");
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return `#${Math.abs(hash).toString(16).slice(0, 6).padStart(6, "0")}`;
}

// ============================================
// STYLE DEFINITIONS
// ============================================

export type DNAStyle = "fingerprint" | "waveform" | "heartbeat" | "constellation" | "skyline" | "helix";

export const DNA_STYLES: { id: DNAStyle; name: string; icon: string; description: string }[] = [
  { id: "fingerprint", name: "Fingerprint", icon: "🔵", description: "Unique circular identity" },
  { id: "waveform", name: "Waveform", icon: "🔊", description: "Audio signature of risk" },
  { id: "heartbeat", name: "Heartbeat", icon: "💓", description: "Contract vital signs" },
  { id: "constellation", name: "Galaxy", icon: "✨", description: "Star map of clauses" },
  { id: "skyline", name: "Skyline", icon: "🏙️", description: "City of clauses" },
  { id: "helix", name: "Helix", icon: "🧬", description: "DNA structure" },
];

export function getDefaultStyle(docType: string): DNAStyle {
  const map: Record<string, DNAStyle> = {
    rental: "skyline",
    loan: "heartbeat",
    employment: "constellation",
    tos: "waveform",
    nda: "fingerprint",
    freelance: "helix",
  };
  return map[docType] || "fingerprint";
}

// ============================================
// SHARED STYLE PROPS
// ============================================

export interface DNAStyleProps {
  nodes: DNANode[];
  width?: number;
  height?: number;
  animated?: boolean;
  onHover?: (node: DNANode | null) => void;
}