"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scan,
  X,
  Download,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  findAllClausePositions,
  buildTextSegments,
} from "@/lib/xray/text-matcher";
import type { Document, Clause } from "@/types";
import { toast } from "sonner";

// ============================================
// SHARED CONSTANTS
// ============================================

const RISK_STYLES = {
  safe: {
    bg: "rgba(34, 197, 94, 0.12)",
    border: "rgba(34, 197, 94, 0.35)",
    glow: "0 0 6px rgba(34, 197, 94, 0.25)",
    color: "#22C55E",
    label: "Safe",
    emoji: "✅",
  },
  warning: {
    bg: "rgba(234, 179, 8, 0.18)",
    border: "rgba(234, 179, 8, 0.45)",
    glow: "0 0 10px rgba(234, 179, 8, 0.35)",
    color: "#EAB308",
    label: "Warning",
    emoji: "⚠️",
  },
  dangerous: {
    bg: "rgba(239, 68, 68, 0.22)",
    border: "rgba(239, 68, 68, 0.55)",
    glow: "0 0 14px rgba(239, 68, 68, 0.45)",
    color: "#EF4444",
    label: "Dangerous",
    emoji: "🔴",
  },
  illegal: {
    bg: "rgba(168, 85, 247, 0.28)",
    border: "rgba(168, 85, 247, 0.65)",
    glow: "0 0 18px rgba(168, 85, 247, 0.5), 0 0 36px rgba(168, 85, 247, 0.25)",
    color: "#A855F7",
    label: "Illegal",
    emoji: "⛔",
  },
};

// ============================================
// SHARED HOOKS
// ============================================

function useXRayData(doc: Document, clauses: Clause[], showSafe: boolean) {
  const filteredClauses = useMemo(() => {
    return showSafe
      ? clauses
      : clauses.filter((c) => c.risk_level !== "safe");
  }, [clauses, showSafe]);

  const segments = useMemo(() => {
    if (!doc.raw_text || !filteredClauses.length) {
      return doc.raw_text
        ? [{ text: doc.raw_text, type: "normal" as const, startIndex: 0, endIndex: doc.raw_text.length }]
        : [];
    }
    const matches = findAllClausePositions(doc.raw_text, filteredClauses);
    return buildTextSegments(doc.raw_text, matches);
  }, [doc.raw_text, filteredClauses]);

  const dangerSegments = useMemo(() => {
    return segments
      .map((s, i) => ({ segment: s, index: i }))
      .filter(
        ({ segment }) =>
          segment.type === "highlighted" &&
          segment.clause &&
          (segment.clause.risk_level === "dangerous" || segment.clause.risk_level === "illegal")
      );
  }, [segments]);

  const riskCounts = useMemo(() => ({
    illegal: clauses.filter((c) => c.risk_level === "illegal").length,
    dangerous: clauses.filter((c) => c.risk_level === "dangerous").length,
    warning: clauses.filter((c) => c.risk_level === "warning").length,
    safe: clauses.filter((c) => c.risk_level === "safe").length,
  }), [clauses]);

  const matchedCount = useMemo(() => {
    return segments.filter((s) => s.type === "highlighted").length;
  }, [segments]);

  return { filteredClauses, segments, dangerSegments, riskCounts, matchedCount };
}

// ============================================
// OVERLAY CONTENT (shared between both exports)
// ============================================

