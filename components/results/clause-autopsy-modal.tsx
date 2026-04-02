"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  AlertTriangle,
  XCircle,
  Scale,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Scan,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { RiskLevel } from "@/types";

// ── Types ──

interface AutopsyViolation {
  phrase: string;
  severity: RiskLevel;
  issue: string;
  explanation: string;
  statute: string | null;
  penalty: string | null;
}

interface AutopsyResult {
  violations: AutopsyViolation[];
  total_violations: number;
  most_severe: RiskLevel;
  dissection_summary: string;
}

interface DisplaySegment {
  text: string;
  type: "violation" | "neutral";
  violation_index?: number;
}

interface ClauseData {
  id: string;
  clause_number: number;
  original_text: string;
  clause_type: string;
  risk_level: string;
  risk_score: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clause: ClauseData | null;
  jurisdiction: string;
  documentType: string;
}

// ── Helpers ──

const CIRCLED_NUMBERS = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];

const SEVERITY_CONFIG: Record<
  string,
  {
    bg: string;
    border: string;
    text: string;
    borderBottom: string;
    label: string;
    icon: React.ReactNode;
    cardBg: string;
    cardBorder: string;
  }
> = {
  illegal: {
    bg: "bg-indigo-500/15",
    border: "border-indigo-500/30",
    borderBottom: "border-b-purple-500/60",
    text: "text-purple-400",
    label: "ILLEGAL",
    icon: <Scale className="h-3.5 w-3.5 text-purple-400" />,
    cardBg: "bg-indigo-500/5",
    cardBorder: "border-indigo-500/20",
  },
  dangerous: {
    bg: "bg-red-500/15",
    border: "border-red-500/30",
    borderBottom: "border-b-red-500/60",
    text: "text-red-400",
    label: "DANGEROUS",
    icon: <XCircle className="h-3.5 w-3.5 text-red-400" />,
    cardBg: "bg-red-500/5",
    cardBorder: "border-red-500/20",
  },
  warning: {
    bg: "bg-yellow-500/15",
    border: "border-yellow-500/30",
    borderBottom: "border-b-yellow-500/60",
    text: "text-yellow-400",
    label: "WARNING",
    icon: <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />,
    cardBg: "bg-yellow-500/5",
    cardBorder: "border-yellow-500/20",
  },
  safe: {
    bg: "bg-green-500/15",
    border: "border-green-500/30",
    borderBottom: "border-b-green-500/60",
    text: "text-green-400",
    label: "SAFE",
    icon: <Check className="h-3.5 w-3.5 text-green-400" />,
    cardBg: "bg-green-500/5",
    cardBorder: "border-green-500/20",
  },
};

function getSeverityConfig(severity: string) {
  return SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.warning;
}

/**
 * Build display segments by finding violation phrases in original text
 */
function buildSegments(
  originalText: string,
  violations: AutopsyViolation[]
): DisplaySegment[] {
  const segments: DisplaySegment[] = [];
  const lowerText = originalText.toLowerCase();

  // Find positions of each violation phrase
  type Position = { start: number; end: number; violationIndex: number };
  const positions: Position[] = [];
  let searchStart = 0;

  for (let i = 0; i < violations.length; i++) {
    const phraseLower = violations[i].phrase.toLowerCase().trim();
    if (!phraseLower) continue;

    const idx = lowerText.indexOf(phraseLower, searchStart);
    if (idx !== -1) {
      positions.push({
        start: idx,
        end: idx + violations[i].phrase.trim().length,
        violationIndex: i,
      });
      searchStart = idx + violations[i].phrase.trim().length;
    }
  }

  // Sort by position
  positions.sort((a, b) => a.start - b.start);

  // Remove overlaps
  const filtered: Position[] = [];
  for (const pos of positions) {
    const last = filtered[filtered.length - 1];
    if (!last || pos.start >= last.end) {
      filtered.push(pos);
    }
  }

  // Build ordered segments
  let cursor = 0;
  for (const pos of filtered) {
    if (pos.start > cursor) {
      segments.push({
        text: originalText.substring(cursor, pos.start),
        type: "neutral",
      });
    }
    segments.push({
      text: originalText.substring(pos.start, pos.end),
      type: "violation",
      violation_index: pos.violationIndex,
    });
    cursor = pos.end;
  }

  if (cursor < originalText.length) {
    segments.push({
      text: originalText.substring(cursor),
      type: "neutral",
    });
  }

  return segments;
}

// ── Component ──

