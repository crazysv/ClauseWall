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
      badge: "bg-red-200 text-red-900 border-red-900 border-2",
      border: "border-l-red-900 border-l-[8px]",
    },
    high: {
      badge: "bg-orange-200 text-orange-900 border-orange-900 border-2",
      border: "border-l-orange-900 border-l-[8px]",
    },
    medium: {
      badge: "bg-amber-200 text-amber-900 border-amber-900 border-2",
      border: "border-l-amber-500 border-l-[8px]",
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
              {i > 0 && <span className="font-black text-black">→</span>}
              <span
                className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest px-2 py-1 border-2 ${
                  isTrap
                    ? "bg-red-100 border-red-900 text-red-900"
                    : "bg-gray-100 border-black text-black"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 flex-shrink-0 border border-black"
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
      className={`bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${style.border}`}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl bg-red-100 border-2 border-red-900 p-1">
              💀
            </span>
            <h4 className="font-black text-lg uppercase tracking-widest text-black">
              TRAP: {trap.stateName}
            </h4>
          </div>
          <span
            className={`text-xs px-2 py-1 font-black uppercase tracking-widest ${style.badge}`}
          >
            {trap.severity}
          </span>
        </div>

        {/* Trap type */}
        <p className="text-sm font-bold text-black bg-gray-100 border-4 border-black p-3 mb-4 leading-relaxed">
          <span className="font-black uppercase tracking-widest border-b-2 border-black">
            TYPE: {trap.trapType.replace(/_/g, " ")}
          </span>
          <br />
          {trap.description.substring(0, 120)}
          {trap.description.length > 120 ? "…" : ""}
        </p>

        {/* Path leading here */}
        {trap.pathsLeadingHere.length > 0 && (
          <div className="mb-4 bg-gray-50 border-2 border-black p-3 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
            <p className="text-xs text-black font-black uppercase tracking-widest mb-1">
              How you get trapped:
            </p>
            {renderInlinePath(trap.pathsLeadingHere[0])}
          </div>
        )}

        {/* Financial impact */}
        <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-red-900 bg-red-100 border-2 border-red-900 px-3 py-2 mb-4 shadow-[2px_2px_0_0_rgba(127,29,29,1)] inline-flex">
          <span>💰</span>
          <span>Financial Impact: {trap.financialImpact}</span>
        </div>

        {/* Expand/collapse */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-black border-2 border-black p-2 w-full hover:bg-black hover:text-white transition-colors"
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
          {expanded ? "Less details" : "More details"}
        </button>

        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-4 pt-4 border-t-2 border-black border-dashed"
          >
            {/* Fair alternative */}
            <div className="p-3 bg-green-100 border-4 border-green-800 shadow-[4px_4px_0_0_rgba(22,101,52,1)]">
              <p className="text-xs text-green-900 font-black uppercase tracking-widest mb-1 border-b-2 border-green-800 pb-1">
                Fair Alternative:
              </p>
              <p className="text-sm font-bold text-green-900 pt-1">
                {trap.fairAlternative}
              </p>
            </div>

            {/* Legal issue */}
            {trap.legalIssue && (
              <div className="flex items-start gap-2 text-sm bg-blue-100 p-3 border-4 border-blue-900 shadow-[4px_4px_0_0_rgba(30,58,138,1)]">
                <span className="flex-shrink-0 text-xl">⚖️</span>
                <p className="font-bold text-blue-900">{trap.legalIssue}</p>
              </div>
            )}

            {/* Related clauses */}
            {trap.relatedClauses.length > 0 && (
              <p className="text-sm font-bold text-black border-2 border-black p-2 bg-gray-100">
                <span className="font-black uppercase tracking-widest">
                  Related clauses:
                </span>{" "}
                {trap.relatedClauses.join(", ")}
              </p>
            )}

            {/* Escape paths */}
            {hasEscapes ? (
              <div className="border-4 border-blue-900 p-3 shadow-[4px_4px_0_0_rgba(30,58,138,1)]">
                <p className="text-xs text-blue-900 font-black uppercase tracking-widest mb-2 border-b-2 border-blue-900 pb-1">
                  Escape paths:
                </p>
                {trap.outgoingPaths.slice(0, 2).map((path, i) => (
                  <div
                    key={i}
                    className="bg-white p-2 border-2 border-blue-900 mb-2 last:mb-0"
                  >
                    {renderInlinePath(path)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-red-100 border-4 border-red-900 shadow-[4px_4px_0_0_rgba(127,29,29,1)]">
                <AlertTriangle className="h-5 w-5 text-red-900 flex-shrink-0" />
                <p className="text-sm font-black uppercase tracking-widest text-red-900">
                  No escape paths — absolute trap
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 px-5 py-3 bg-gray-100 border-t-4 border-black">
        {trap.pathsLeadingHere.length > 0 && onHighlightPath && (
          <button
            onClick={() => onHighlightPath(trap.pathsLeadingHere[0])}
            className="text-[11px] font-black uppercase tracking-widest text-black bg-white border-2 border-black px-2 py-1 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-1"
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
              className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-emerald-900 bg-emerald-100 border-2 border-emerald-900 px-2 py-1 shadow-[2px_2px_0_0_rgba(6,78,59,1)] hover:translate-y-0.5 hover:shadow-none transition-all"
            >
              <DoorOpen className="w-3 h-3" />
              Get escape plan →
            </Link>
            <Link
              href={`/negotiate/${documentId}`}
              className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-blue-900 bg-blue-100 border-2 border-blue-900 px-2 py-1 shadow-[2px_2px_0_0_rgba(30,58,138,1)] hover:translate-y-0.5 hover:shadow-none transition-all"
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