function OverlayContent({
  doc,
  clauses,
  onClose,
}: {
  doc: Document;
  clauses: Clause[];
  onClose: () => void;
}) {
  const [hoveredClause, setHoveredClause] = useState<Clause | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [showSafe, setShowSafe] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dangerRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [currentDangerIndex, setCurrentDangerIndex] = useState(0);

  const { filteredClauses, segments, dangerSegments, riskCounts, matchedCount } =
    useXRayData(doc, clauses, showSafe);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "=" || e.key === "+") setZoom((z) => Math.min(2, z + 0.1));
      if (e.key === "-") setZoom((z) => Math.max(0.5, z - 0.1));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleMouseEnter = useCallback((clause: Clause, event: React.MouseEvent) => {
    setHoveredClause(clause);
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
  }, []);

  const handleMouseLeave = useCallback(() => setHoveredClause(null), []);

  const navigateDanger = (direction: "next" | "prev") => {
    if (!dangerSegments.length) return;
    let newIndex = currentDangerIndex;
    if (direction === "next") newIndex = (currentDangerIndex + 1) % dangerSegments.length;
    else newIndex = (currentDangerIndex - 1 + dangerSegments.length) % dangerSegments.length;
    setCurrentDangerIndex(newIndex);
    const ref = dangerRefs.current[newIndex];
    if (ref) ref.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleScreenshot = async () => {
    if (!contentRef.current) return;
    try {
      toast.info("Capturing screenshot...");
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: "#0A0A0F",
        scale: 2,
        logging: false,
        useCORS: true,
      });
      const link = window.document.createElement("a");
      link.download = `clausewall-xray-${doc.id.slice(0, 8)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("X-Ray screenshot downloaded!");
    } catch {
      toast.error("Failed to capture screenshot. Try a smaller zoom level.");
    }
  };

  let dangerRefIdx = 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 overflow-hidden flex flex-col"
    >
      {/* Header Bar */}
      <div className="flex-shrink-0 h-14 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between px-4 sm:px-4 md:px-6">
        <div className="flex items-center gap-3 overflow-x-auto">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Scan className="h-4 w-4 text-purple-400" />
            <span className="font-semibold text-sm">Deep Scan</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 ml-3">
            {riskCounts.illegal > 0 && (
              <span className="flex items-center gap-1 text-xs text-purple-400">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                {riskCounts.illegal} Illegal
              </span>
            )}
            {riskCounts.dangerous > 0 && (
              <span className="flex items-center gap-1 text-xs text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                {riskCounts.dangerous} Dangerous
              </span>
            )}
            {riskCounts.warning > 0 && (
              <span className="flex items-center gap-1 text-xs text-yellow-400">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                {riskCounts.warning} Warning
              </span>
            )}
            <span className="text-xs text-slate-600 dark:text-slate-400">{matchedCount}/{filteredClauses.length} matched</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {dangerSegments.length > 0 && (
            <div className="hidden sm:flex items-center gap-1 border-r border-slate-700 pr-2 mr-1">
              <Button aria-label="Previous danger highlight" variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateDanger("prev")}>
                <ChevronUp className="h-3.5 w-3.5" />
              </Button>
              <span className="text-[11px] text-slate-400 w-8 text-center">
                {currentDangerIndex + 1}/{dangerSegments.length}
              </span>
              <Button aria-label="Next danger highlight" variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateDanger("next")}>
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-slate-400 h-8 px-2" onClick={() => setShowSafe(!showSafe)}>
            {showSafe ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{showSafe ? "Hide Safe" : "Show Safe"}</span>
          </Button>

          <div className="flex items-center gap-0.5 border-l border-slate-700 pl-1.5 ml-1">
            <Button aria-label="Zoom out document" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[11px] text-slate-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <Button aria-label="Zoom in document" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.min(2, z + 0.1))}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 px-2.5 ml-1" onClick={handleScreenshot}>
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Screenshot</span>
          </Button>

          <Button aria-label="Close X-ray mode" variant="ghost" size="icon" className="h-8 w-8 ml-1" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Document Content */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-6 sm:p-4 md:p-6 lg:p-8">
        <div
          ref={contentRef}
          className="max-w-4xl mx-auto bg-[#0C0C14] rounded-xl border border-slate-800/80 shadow-2xl"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
        >
          <div className="px-4 md:px-4 md:px-6 lg:px-8 pt-8 pb-4 border-b border-slate-800/60">
            <div className="flex items-center gap-3 mb-1">
              <Scan className="h-5 w-5 text-purple-400" />
              <h2 className="text-base font-semibold text-slate-200">
                {doc.original_filename || "Contract Document"}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 ml-8">
              {clauses.length} clauses analyzed • Risk Score: {doc.overall_risk_score}/100 • X-Ray Scan by ClauseWall
            </p>
          </div>

          <div className="px-4 md:px-4 md:px-6 lg:px-8 py-6 font-mono text-[13px] leading-7 text-slate-300 whitespace-pre-wrap break-words">
            {segments.map((segment, index) => {
              if (segment.type === "normal") {
                return <span key={index}>{segment.text}</span>;
              }

              const clause = segment.clause!;
              const style = RISK_STYLES[clause.risk_level];
              const isDanger = clause.risk_level === "dangerous" || clause.risk_level === "illegal";
              const thisDangerIdx = isDanger ? dangerRefIdx++ : -1;

              return (
                <motion.span
                  key={index}
                  ref={
                    isDanger && thisDangerIdx >= 0
                      ? (el) => { dangerRefs.current[thisDangerIdx] = el; }
                      : undefined
                  }
                  initial={{ backgroundColor: "transparent" }}
                  animate={{ backgroundColor: style.bg, boxShadow: style.glow }}
                  transition={{ duration: 0.6, delay: Math.min(index * 0.05, 2) }}
                  className="relative inline rounded-sm px-0.5 cursor-pointer transition-all duration-200 hover:brightness-125"
                  style={{ borderBottom: `2px solid ${style.border}`, textDecorationColor: style.border }}
                  onMouseEnter={(e) => handleMouseEnter(clause, e)}
                  onMouseLeave={handleMouseLeave}
                >
                  {segment.text}
                  <span
                    className="ml-1.5 inline-flex items-center gap-0.5 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full select-none"
                    style={{ backgroundColor: `${style.color}18`, color: style.color, border: `1px solid ${style.border}` }}
                  >
                    {style.emoji} {style.label}
                  </span>
                </motion.span>
              );
            })}
          </div>

          <div className="px-4 md:px-4 md:px-6 lg:px-8 py-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
            <span>🛡️ Analyzed by ClauseWall • {matchedCount} clauses highlighted</span>
            <span>clausewall.com</span>
          </div>
        </div>
      </div>

      {/* Hover Tooltip */}
      <AnimatePresence>
        {hoveredClause && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[60] w-80 bg-slate-900/98 backdrop-blur-md border border-slate-700/60 rounded-xl shadow-2xl p-6 pointer-events-none"
            style={{
              left: Math.max(16, Math.min(tooltipPos.x - 160, (typeof window !== "undefined" ? window.innerWidth : 1200) - 340)),
              top: Math.max(70, Math.min(tooltipPos.y - 170, (typeof window !== "undefined" ? window.innerHeight : 800) - 200)),
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                style={{
                  backgroundColor: `${RISK_STYLES[hoveredClause.risk_level].color}20`,
                  color: RISK_STYLES[hoveredClause.risk_level].color,
                  border: `1px solid ${RISK_STYLES[hoveredClause.risk_level].border}`,
                }}
              >
                {RISK_STYLES[hoveredClause.risk_level].emoji} {RISK_STYLES[hoveredClause.risk_level].label}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Clause #{hoveredClause.clause_number}</span>
              {hoveredClause.risk_score != null && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-auto">Score: {hoveredClause.risk_score}</span>
              )}
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {hoveredClause.explanation.length > 200
                ? hoveredClause.explanation.slice(0, 200) + "..."
                : hoveredClause.explanation}
            </p>
            {hoveredClause.legal_citation && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 pt-2 border-t border-slate-800">
                📚 {hoveredClause.legal_citation}
              </p>
            )}
            {hoveredClause.red_flags && hoveredClause.red_flags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {hoveredClause.red_flags.slice(0, 3).map((flag, i) => (
                  <span key={i} className="text-[9px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded-full border border-red-500/20">
                    🚩 {flag}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// EXPORT 1: XRayMode (default) — Card + Overlay
// ============================================

interface XRayModeProps {
  document: Document;
  clauses: Clause[];
}

export function XRayMode({ document: doc, clauses }: XRayModeProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!doc.raw_text) return null;

  return (
    <>
      {/* Trigger Card */}
      <Card
        className="bg-slate-900/50 border-slate-800 mb-8 cursor-pointer hover:border-indigo-500/40 transition-all group"
        onClick={() => setIsOpen(true)}
      >
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/15 flex items-center justify-center group-hover:bg-indigo-500/25 transition-colors">
              <Scan className="h-6 w-6 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold flex items-center gap-2">
                X-Ray Mode
                <Badge variant="outline" className="text-[10px] border-indigo-500/40 text-purple-400">
                  NEW
                </Badge>
              </h3>
              <p className="text-sm text-muted-foreground">
                See dangerous clauses highlighted directly on your document
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 flex-shrink-0"
              onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
            >
              <Scan className="h-4 w-4" />
              Scan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <OverlayContent doc={doc} clauses={clauses} onClose={() => setIsOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================
// EXPORT 2: XRayOverlay — Standalone overlay
// (Controlled by parent, no trigger card)
// ============================================

interface XRayOverlayProps {
  document: Document;
  clauses: Clause[];
  onClose: () => void;
}

export function XRayOverlay({ document: doc, clauses, onClose }: XRayOverlayProps) {
  if (!doc.raw_text) return null;

  return <OverlayContent doc={doc} clauses={clauses} onClose={onClose} />;
}