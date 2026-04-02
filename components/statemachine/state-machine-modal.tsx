"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, Zap, Route, Clock, Code, AlertTriangle, Shield, ChevronDown } from "lucide-react";
import { StateGraph } from "./state-graph";
import { TrapStateCard } from "./trap-state-card";
import { TimelineSlider } from "./timeline-slider";
import type { StateMachineReport, StatePath, SafetyLevel } from "@/lib/statemachine/types";

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

const SAFETY_CONFIG: Record<SafetyLevel, { color: string; bg: string; border: string; label: string }> = {
  safe: { color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", label: "Safe" },
  moderate: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Moderate Risk" },
  dangerous: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", label: "Dangerous" },
  critical: { color: "text-red-500", bg: "bg-red-500/15", border: "border-red-500/30", label: "Critical" },
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

export function StateMachineModal({
  report,
  isOpen,
  onClose,
  documentId,
}: StateMachineModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [graphMode, setGraphMode] = useState<"explore" | "simulate" | "path">("explore");
  const [selectedPath, setSelectedPath] = useState<StatePath | null>(null);
  const [dataExpanded, setDataExpanded] = useState(false);

  const sm = report.stateMachine;
  const safety = SAFETY_CONFIG[report.overallSafety];

  // Build selectable paths list
  const selectablePaths = useMemo(() => {
    const paths: Array<{ label: string; path: StatePath }> = [];
    if (report.pathAnalysis.optimalPath) {
      paths.push({ label: "✅ Optimal (Safest) Path", path: report.pathAnalysis.optimalPath });
    }
    if (report.pathAnalysis.worstPath) {
      paths.push({ label: "❌ Worst (Riskiest) Path", path: report.pathAnalysis.worstPath });
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
    return Math.max(24, Math.max(...report.timelineEvents.map((e) => e.month)) + 3);
  }, [report.timelineEvents]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-slate-950 border border-white/10 rounded-2xl w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── HEADER ── */}
          <div className="flex items-center justify-between px-4 sm:px-4 md:px-6 py-3 border-b border-white/5 flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-lg">🔄</span>
              <div>
                <h2 className="font-semibold text-sm sm:text-base">Trap Detector</h2>
                <p className="text-xs text-slate-400">
                  {sm.metadata.totalStates} states · {sm.metadata.totalTransitions} transitions · {report.trapAnalysis.length} traps
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Mode buttons */}
              {(["explore", "simulate", "path"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setGraphMode(m); if (m !== "path") setSelectedPath(null); }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${ graphMode === m ? "bg-indigo-500/20 text-blue-300 border border-blue-500/30" : "bg-white dark:bg-card/[0.03] text-slate-400 border border-white/5 hover:text-slate-200" }`}
                >
                  {m === "explore" ? "Explore" : m === "simulate" ? "Simulate" : "Paths"}
                </button>
              ))}
              <button onClick={onClose} className="p-1.5 hover:bg-white dark:bg-card/10 rounded-xl transition-colors ml-2">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── GRAPH AREA ── */}
          <div className="flex-1 min-h-0 relative" style={{ maxHeight: "55%" }}>
            <StateGraph
              stateMachine={sm}
              report={report}
              mode={graphMode}
              selectedPath={selectedPath || undefined}
              className="h-full"
            />
          </div>

          {/* ── TABS ── */}
          <div className="border-t border-white/5 flex-shrink-0">
            <div className="flex gap-0 overflow-x-auto border-b border-white/5">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-all border-b-2 ${ activeTab === tab.id ? "border-blue-400 text-blue-300" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-300" }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                    {tab.id === "traps" && report.trapAnalysis.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-400">
                        {report.trapAnalysis.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── TAB CONTENT ── */}
            <div className="overflow-y-auto p-6 sm:p-6" style={{ maxHeight: "40vh" }}>
              {/* OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-4">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${safety.bg} ${safety.border} border`}>
                    <Shield className={`h-4 w-4 ${safety.color}`} />
                    <span className={`text-sm font-semibold ${safety.color}`}>{safety.label}</span>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed">{report.summary}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "States", value: sm.metadata.totalStates, color: "text-blue-400" },
                      { label: "Transitions", value: sm.metadata.totalTransitions, color: "text-cyan-400" },
                      { label: "Traps", value: report.trapAnalysis.length, color: report.trapAnalysis.length > 0 ? "text-red-400" : "text-green-400" },
                      { label: "Confidence", value: `${Math.round(sm.metadata.confidence * 100)}%`, color: "text-slate-300" },
                    ].map((stat) => (
                      <div key={stat.label} className="p-3 rounded-xl bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 border-l-4 border-indigo-500 border border-white/5 text-center">
                        <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {report.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-300 mb-2">Recommendations</h4>
                      <ul className="space-y-1.5">
                        {report.recommendations.map((rec, i) => (
                          <li key={i} className="text-xs text-slate-400 flex gap-2">
                            <span className="text-amber-400 flex-shrink-0">•</span>
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
                    <div className="text-center py-8">
                      <span className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl">✅</span>
                      <p className="text-sm text-green-400 mt-2 font-medium">No trap states detected</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">This contract has safe exits from every state.</p>
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
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No paths available to visualize.</p>
                  ) : (
                    <>
                      <select
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200"
                        value={selectedPath ? selectablePaths.findIndex((sp) => sp.path === selectedPath) : ""}
                        onChange={(e) => {
                          const idx = parseInt(e.target.value);
                          if (!isNaN(idx) && selectablePaths[idx]) {
                            setSelectedPath(selectablePaths[idx].path);
                            setGraphMode("path");
                          }
                        }}
                      >
                        <option value="">Select a path to visualize...</option>
                        {selectablePaths.map((sp, i) => (
                          <option key={i} value={i}>{sp.label}</option>
                        ))}
                      </select>

                      {selectedPath && (
                        <div className="p-6 rounded-xl bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 border-l-4 border-indigo-500 border border-white/5 space-y-3">
                          <div className="flex flex-wrap gap-1 items-center">
                            {selectedPath.states.map((sid, i) => {
                              const st = sm.states.find((s) => s.id === sid);
                              if (!st) return null;
                              return (
                                <span key={`${sid}-${i}`} className="flex items-center gap-1">
                                  {i > 0 && <span className="text-slate-600 dark:text-slate-400 text-xs">→</span>}
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-white dark:bg-slate-900/5 border border-white/10 text-slate-300">
                                    {st.name}
                                  </span>
                                </span>
                              );
                            })}
                          </div>
                          {selectedPath.totalDuration && (
                            <p className="text-xs text-slate-400">⏱ Duration: {selectedPath.totalDuration.value} {selectedPath.totalDuration.unit}</p>
                          )}
                          {selectedPath.totalFinancialImpact && (
                            <p className="text-xs text-amber-400">💰 Financial: {selectedPath.totalFinancialImpact}</p>
                          )}
                          <p className="text-xs text-slate-400">📊 Probability: {selectedPath.probability}</p>
                        </div>
                      )}

                      {/* Asymmetries */}
                      {report.pathAnalysis.asymmetries.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-xs font-semibold text-slate-300 mb-2">⚖️ Power Asymmetries</h4>
                          <div className="space-y-2">
                            {report.pathAnalysis.asymmetries.map((a, i) => (
                              <div key={i} className={`text-xs p-2 rounded-xl border ${
                                a.severity === "high" ? "bg-red-500/5 border-red-500/20 text-red-300" :
                                a.severity === "medium" ? "bg-amber-500/5 border-amber-500/20 text-amber-300" :
                                "bg-slate-500/5 border-slate-500/20 text-slate-300"
                              }`}>
                                {a.description} (favors {a.favoredParty})
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
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No timeline data available.</p>
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
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">State machine JSON data</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(report, null, 2));
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Copy to clipboard
                    </button>
                  </div>
                  <button
                    onClick={() => setDataExpanded(!dataExpanded)}
                    className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200"
                  >
                    <ChevronDown className={`h-3 w-3 transition-transform ${dataExpanded ? "rotate-180" : ""}`} />
                    {dataExpanded ? "Collapse" : "Expand"} JSON
                  </button>
                  {dataExpanded && (
                    <pre className="text-[10px] text-slate-400 bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 p-6 rounded-xl overflow-auto max-h-[50vh] border border-white/5">
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
