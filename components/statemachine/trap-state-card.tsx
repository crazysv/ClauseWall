"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ChevronDown,
  ExternalLink,
  AlertTriangle,
  DoorOpen,
  MessageSquare,
} from "lucide-react";
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

const SEVERITY_STYLES: Record<TrapSeverity, { badge: string; border: string }> =
  {
    critical: {
      badge: "bg-red-950/30 text-red-400 border-red-900/50 border",
      border: "border-l-red-500 border-l-2",
    },
    high: {
      badge: "bg-amber-950/20 text-amber-400 border-amber-900/50 border",
      border: "border-l-amber-500 border-l-2",
    },
    medium: {
      badge: "bg-amber-950/10 text-amber-300 border-amber-900/30 border",
      border: "border-l-amber-400 border-l-2",
    },
  };

export default function TrapStateCard({
  trap,
  stateMachine,
  onHighlightPath,
  documentId,
}: TrapStateCardProps) {
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
              {i > 0 && <span className="font-mono text-neutral-600">→</span>}
              <span
                className={`flex items-center gap-1.5 text-[7px] font-mono uppercase tracking-widest px-1.5 py-0.5 border ${
                  isTrap
                    ? "bg-red-950/20 border-red-900/50 text-red-400"
                    : "bg-[#050505] border-neutral-800 text-neutral-400"
                }`}
              >
                <span
                  className="w-2 h-2 flex-shrink-0"
                  style={{
                    backgroundColor: isTrap
                      ? "#ef4444"
                      : st.type === "terminal_safe"
                        ? "#22c55e"
                        : st.type === "terminal_loss"
                          ? "#ef4444"
                          : st.type === "dangerous"
                            ? "#f97316"
                            : st.type === "restricted"
                              ? "#f59e0b"
                              : "#10b981",
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
      className={`bg-[#0a0a0a] border border-neutral-900 ${style.border}`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-lg bg-red-950/20 border border-red-900/50 p-1">
              💀
            </span>
            <h4 className="text-[9px] font-mono uppercase tracking-widest text-neutral-200">
              TRAP: {trap.stateName}
            </h4>
          </div>
          <span
            className={`text-[7px] px-1.5 py-0.5 font-mono uppercase tracking-widest ${style.badge}`}
          >
            {trap.severity}
          </span>
        </div>

        {/* Trap type */}
        <div className="text-[8px] font-mono text-neutral-400 bg-[#050505] border border-neutral-800 p-3 mb-3 leading-relaxed">
          <span className="text-neutral-500 uppercase tracking-widest border-b border-neutral-700 pb-0.5">
            TYPE: {trap.trapType.replace(/_/g, " ")}
          </span>
          <br />
          {trap.description.substring(0, 120)}
          {trap.description.length > 120 ? "…" : ""}
        </div>

        {/* Path leading here */}
        {trap.pathsLeadingHere.length > 0 && (
          <div className="mb-3 bg-[#050505] border border-neutral-800 p-3">
            <p className="text-[7px] text-neutral-500 font-mono uppercase tracking-widest mb-1">
              How you get trapped:
            </p>
            {renderInlinePath(trap.pathsLeadingHere[0])}
          </div>
        )}

        {/* Financial impact */}
        <div className="flex items-center gap-2 text-[8px] font-mono uppercase tracking-widest text-red-400 bg-red-950/10 border border-red-900/50 px-2.5 py-1.5 mb-3 inline-flex">
          <span>💰</span>
          <span>Financial Impact: {trap.financialImpact}</span>
        </div>

        {/* Expand/collapse */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-center gap-2 text-[7px] font-mono uppercase tracking-widest text-neutral-500 border border-neutral-800 bg-[#050505] p-2 w-full hover:text-neutral-200 hover:border-neutral-600 transition-colors"
        >
          <ChevronDown
            className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
          {expanded ? "Less details" : "More details"}
        </button>

        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-3 pt-3 border-t border-dashed border-neutral-800"
          >
            {/* Fair alternative */}
            <div className="p-3 bg-emerald-950/10 border-l-2 border-emerald-500">
              <p className="text-[7px] text-emerald-400 font-mono uppercase tracking-widest mb-1 border-b border-emerald-900/30 pb-1">
                Fair Alternative:
              </p>
              <p className="text-[8px] font-mono text-neutral-400 leading-relaxed pt-1">
                {trap.fairAlternative}
              </p>
            </div>

            {/* Legal issue */}
            {trap.legalIssue && (
              <div className="flex items-start gap-2 text-[8px] font-mono bg-cyan-950/10 p-3 border-l-2 border-cyan-500">
                <span className="flex-shrink-0 text-base">⚖️</span>
                <p className="text-neutral-400 leading-relaxed">{trap.legalIssue}</p>
              </div>
            )}

            {/* Related clauses */}
            {trap.relatedClauses.length > 0 && (
              <p className="text-[8px] font-mono text-neutral-400 border border-neutral-800 p-2 bg-[#050505]">
                <span className="text-neutral-500 uppercase tracking-widest">
                  Related clauses:
                </span>{" "}
                {trap.relatedClauses.join(", ")}
              </p>
            )}

            {/* Escape paths */}
            {hasEscapes ? (
              <div className="border border-cyan-900/50 bg-cyan-950/10 p-3">
                <p className="text-[7px] text-cyan-400 font-mono uppercase tracking-widest mb-2 border-b border-cyan-900/30 pb-1">
                  Escape paths:
                </p>
                {trap.outgoingPaths.slice(0, 2).map((path, i) => (
                  <div
                    key={i}
                    className="bg-[#050505] p-2 border border-neutral-800 mb-2 last:mb-0"
                  >
                    {renderInlinePath(path)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-red-950/20 border border-red-900/50">
                <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
                <p className="text-[8px] font-mono uppercase tracking-widest text-red-400">
                  No escape paths — absolute trap
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-[#050505] border-t border-neutral-800">
        {trap.pathsLeadingHere.length > 0 && onHighlightPath && (
          <button
            onClick={() => onHighlightPath(trap.pathsLeadingHere[0])}
            className="text-[7px] font-mono uppercase tracking-widest text-neutral-500 bg-[#0a0a0a] border border-neutral-800 px-2 py-1 hover:text-neutral-200 hover:border-neutral-600 transition-colors flex items-center gap-1"
          >
            <ExternalLink className="h-2.5 w-2.5" />
            Highlight on Graph
          </button>
        )}

        {/* Cross-links */}
        {documentId && (
          <>
            <Link
              href={`/escape/${documentId}`}
              className="inline-flex items-center gap-1 text-[7px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-950/10 border border-emerald-900/50 px-2 py-1 hover:text-emerald-300 hover:border-emerald-800 transition-colors"
            >
              <DoorOpen className="w-2.5 h-2.5" />
              Get escape plan →
            </Link>
            <Link
              href={`/negotiate/${documentId}`}
              className="inline-flex items-center gap-1 text-[7px] font-mono uppercase tracking-widest text-cyan-400 bg-cyan-950/10 border border-cyan-900/50 px-2 py-1 hover:text-cyan-300 hover:border-cyan-800 transition-colors"
            >
              <MessageSquare className="w-2.5 h-2.5" />
              Negotiate →
            </Link>
          </>
        )}
      </div>
    </motion.div>
  );
}
