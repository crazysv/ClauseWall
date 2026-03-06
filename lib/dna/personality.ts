import { DNANode } from "./utils";

export interface ContractPersonality {
  name: string;
  description: string;
  emoji: string;
  gradient: [string, string];
}

export function detectPersonality(nodes: DNANode[], score: number): ContractPersonality {
  if (!nodes.length) {
    return { name: "The Ghost", description: "Empty or unreadable contract", emoji: "👻", gradient: ["#374151", "#1F2937"] };
  }

  const total = nodes.length;
  const illegal = nodes.filter((n) => n.riskLevel === "illegal").length;
  const dangerous = nodes.filter((n) => n.riskLevel === "dangerous").length;
  const safe = nodes.filter((n) => n.riskLevel === "safe").length;
  const warning = nodes.filter((n) => n.riskLevel === "warning").length;

  // The Predator — high illegal count
  if (illegal >= 3 || illegal / total > 0.25) {
    return {
      name: "The Predator",
      description: "Actively exploitative with multiple illegal clauses",
      emoji: "🦈",
      gradient: ["#7F1D1D", "#450A0A"],
    };
  }

  // The Trap — looks safe but hides dangers
  if (safe / total > 0.5 && (illegal >= 1 || dangerous >= 2)) {
    return {
      name: "The Trap",
      description: "Appears safe but conceals dangerous clauses",
      emoji: "🪤",
      gradient: ["#713F12", "#451A03"],
    };
  }

  // The Iron Fist — overwhelmingly one-sided
  if (dangerous / total > 0.4 && score > 65) {
    return {
      name: "The Iron Fist",
      description: "Overwhelmingly one-sided and controlling",
      emoji: "✊",
      gradient: ["#581C87", "#3B0764"],
    };
  }

  // The Minefield — scattered dangers
  if ((illegal + dangerous) / total > 0.3) {
    return {
      name: "The Minefield",
      description: "Scattered dangers throughout the contract",
      emoji: "💣",
      gradient: ["#7C2D12", "#431407"],
    };
  }

  // The Gray Zone — mostly warnings
  if (warning > dangerous && warning > safe) {
    return {
      name: "The Gray Zone",
      description: "Many questionable clauses that could go either way",
      emoji: "🌫️",
      gradient: ["#374151", "#1F2937"],
    };
  }

  // The Shield — very safe
  if (safe / total > 0.85 && score < 15) {
    return {
      name: "The Shield",
      description: "Exceptionally fair and well-structured",
      emoji: "🛡️",
      gradient: ["#1E3A5F", "#0F172A"],
    };
  }

  // The Fair Deal — mostly safe
  if (safe / total > 0.6 && score < 35) {
    return {
      name: "The Fair Deal",
      description: "Balanced and largely protective of both parties",
      emoji: "🤝",
      gradient: ["#064E3B", "#022C22"],
    };
  }

  // Default
  return {
    name: "The Standard",
    description: "Typical contract with mixed terms",
    emoji: "📄",
    gradient: ["#1E293B", "#0F172A"],
  };
}