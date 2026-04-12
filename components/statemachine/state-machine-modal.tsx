"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Eye,
  Zap,
  Route,
  Clock,
  Code,
  AlertTriangle,
  Shield,
  ChevronDown,
} from "lucide-react";
import StateGraph from "./state-graph";
import TrapStateCard from "./trap-state-card";
import TimelineSlider from "./timeline-slider";
import type {
  StateMachineReport,
  StatePath,
  SafetyLevel,
} from "@/lib/statemachine/types";

// ============================================
// PROPS
// ============================================

interface StateMachineModalProps {
  report: StateMachineReport;
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
}

// ============================================
// SAFETY BADGE
// ============================================

const SAFETY_CONFIG: Record<
  SafetyLevel,
  { color: string; bg: string; border: string; label: string }
> = {
  safe: {
    color: "text-emerald-400",
    bg: "bg-emerald-950/20",
    border: "border-emerald-900/50",
    label: "Safe",
  },
  moderate: {
    color: "text-amber-400",
    bg: "bg-amber-950/20",
    border: "border-amber-900/50",
    label: "Moderate Risk",
  },
  dangerous: {
    color: "text-red-400",
    bg: "bg-red-950/20",
    border: "border-red-900/50",
    label: "Dangerous",
  },
  critical: {
    color: "text-red-400",
    bg: "bg-red-950/30",
    border: "border-red-500/50",
    label: "Critical",
  },
};

// ============================================
// TABS
// ============================================

type TabId = "overview" | "traps" | "paths" | "timeline" | "data";

const TABS: Array<{ id: TabId; label: string; icon: typeof Eye }> = [
  { id: "overview", label: "Overview", icon: Eye },
  { id: "traps", label: "Trap States", icon: AlertTriangle },
  { id: "paths", label: "Paths", icon: Route },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "data", label: "Raw Data", icon: Code },
];

// ============================================
// COMPONENT
// ============================================

