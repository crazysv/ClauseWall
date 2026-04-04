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
    color: "text-green-900",
    bg: "bg-green-100",
    border: "border-green-800",
    label: "Safe",
  },
  moderate: {
    color: "text-amber-900",
    bg: "bg-amber-100",
    border: "border-amber-800",
    label: "Moderate Risk",
  },
  dangerous: {
    color: "text-red-900",
    bg: "bg-red-200",
    border: "border-red-900",
    label: "Dangerous",
  },
  critical: {
    color: "text-red-900",
    bg: "bg-red-400",
    border: "border-red-900",
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
        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-white border-4 border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── HEADER ── */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b-4 border-black bg-gray-100 flex-shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-3xl bg-white border-2 border-black p-1">
                🔄
              </span>
              <div>
                <h2 className="font-black text-lg uppercase tracking-widest text-black">
                  Trap Detector
                </h2>
                <p className="text-xs font-bold text-black/60 uppercase tracking-widest mt-1">
                  {sm.metadata.totalStates} states ·{" "}
                  {sm.metadata.totalTransitions} transitions ·{" "}
                  {report.trapAnalysis.length} traps
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Mode buttons */}
              {(["explore", "simulate", "path"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setGraphMode(m);
                    if (m !== "path") setSelectedPath(null);
                  }}
                  className={`px-3 py-2 text-xs font-black uppercase tracking-widest border-2 transition-all ${
                    graphMode === m
                      ? "bg-black text-white border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] translate-y-0.5 shadow-none"
                      : "bg-white text-black border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none"
                  }`}
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
                className="p-2 bg-white text-black border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all ml-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* ── GRAPH AREA ── */}
          <div
            className="flex-1 min-h-0 relative bg-gray-50 border-b-4 border-black"
            style={{ maxHeight: "55%" }}
          >
            <StateGraph
              stateMachine={sm}
              report={report}
              mode={graphMode}
              selectedPath={selectedPath || undefined}
              className="h-full border-0 !rounded-none"
            />
          </div>

          {/* ── TABS ── */}
          <div className="flex-shrink-0 bg-white">
            <div className="flex gap-0 overflow-x-auto border-b-4 border-black bg-gray-100">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border-r-4 border-black border-b-4 -mb-1 ${
                      activeTab === tab.id
                        ? "bg-white text-black border-b-white"
                        : "bg-gray-100 text-black/60 border-b-transparent hover:bg-gray-200"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {tab.id === "traps" && report.trapAnalysis.length > 0 && (
                      <span className="px-2 py-0.5 text-[10px] bg-red-500 text-white border-2 border-black ml-1">
                        {report.trapAnalysis.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── TAB CONTENT ── */}
            <div
              className="overflow-y-auto p-4 sm:p-6 bg-white"
              style={{ maxHeight: "40vh" }}
            >
              {/* OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div
                    className={`inline-flex items-center gap-2 px-4 py-2 border-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] ${safety.bg} ${safety.border}`}
                  >
                    <Shield className={`h-5 w-5 ${safety.color}`} />
                    <span
                      className={`text-sm font-black uppercase tracking-widest ${safety.color}`}
                    >
                      {safety.label}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-black leading-relaxed bg-gray-100 p-4 border-4 border-black">
                    {report.summary}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      {
                        label: "States",
                        value: sm.metadata.totalStates,
                        color: "text-blue-900",
                        bg: "bg-blue-100",
                        border: "border-blue-900",
                      },
                      {
                        label: "Transitions",
                        value: sm.metadata.totalTransitions,
                        color: "text-cyan-900",
                        bg: "bg-cyan-100",
                        border: "border-cyan-900",
                      },
                      {
                        label: "Traps",
                        value: report.trapAnalysis.length,
                        color:
                          report.trapAnalysis.length > 0
                            ? "text-red-900"
                            : "text-green-900",
                        bg:
                          report.trapAnalysis.length > 0
                            ? "bg-red-100"
                            : "bg-green-100",
                        border:
                          report.trapAnalysis.length > 0
                            ? "border-red-900"
                            : "border-green-800",
                      },
                      {
                        label: "Confidence",
                        value: `${Math.round(sm.metadata.confidence * 100)}%`,
                        color: "text-gray-900",
                        bg: "bg-gray-100",
                        border: "border-gray-900",
                      },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className={`p-4 border-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] ${stat.bg} ${stat.border}`}
                      >
                        <p className={`text-2xl font-black ${stat.color}`}>
                          {stat.value}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-black/60 mt-1">
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {report.recommendations.length > 0 && (
                    <div className="pt-4 border-t-4 border-black border-dashed">
                      <h4 className="text-xs font-black uppercase tracking-widest text-black mb-3">
                        Recommendations
                      </h4>
                      <ul className="space-y-2">
                        {report.recommendations.map((rec, i) => (
                          <li
                            key={i}
                            className="text-sm font-bold text-black flex gap-3 bg-yellow-50 p-3 border-2 border-black"
                          >
                            <span className="text-xl flex-shrink-0">💡</span>
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
                <div className="space-y-4">
                  {report.trapAnalysis.length === 0 ? (
                    <div className="text-center py-10 bg-green-50 border-4 border-green-800 shadow-[6px_6px_0_0_rgba(22,101,52,1)]">
                      <span className="text-5xl">✅</span>
                      <p className="text-lg text-green-900 mt-4 font-black uppercase tracking-widest">
                        No trap states detected
                      </p>
                      <p className="text-sm font-bold text-green-800 mt-2">
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
                <div className="space-y-6">
                  {selectablePaths.length === 0 ? (
                    <p className="text-sm font-bold text-black/60 text-center py-8 border-4 border-black border-dashed">
                      No paths available to visualize.
                    </p>
                  ) : (
                    <>
                      <select
                        className="w-full bg-white border-4 border-black p-3 text-sm font-black uppercase tracking-widest text-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] focus:outline-none appearance-none cursor-pointer"
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
                        <div className="p-5 bg-gray-100 border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] space-y-4">
                          <div className="flex flex-wrap gap-2 items-center">
                            {selectedPath.states.map((sid, i) => {
                              const st = sm.states.find((s) => s.id === sid);
                              if (!st) return null;
                              return (
                                <span
                                  key={`${sid}-${i}`}
                                  className="flex items-center gap-2"
                                >
                                  {i > 0 && (
                                    <span className="text-black font-black">
                                      →
                                    </span>
                                  )}
                                  <span className="text-xs font-black uppercase tracking-widest px-2 py-1 bg-white border-2 border-black text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                                    {st.name}
                                  </span>
                                </span>
                              );
                            })}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t-2 border-black border-dashed">
                            {selectedPath.totalDuration && (
                              <div className="bg-white border-2 border-black p-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-1">
                                  Duration
                                </p>
                                <p className="text-xs font-bold text-black">
                                  {selectedPath.totalDuration.value}{" "}
                                  {selectedPath.totalDuration.unit}
                                </p>
                              </div>
                            )}
                            {selectedPath.totalFinancialImpact && (
                              <div className="bg-red-50 border-2 border-red-900 p-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-red-900/60 mb-1">
                                  Financial Impact
                                </p>
                                <p className="text-xs font-bold text-red-900">
                                  {selectedPath.totalFinancialImpact}
                                </p>
                              </div>
                            )}
                            <div className="bg-white border-2 border-black p-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-1">
                                Probability
                              </p>
                              <p className="text-xs font-bold text-black">
                                {selectedPath.probability}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Asymmetries */}
                      {report.pathAnalysis.asymmetries.length > 0 && (
                        <div className="mt-6 pt-6 border-t-4 border-black border-dashed">
                          <h4 className="text-sm font-black uppercase tracking-widest text-black mb-4">
                            ⚖️ Power Asymmetries
                          </h4>
                          <div className="space-y-3">
                            {report.pathAnalysis.asymmetries.map((a, i) => (
                              <div
                                key={i}
                                className={`text-sm font-bold p-4 border-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] ${
                                  a.severity === "high"
                                    ? "bg-red-100 border-red-900 text-red-900"
                                    : a.severity === "medium"
                                      ? "bg-yellow-100 border-yellow-600 text-yellow-900"
                                      : "bg-gray-100 border-gray-500 text-black"
                                }`}
                              >
                                <span className="font-black uppercase tracking-widest block mb-1">
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
                    <p className="text-sm font-bold text-black/60 text-center py-8 border-4 border-black border-dashed">
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
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-gray-100 border-4 border-black p-3">
                    <p className="text-xs font-black uppercase tracking-widest text-black">
                      State machine JSON data
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          JSON.stringify(report, null, 2),
                        );
                      }}
                      className="text-xs font-black uppercase tracking-widest text-black bg-white border-2 border-black px-3 py-1 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all"
                    >
                      Copy to clipboard
                    </button>
                  </div>
                  <button
                    onClick={() => setDataExpanded(!dataExpanded)}
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-black border-2 border-black p-2 w-full justify-center hover:bg-black hover:text-white transition-colors"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${dataExpanded ? "rotate-180" : ""}`}
                    />
                    {dataExpanded ? "Collapse" : "Expand"} JSON
                  </button>
                  {dataExpanded && (
                    <pre className="text-xs font-mono text-black bg-gray-50 p-4 border-4 border-black overflow-auto max-h-[50vh] shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.05)]">
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