export function ClauseAutopsyModal({
  isOpen,
  onClose,
  clause,
  jurisdiction,
  documentType,
}: Props) {
  const [result, setResult] = useState<AutopsyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeViolation, setActiveViolation] = useState<number | null>(null);
  const [expandedViolations, setExpandedViolations] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);

  const cache = useRef<Map<string, AutopsyResult>>(new Map());
  const violationRefs = useRef<(HTMLDivElement | null)[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  // Fetch autopsy when modal opens
  useEffect(() => {
    if (isOpen && clause) {
      if (cache.current.has(clause.id)) {
        setResult(cache.current.get(clause.id)!);
        setError("");
        setActiveViolation(null);
        setExpandedViolations(new Set());
      } else {
        fetchAutopsy();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, clause?.id]);

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setActiveViolation(null);
      setExpandedViolations(new Set());
    }
  }, [isOpen]);

  const fetchAutopsy = async () => {
    if (!clause) return;

    setLoading(true);
    setError("");
    setResult(null);
    setActiveViolation(null);
    setExpandedViolations(new Set());

    try {
      const res = await fetch("/api/autopsy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clauseText: clause.original_text,
          clauseType: clause.clause_type,
          jurisdiction,
          documentType,
          riskLevel: clause.risk_level,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Autopsy failed");
      }

      setResult(data as AutopsyResult);
      cache.current.set(clause.id, data as AutopsyResult);

      // Auto-expand all violations
      const allIndexes = new Set<number>(
        (data.violations || []).map((_: unknown, i: number) => i)
      );
      setExpandedViolations(allIndexes);
    } catch (err) {
      setError("Failed to dissect clause. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const scrollToViolation = useCallback((index: number) => {
    setActiveViolation(index);
    setExpandedViolations((prev) => new Set(prev).add(index));

    setTimeout(() => {
      violationRefs.current[index]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 100);
  }, []);

  const toggleViolation = (index: number) => {
    setExpandedViolations((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
    setActiveViolation(index);
  };

  const copyAnalysis = useCallback(() => {
    if (!result || !clause) return;

    const lines = [
      "🔬 CLAUSE BREAKDOWN — ClauseWall",
      "",
      `Clause #${clause.clause_number} — ${clause.clause_type}`,
      "",
      `"${clause.original_text}"`,
      "",
      `Violations Found: ${result.total_violations}`,
      "",
    ];

    result.violations.forEach((v, i) => {
      lines.push(
        `${CIRCLED_NUMBERS[i] || `(${i + 1})`} ${v.severity.toUpperCase()} — "${v.phrase}"`
      );
      lines.push(`   Issue: ${v.issue}`);
      lines.push(`   Why: ${v.explanation}`);
      if (v.statute) lines.push(`   Law: ${v.statute}`);
      if (v.penalty) lines.push(`   Penalty: ${v.penalty}`);
      lines.push("");
    });

    lines.push(`Summary: ${result.dissection_summary}`);
    lines.push("");
    lines.push("Analyzed by ClauseWall — AI Contract Intelligence for India");

    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    toast.success("Breakdown copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }, [result, clause]);

  // Don't render anything if not open
  if (!isOpen || !clause) return null;

  const segments = result
    ? buildSegments(clause.original_text, result.violations)
    : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-4xl max-h-[90vh] bg-slate-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25 }}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-white/10 bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <Scan className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Clause Breakdown</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Clause #{clause.clause_number} •{" "}
                    {clause.clause_type.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white dark:bg-card/5 transition-colors text-slate-400 hover:text-slate-900 dark:text-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* ── Scrollable Content ── */}
            <div
              ref={contentRef}
              className="overflow-y-auto p-6 space-y-6"
              style={{ maxHeight: "calc(90vh - 72px)" }}
            >
              {/* ── Loading State ── */}
              {loading && (
                <div className="space-y-6">
                  {/* Clause text with scan animation */}
                  <div className="relative overflow-hidden rounded-xl bg-white dark:bg-card/[0.03] border border-white/5 p-6">
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-mono">
                      {clause.original_text}
                    </p>
                    {/* Scanning line */}
                    <motion.div
                      className="absolute left-0 right-0 h-10 bg-gradient-to-b from-transparent via-purple-500/10 to-transparent pointer-events-none"
                      initial={{ top: "-2.5rem" }}
                      animate={{ top: "100%" }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-center gap-3 py-4">
                    <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />
                    <p className="text-sm text-slate-400">
                      Dissecting clause word by word...
                    </p>
                  </div>

                  {/* Skeleton violation cards */}
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-20 rounded-xl bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 border-l-4 border-indigo-500 border border-white/5 animate-pulse"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Error State ── */}
              {error && !loading && (
                <div className="text-center py-8 space-y-4">
                  <XCircle className="h-10 w-10 text-red-500 mx-auto" />
                  <p className="text-red-400">{error}</p>
                  <button
                    onClick={fetchAutopsy}
                    className="px-4 py-2 rounded-xl bg-white dark:bg-card/5 border border-white/10 text-sm text-slate-300 hover:bg-white dark:bg-card/10 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* ── Results ── */}
              {result && !loading && (
                <>
                  {/* ── Dissected Text ── */}
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                      Dissected Clause
                    </p>
                    <div className="rounded-xl bg-white dark:bg-card/[0.03] border border-white/5 p-6">
                      <p className="text-sm leading-[2] font-mono">
                        {segments.map((seg, i) => {
                          if (seg.type === "neutral") {
                            return (
                              <span key={i} className="text-slate-400">
                                {seg.text}
                              </span>
                            );
                          }

                          const violation =
                            result.violations[seg.violation_index!];
                          const config = getSeverityConfig(violation.severity);
                          const isActive =
                            activeViolation === seg.violation_index;
                          const number =
                            CIRCLED_NUMBERS[seg.violation_index!] ||
                            `(${seg.violation_index! + 1})`;

                          return (
                            <span
                              key={i}
                              className={`
                                relative inline cursor-pointer rounded-sm px-1 py-0.5 
                                border-b-2 transition-all duration-200
                                ${config.bg} ${config.borderBottom}
                                ${isActive ? `ring-1 ${config.border} shadow-lg ${config.bg}` : ""}
                                hover:opacity-80
                              `}
                              onClick={() =>
                                scrollToViolation(seg.violation_index!)
                              }
                              title={`${violation.issue} — Click for details`}
                            >
                              <span
                                className={`text-[9px] font-bold mr-0.5 ${config.text}`}
                              >
                                {number}
                              </span>
                              <span className={config.text}>{seg.text}</span>
                            </span>
                          );
                        })}
                      </p>
                    </div>

                    {/* Quick stat under dissected text */}
                    {result.total_violations > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        <Badge
                          className={`${getSeverityConfig(result.most_severe).bg} ${getSeverityConfig(result.most_severe).text} ${getSeverityConfig(result.most_severe).border} text-[10px]`}
                        >
                          {getSeverityConfig(result.most_severe).label}
                        </Badge>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          ⚖️ {result.total_violations} violation
                          {result.total_violations !== 1 ? "s" : ""} found in
                          this clause
                        </span>
                      </div>
                    )}

                    {result.total_violations === 0 && (
                      <p className="text-sm text-green-400 mt-3">
                        ✅ No word-level violations identified in this clause.
                      </p>
                    )}
                  </div>

                  {/* ── Violation Detail Cards ── */}
                  {result.violations.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
                        Violation Details
                      </p>
                      <div className="space-y-3">
                        {result.violations.map((violation, i) => {
                          const config = getSeverityConfig(violation.severity);
                          const isExpanded = expandedViolations.has(i);
                          const isActive = activeViolation === i;
                          const number = CIRCLED_NUMBERS[i] || `(${i + 1})`;

                          return (
                            <motion.div
                              key={i}
                              ref={(el) => {
                                violationRefs.current[i] = el;
                              }}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.08 }}
                              className={`
                                rounded-xl border overflow-hidden transition-all duration-200
                                ${config.cardBg} ${config.cardBorder}
                                ${isActive ? `ring-1 ${config.border}` : ""}
                              `}
                            >
                              {/* Violation Header */}
                              <button
                                onClick={() => toggleViolation(i)}
                                className="w-full flex items-center justify-between p-6 text-left hover:bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 border-l-4 border-indigo-500 transition-colors"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <span
                                    className={`flex-shrink-0 text-lg font-bold ${config.text}`}
                                  >
                                    {number}
                                  </span>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                      {config.icon}
                                      <Badge
                                        className={`${config.bg} ${config.text} ${config.border} text-[10px]`}
                                      >
                                        {config.label}
                                      </Badge>
                                      <span className="text-xs text-slate-400 font-medium">
                                        {violation.issue}
                                      </span>
                                    </div>
                                    <p
                                      className={`text-sm font-mono ${config.text} truncate`}
                                    >
                                      &quot;{violation.phrase}&quot;
                                    </p>
                                  </div>
                                </div>
                                <div className="flex-shrink-0 ml-2 text-slate-500 dark:text-slate-400">
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </div>
                              </button>

                              {/* Expanded Details */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="px-4 pb-4 pt-0 space-y-3 border-t border-white/5">
                                      <div className="pt-3">
                                        {/* Explanation */}
                                        <div className="mb-3">
                                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                                            Why This Is a Problem
                                          </p>
                                          <p className="text-sm text-slate-300 leading-relaxed">
                                            {violation.explanation}
                                          </p>
                                        </div>

                                        {/* Statute */}
                                        {violation.statute && (
                                          <div className="mb-3">
                                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                                              📖 Legal Reference
                                            </p>
                                            <p
                                              className={`text-sm ${config.text}`}
                                            >
                                              {violation.statute}
                                            </p>
                                          </div>
                                        )}

                                        {/* Penalty */}
                                        {violation.penalty && (
                                          <div>
                                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                                              💰 Consequence
                                            </p>
                                            <p className="text-sm text-slate-300">
                                              {violation.penalty}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Summary ── */}
                  {result.dissection_summary && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                        Breakdown Summary
                      </p>
                      <div className="p-6 rounded-xl bg-white dark:bg-card/[0.03] border border-white/5">
                        <p className="text-sm text-slate-300 leading-relaxed">
                          ⚖️ {result.dissection_summary}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── Actions ── */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={copyAnalysis}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-card/5 border border-white/10 text-sm text-slate-300 hover:bg-white dark:bg-card/10 hover:text-slate-900 dark:text-slate-100 transition-colors"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copied ? "Copied!" : "Copy Analysis"}
                    </button>

                    <button
                      onClick={fetchAutopsy}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-card/5 border border-white/10 text-sm text-slate-300 hover:bg-white dark:bg-card/10 hover:text-slate-900 dark:text-slate-100 transition-colors"
                    >
                      <Scan className="h-4 w-4" />
                      Re-Dissect
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}