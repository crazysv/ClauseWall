"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronDown, ExternalLink, AlertTriangle, DoorOpen, MessageSquare } from "lucide-react";
import type {
  TrapStateAnalysis,
  ContractStateMachine,
  StatePath,
  TrapSeverity,
} from "@/lib/statemachine/types";

interface TrapStateCardProps {
  trap: TrapStateAnalysis;
  stateMachine: ContractStateMachine;
  onHighlightPath?: (path: StatePath) => void;
  documentId?: string;
}

const SEVERITY_STYLES: Record<TrapSeverity, { badge: string; border: string }> = {
  critical: { badge: "bg-red-500/20 text-red-400 border-red-500/30", border: "border-l-red-500" },
  high: { badge: "bg-orange-500/20 text-orange-400 border-orange-500/30", border: "border-l-orange-500" },
  medium: { badge: "bg-amber-500/20 text-amber-400 border-amber-500/30", border: "border-l-amber-400" },
};

export default function TrapStateCard({ trap, stateMachine, onHighlightPath, documentId }: TrapStateCardProps) {
  const [expanded, setExpanded] = useState(false);
  const style = SEVERITY_STYLES[trap.severity];

  // Build inline path visualization
  const renderInlinePath = (path: StatePath) => {
    return (
      <div className="flex flex-wrap items-center gap-1 my-2">
        {path.states.map((sid, i) => {
          const st = stateMachine.states.find((s) => s.id === sid);
          if (!st) return null;
          const isTrap = st.isTrap;
          return (
            <span key={`${sid}-${i}`} className="flex items-center gap-1">
              {i > 0 && (
                <svg width="16" height="10" className="flex-shrink-0">
                  <line x1="0" y1="5" x2="16" y2="5" stroke="#475569" strokeWidth="1.5" />
                  <polygon points="12,2 16,5 12,8" fill="#475569" />
                </svg>
              )}
              <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border ${
                isTrap
                  ? "bg-red-500/15 border-red-500/30 text-red-300"
                  : "bg-white/5 border-white/10 text-gray-300"
              }`}>
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: isTrap ? "#ef4444" :
                      st.type === "terminal_safe" ? "#22c55e" :
                      st.type === "terminal_loss" ? "#ef4444" :
                      st.type === "dangerous" ? "#f97316" :
                      st.type === "restricted" ? "#f59e0b" : "#10b981",
                  }}
                />
                {st.name}
              </span>
            </span>
          );
        })}
      </div>
    );
  };

  const hasEscapes = trap.outgoingPaths.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg bg-red-500/[0.03] border border-white/5 border-l-4 ${style.border} overflow-hidden`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">💀</span>
            <h4 className="font-semibold text-sm">TRAP: {trap.stateName}</h4>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase ${style.badge}`}>
            {trap.severity}
          </span>
        </div>

        {/* Trap type */}
        <p className="text-xs text-gray-400 mb-2">
          <span className="font-medium text-gray-300">TYPE:</span>{" "}
          {trap.trapType.replace(/_/g, " ")} — {trap.description.substring(0, 120)}{trap.description.length > 120 ? "…" : ""}
        </p>

        {/* Path leading here */}
        {trap.pathsLeadingHere.length > 0 && (
          <div className="mb-2">
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
              How you get trapped:
            </p>
            {renderInlinePath(trap.pathsLeadingHere[0])}
          </div>
        )}

        {/* Financial impact */}
        <div className="flex items-center gap-1.5 text-xs text-amber-400 mb-2">
          <span>💰</span>
          <span>Financial Impact: {trap.financialImpact}</span>
        </div>

        {/* Expand/collapse */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
          {expanded ? "Less details" : "More details"}
        </button>

        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-3"
          >
            {/* Fair alternative */}
            <div className="p-2.5 rounded-lg bg-green-500/5 border border-green-500/10">
              <p className="text-[10px] text-green-400 font-semibold uppercase tracking-wider mb-1">
                Fair Alternative:
              </p>
              <p className="text-xs text-green-300">{trap.fairAlternative}</p>
            </div>

            {/* Legal issue */}
            {trap.legalIssue && (
              <div className="flex items-start gap-1.5 text-xs">
                <span className="flex-shrink-0">⚖️</span>
                <p className="text-gray-300">{trap.legalIssue}</p>
              </div>
            )}

            {/* Related clauses */}
            {trap.relatedClauses.length > 0 && (
              <p className="text-xs text-gray-400">
                <span className="text-gray-500">Related clauses:</span> {trap.relatedClauses.join(", ")}
              </p>
            )}

            {/* Escape paths */}
            {hasEscapes ? (
              <div>
                <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider mb-1">
                  Escape paths:
                </p>
                {trap.outgoingPaths.slice(0, 2).map((path, i) => (
                  <div key={i}>
                    {renderInlinePath(path)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-red-500/10 border border-red-500/15">
                <AlertTriangle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-300">No escape paths — this is an absolute trap</p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.02] border-t border-white/5">
        {trap.pathsLeadingHere.length > 0 && onHighlightPath && (
          <button
            onClick={() => onHighlightPath(trap.pathsLeadingHere[0])}
            className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            Highlight on Graph
          </button>
        )}

        {/* Cross-links */}
        {documentId && (
          <>
            <Link
              href={`/escape/${documentId}`}
              className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400/70 hover:text-emerald-400 transition-colors"
            >
              <DoorOpen className="w-3 h-3" />
              Get escape plan →
            </Link>
            <Link
              href={`/negotiate/${documentId}`}
              className="inline-flex items-center gap-1.5 text-[11px] text-blue-400/70 hover:text-blue-400 transition-colors"
            >
              <MessageSquare className="w-3 h-3" />
              Negotiate →
            </Link>
          </>
        )}
      </div>
    </motion.div>
  );
}