export default function StateMachineModal({
  report,
  isOpen,
  onClose,
  documentId,
}: StateMachineModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [graphMode, setGraphMode] = useState<"explore" | "simulate" | "path">(
    "explore",
  );
  const [selectedPath, setSelectedPath] = useState<StatePath | null>(null);
  const [dataExpanded, setDataExpanded] = useState(false);

  const sm = report.stateMachine;
  const safety = SAFETY_CONFIG[report.overallSafety];

  // Build selectable paths list
  const selectablePaths = useMemo(() => {
    const paths: Array<{ label: string; path: StatePath }> = [];
    if (report.pathAnalysis.optimalPath) {
      paths.push({
        label: "✅ Optimal (Safest) Path",
        path: report.pathAnalysis.optimalPath,
      });
    }
    if (report.pathAnalysis.worstPath) {
      paths.push({
        label: "❌ Worst (Riskiest) Path",
        path: report.pathAnalysis.worstPath,
      });
    }
    report.pathAnalysis.escapePaths.forEach((p, i) => {
      paths.push({ label: `🚪 Escape Path ${i + 1}`, path: p });
    });
    report.pathAnalysis.trapPaths.forEach((p, i) => {
      paths.push({ label: `🪤 Trap Path ${i + 1}`, path: p });
    });
    return paths;
  }, [report.pathAnalysis]);

  // Total months for timeline
  const totalMonths = useMemo(() => {
    if (report.timelineEvents.length === 0) return 24;
    return Math.max(
      24,
      Math.max(...report.timelineEvents.map((e) => e.month)) + 3,
    );
  }, [report.timelineEvents]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-2 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-[#0a0a0a] border border-neutral-800 w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── HEADER ── */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-neutral-800 flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-2xl bg-[#050505] border border-neutral-800 p-1">
                🔄
              </span>
              <div>
                <h2 className="text-[10px] font-mono uppercase tracking-widest text-neutral-200">
                  Trap Detector
                </h2>
                <p className="text-[7px] font-mono text-neutral-600 uppercase tracking-widest mt-0.5">
                  {sm.metadata.totalStates} states ·{" "}
                  {sm.metadata.totalTransitions} transitions ·{" "}
                  {report.trapAnalysis.length} traps
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Mode buttons */}
              {(["explore", "simulate", "path"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setGraphMode(m);
                    if (m !== "path") setSelectedPath(null);
                  }}
                  className={`px-2 py-1.5 text-[7px] font-mono uppercase tracking-widest border transition-colors ${graphMode === m ? "bg-amber-950/20 text-amber-400 border-amber-900/50" : "bg-[#050505] text-neutral-600 border-neutral-800 hover:text-neutral-400 hover:border-neutral-600"}`}
                >
                  {m === "explore"
                    ? "Explore"
                    : m === "simulate"
                      ? "Simulate"
                      : "Paths"}
                </button>
              ))}
              <button
                onClick={onClose}
                className="p-1.5 bg-[#050505] text-neutral-500 border border-neutral-800 hover:border-neutral-600 hover:text-neutral-300 transition-colors ml-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* ── GRAPH AREA ── */}
          <div
            className="flex-1 min-h-0 relative border-b border-neutral-800"
            style={{ maxHeight: "55%" }}
          >
            <StateGraph
              stateMachine={sm}
              report={report}
              mode={graphMode}
              selectedPath={selectedPath || undefined}
              className="h-full border-0"
            />
          </div>

          {/* ── TABS ── */}
          <div className="flex-shrink-0">
            <div className="flex gap-0 overflow-x-auto border-b border-neutral-800">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-[7px] font-mono uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 -mb-px ${activeTab === tab.id ? "text-amber-400 border-amber-400 bg-amber-950/10" : "text-neutral-600 border-transparent hover:text-neutral-400"}`}
                  >
                    <Icon className="h-3 w-3" />
                    {tab.label}
                    {tab.id === "traps" && report.trapAnalysis.length > 0 && (
                      <span className="px-1 py-0 text-[7px] bg-red-950/30 text-red-400 border border-red-900/50 ml-0.5">
                        {report.trapAnalysis.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── TAB CONTENT ── */}
            <div
              className="overflow-y-auto p-4 sm:p-5"
              style={{ maxHeight: "40vh" }}
            >
              {/* OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-4">
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1.5 border ${safety.bg} ${safety.border}`}
                  >
                    <Shield className={`h-3.5 w-3.5 ${safety.color}`} />
                    <span
                      className={`text-[8px] font-mono uppercase tracking-widest ${safety.color}`}
                    >
                      {safety.label}
                    </span>
                  </div>

                  <p className="text-[8px] font-mono text-neutral-400 leading-relaxed bg-[#050505] p-3 border border-neutral-800">
                    {report.summary}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      {
                        label: "States",
                        value: sm.metadata.totalStates,
                        color: "text-cyan-400",
                        bg: "bg-cyan-950/10",
                        border: "border-cyan-900/50",
                      },
                      {
                        label: "Transitions",
                        value: sm.metadata.totalTransitions,
                        color: "text-cyan-400",
                        bg: "bg-cyan-950/10",
                        border: "border-cyan-900/50",
                      },
                      {
                        label: "Traps",
                        value: report.trapAnalysis.length,
                        color:
                          report.trapAnalysis.length > 0
                            ? "text-red-400"
                            : "text-emerald-400",
                        bg:
                          report.trapAnalysis.length > 0
                            ? "bg-red-950/10"
                            : "bg-emerald-950/10",
                        border:
                          report.trapAnalysis.length > 0
                            ? "border-red-900/50"
                            : "border-emerald-900/50",
                      },
                      {
                        label: "Confidence",
                        value: `${Math.round(sm.metadata.confidence * 100)}%`,
                        color: "text-neutral-400",
                        bg: "bg-[#050505]",
                        border: "border-neutral-800",
                      },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className={`p-3 border ${stat.bg} ${stat.border}`}
                      >
                        <p className={`text-lg font-mono tabular-nums ${stat.color}`}>
                          {stat.value}
                        </p>
                        <p className="text-[7px] font-mono uppercase tracking-widest text-neutral-600 mt-1">
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {report.recommendations.length > 0 && (
                    <div className="pt-3 border-t border-dashed border-neutral-800">
                      <h4 className="text-[8px] font-mono uppercase tracking-widest text-neutral-400 mb-2">
                        Recommendations
                      </h4>
                      <ul className="space-y-1.5">
                        {report.recommendations.map((rec, i) => (
                          <li
                            key={i}
                            className="text-[8px] font-mono text-neutral-400 flex gap-2 bg-amber-950/5 p-2 border border-neutral-800 leading-relaxed"
                          >
                            <span className="text-sm flex-shrink-0">💡</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* TRAP STATES */}
              {activeTab === "traps" && (
                <div className="space-y-3">
                  {report.trapAnalysis.length === 0 ? (
                    <div className="text-center py-10 bg-emerald-950/10 border border-emerald-900/50">
                      <span className="text-4xl">✅</span>
                      <p className="text-[9px] text-emerald-400 mt-3 font-mono uppercase tracking-widest">
                        No trap states detected
                      </p>
                      <p className="text-[8px] font-mono text-neutral-500 mt-1">
                        This contract has safe exits from every state.
                      </p>
                    </div>
                  ) : (
                    report.trapAnalysis.map((trap) => (
                      <TrapStateCard
                        key={trap.stateId}
                        trap={trap}
                        stateMachine={sm}
                        documentId={documentId}
                        onHighlightPath={(path) => {
                          setSelectedPath(path);
                          setGraphMode("path");
                        }}
                      />
                    ))
                  )}
                </div>
              )}

              {/* PATHS */}
              {activeTab === "paths" && (
                <div className="space-y-4">
                  {selectablePaths.length === 0 ? (
                    <p className="text-[8px] font-mono text-neutral-600 text-center py-8 border border-dashed border-neutral-800">
                      No paths available to visualize.
                    </p>
                  ) : (
                    <>
                      <select
                        className="w-full bg-[#050505] border border-neutral-800 p-2.5 text-[8px] font-mono uppercase tracking-widest text-neutral-400 focus:outline-none focus:border-neutral-600 appearance-none cursor-pointer"
                        value={
                          selectedPath
                            ? selectablePaths.findIndex(
                                (sp) => sp.path === selectedPath,
                              )
                            : ""
                        }
                        onChange={(e) => {
                          const idx = parseInt(e.target.value);
                          if (!isNaN(idx) && selectablePaths[idx]) {
                            setSelectedPath(selectablePaths[idx].path);
                            setGraphMode("path");
                          }
                        }}
                      >
                        <option value="">
                          -- SELECT A PATH TO VISUALIZE --
                        </option>
                        {selectablePaths.map((sp, i) => (
                          <option key={i} value={i}>
                            {sp.label}
                          </option>
                        ))}
                      </select>

                      {selectedPath && (
                        <div className="p-4 bg-[#050505] border border-neutral-800 space-y-3">
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {selectedPath.states.map((sid, i) => {
                              const st = sm.states.find((s) => s.id === sid);
                              if (!st) return null;
                              return (
                                <span
                                  key={`${sid}-${i}`}
                                  className="flex items-center gap-1.5"
                                >
                                  {i > 0 && (
                                    <span className="text-neutral-600 font-mono">
                                      →
                                    </span>
                                  )}
                                  <span className="text-[7px] font-mono uppercase tracking-widest px-1.5 py-0.5 bg-[#0a0a0a] border border-neutral-800 text-neutral-400">
                                    {st.name}
                                  </span>
                                </span>
                              );
                            })}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-dashed border-neutral-800">
                            {selectedPath.totalDuration && (
                              <div className="bg-[#0a0a0a] border border-neutral-800 p-2">
                                <p className="text-[7px] font-mono uppercase tracking-widest text-neutral-600 mb-0.5">
                                  Duration
                                </p>
                                <p className="text-[8px] font-mono text-neutral-400">
                                  {selectedPath.totalDuration.value}{" "}
                                  {selectedPath.totalDuration.unit}
                                </p>
                              </div>
                            )}
                            {selectedPath.totalFinancialImpact && (
                              <div className="bg-red-950/10 border border-red-900/50 p-2">
                                <p className="text-[7px] font-mono uppercase tracking-widest text-red-400/60 mb-0.5">
                                  Financial Impact
                                </p>
                                <p className="text-[8px] font-mono text-red-400">
                                  {selectedPath.totalFinancialImpact}
                                </p>
                              </div>
                            )}
                            <div className="bg-[#0a0a0a] border border-neutral-800 p-2">
                              <p className="text-[7px] font-mono uppercase tracking-widest text-neutral-600 mb-0.5">
                                Probability
                              </p>
                              <p className="text-[8px] font-mono text-neutral-400">
                                {selectedPath.probability}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Asymmetries */}
                      {report.pathAnalysis.asymmetries.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-dashed border-neutral-800">
                          <h4 className="text-[8px] font-mono uppercase tracking-widest text-neutral-400 mb-3">
                            ⚖️ Power Asymmetries
                          </h4>
                          <div className="space-y-2">
                            {report.pathAnalysis.asymmetries.map((a, i) => (
                              <div
                                key={i}
                                className={`text-[8px] font-mono p-3 border leading-relaxed ${a.severity === "high" ? "bg-red-950/10 border-red-900/50 text-red-400" : a.severity === "medium" ? "bg-amber-950/10 border-amber-900/50 text-amber-400" : "bg-[#050505] border-neutral-800 text-neutral-400"}`}
                              >
                                <span className="uppercase tracking-widest block mb-1 text-[7px]">
                                  Favors {a.favoredParty}
                                </span>
                                {a.description}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* TIMELINE */}
              {activeTab === "timeline" && (
                <div>
                  {report.timelineEvents.length === 0 ? (
                    <p className="text-[8px] font-mono text-neutral-600 text-center py-8 border border-dashed border-neutral-800">
                      No timeline data available.
                    </p>
                  ) : (
                    <TimelineSlider
                      events={report.timelineEvents}
                      totalMonths={totalMonths}
                      stateMachine={sm}
                    />
                  )}
                </div>
              )}

              {/* RAW DATA */}
              {activeTab === "data" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-[#050505] border border-neutral-800 p-2.5">
                    <p className="text-[7px] font-mono uppercase tracking-widest text-neutral-500">
                      State machine JSON data
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          JSON.stringify(report, null, 2),
                        );
                      }}
                      className="text-[7px] font-mono uppercase tracking-widest text-neutral-400 bg-[#0a0a0a] border border-neutral-800 px-2 py-1 hover:text-neutral-200 hover:border-neutral-600 transition-colors"
                    >
                      Copy to clipboard
                    </button>
                  </div>
                  <button
                    onClick={() => setDataExpanded(!dataExpanded)}
                    className="flex items-center gap-2 text-[7px] font-mono uppercase tracking-widest text-neutral-500 border border-neutral-800 p-2 w-full justify-center hover:text-neutral-300 hover:border-neutral-600 transition-colors"
                  >
                    <ChevronDown
                      className={`h-3 w-3 transition-transform ${dataExpanded ? "rotate-180" : ""}`}
                    />
                    {dataExpanded ? "Collapse" : "Expand"} JSON
                  </button>
                  {dataExpanded && (
                    <pre className="text-[8px] font-mono text-neutral-500 bg-[#050505] p-4 border border-neutral-800 overflow-auto max-h-[50vh]">
                      {JSON.stringify(report, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
