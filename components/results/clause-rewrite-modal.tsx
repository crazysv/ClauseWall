"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  XCircle,
  Copy,
  Check,
  Pencil,
  ArrowDown,
  Scale,
  Share2,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { RewriteResult } from "@/types";

// ── Types ──

interface ClauseData {
  id: string;
  clause_number: number;
  original_text: string;
  clause_type: string;
  risk_level: string;
  risk_score: number;
  explanation: string;
  legal_citation: string | null;
  fair_alternative: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clause: ClauseData | null;
  jurisdiction: string;
  documentType: string;
}

// ── Component ──

export default function ClauseRewriteModal({
  isOpen,
  onClose,
  clause,
  jurisdiction,
  documentType,
}: Props) {
  const [result, setResult] = useState<RewriteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedClause, setCopiedClause] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);

  const cache = useRef<Map<string, RewriteResult>>(new Map());

  // Fetch rewrite when modal opens
  useEffect(() => {
    if (isOpen && clause) {
      if (cache.current.has(clause.id)) {
        setResult(cache.current.get(clause.id)!);
        setError("");
      } else {
        fetchRewrite();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, clause?.id]);

  const fetchRewrite = async () => {
    if (!clause) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clauseText: clause.original_text,
          clauseType: clause.clause_type,
          jurisdiction,
          documentType,
          riskLevel: clause.risk_level,
          explanation: clause.explanation,
          legalCitation: clause.legal_citation,
          fairAlternative: clause.fair_alternative,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Rewrite failed");
      }

      setResult(data as RewriteResult);
      cache.current.set(clause.id, data as RewriteResult);
    } catch (err) {
      console.error("[ClauseWall] Rewrite fetch failed:", err);
      setError("Failed to rewrite clause. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyRewrittenClause = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(result.rewritten_clause);
    setCopiedClause(true);
    toast.success("Rewritten clause copied!");
    setTimeout(() => setCopiedClause(false), 2000);
  }, [result]);

  const copyFullComparison = useCallback(() => {
    if (!result || !clause) return;

    const lines = [
      "✏️ CLAUSE REWRITE — ClauseWall",
      "",
      `Clause #${clause.clause_number} — ${clause.clause_type.replace(/_/g, " ")}`,
      "",
      "━━━ ORIGINAL (PREDATORY) ━━━",
      `"${clause.original_text}"`,
      "",
      "━━━ REWRITTEN (FAIR + LEGAL) ━━━",
      `"${result.rewritten_clause}"`,
      "",
      "━━━ CHANGES MADE ━━━",
    ];

    result.changes.forEach((c, i) => {
      lines.push(`${i + 1}. ${c.label}`);
      if (c.original) lines.push(`   Before: "${c.original}"`);
      if (c.rewritten) lines.push(`   After: "${c.rewritten}"`);
      if (c.legal_basis) lines.push(`   Law: ${c.legal_basis}`);
      lines.push("");
    });

    lines.push(`⚖️ ${result.legal_compliance_note}`);
    lines.push("");
    lines.push("Rewritten by ClauseWall — AI Contract Intelligence for India");

    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedFull(true);
    toast.success("Full comparison copied!");
    setTimeout(() => setCopiedFull(false), 2000);
  }, [result, clause]);

  const shareWhatsApp = useCallback(() => {
    if (!result || !clause) return;

    const text = [
      `✏️ *ClauseWall Clause Rewrite*`,
      ``,
      `❌ *Original (${clause.risk_level.toUpperCase()}):*`,
      `"${clause.original_text.substring(0, 200)}${clause.original_text.length > 200 ? "..." : ""}"`,
      ``,
      `✅ *Rewritten (Fair + Legal):*`,
      `"${result.rewritten_clause.substring(0, 300)}${result.rewritten_clause.length > 300 ? "..." : ""}"`,
      ``,
      `📋 ${result.total_changes} changes made`,
      `⚖️ ${result.legal_compliance_note}`,
      ``,
      `Analyze your contracts free at clausewall.vercel.app`,
    ].join("\n");

    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank"
    );
  }, [result, clause]);

  if (!isOpen || !clause) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-3xl max-h-[90vh] bg-gray-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25 }}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gray-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Pencil className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Clause Rewriter</h2>
                  <p className="text-xs text-gray-500">
                    Clause #{clause.clause_number} •{" "}
                    {clause.clause_type.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* ── Scrollable Content ── */}
            <div
              className="overflow-y-auto p-6 space-y-6"
              style={{ maxHeight: "calc(90vh - 72px)" }}
            >
              {/* ── Loading State ── */}
              {loading && (
                <div className="space-y-6">
                  {/* Original clause */}
                  <div>
                    <p className="text-xs font-medium text-red-400/70 mb-2 uppercase tracking-wider">
                      Original (Predatory)
                    </p>
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                      <p className="text-sm text-red-300/80 leading-relaxed">
                        &quot;{clause.original_text}&quot;
                      </p>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <motion.div
                      animate={{ y: [0, 6, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowDown className="h-6 w-6 text-emerald-400" />
                    </motion.div>
                  </div>

                  {/* Skeleton rewrite */}
                  <div>
                    <p className="text-xs font-medium text-emerald-400/70 mb-2 uppercase tracking-wider">
                      Rewriting...
                    </p>
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                      <div className="h-4 bg-white/5 rounded animate-pulse w-full" />
                      <div className="h-4 bg-white/5 rounded animate-pulse w-5/6" />
                      <div className="h-4 bg-white/5 rounded animate-pulse w-4/6" />
                      <div className="h-4 bg-white/5 rounded animate-pulse w-5/6" />
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 py-2">
                    <Loader2 className="h-5 w-5 text-emerald-400 animate-spin" />
                    <p className="text-sm text-gray-400">
                      Rewriting clause to be fair and legal...
                    </p>
                  </div>
                </div>
              )}

              {/* ── Error State ── */}
              {error && !loading && (
                <div className="text-center py-8 space-y-4">
                  <XCircle className="h-10 w-10 text-red-500 mx-auto" />
                  <p className="text-red-400">{error}</p>
                  <button
                    onClick={fetchRewrite}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* ── Results ── */}
              {result && !loading && (
                <>
                  {/* ═══ ORIGINAL CLAUSE ═══ */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="h-3.5 w-3.5 text-red-400" />
                      <p className="text-xs font-medium text-red-400 uppercase tracking-wider">
                        Original (From Your Contract)
                      </p>
                      <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px]">
                        {clause.risk_level.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                      <p className="text-sm text-red-300 leading-relaxed font-mono">
                        &quot;{clause.original_text}&quot;
                      </p>
                    </div>
                  </div>

                  {/* ═══ ARROW ═══ */}
                  <motion.div
                    className="flex justify-center"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <ArrowDown className="h-6 w-6 text-emerald-400" />
                      <span className="text-[10px] text-emerald-400/60 font-medium uppercase tracking-widest">
                        Rewritten
                      </span>
                    </div>
                  </motion.div>

                  {/* ═══ REWRITTEN CLAUSE ═══ */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                        Rewritten (Fair + Legal)
                      </p>
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
                        FAIR
                      </Badge>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 relative group">
                      <p className="text-sm text-emerald-300 leading-relaxed font-mono">
                        &quot;{result.rewritten_clause}&quot;
                      </p>

                      {/* Quick copy overlay */}
                      <button
                        onClick={copyRewrittenClause}
                        className="absolute top-3 right-3 p-2 rounded-lg bg-gray-900/80 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-800"
                        title="Copy rewritten clause"
                      >
                        {copiedClause ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </motion.div>

                  {/* ═══ CHANGES MADE ═══ */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">
                      Changes Made ({result.total_changes})
                    </p>
                    <div className="space-y-2.5">
                      {result.changes.map((change, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + i * 0.1 }}
                          className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2"
                        >
                          {/* Change label */}
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                            <span className="text-sm font-medium text-white">
                              {change.label}
                            </span>
                          </div>

                          {/* Original vs Rewritten */}
                          {(change.original || change.rewritten) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
                              {change.original && (
                                <div className="px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/15">
                                  <p className="text-[10px] text-red-400/60 font-medium mb-0.5">
                                    BEFORE
                                  </p>
                                  <p className="text-xs text-red-300 line-through decoration-red-500/40">
                                    {change.original}
                                  </p>
                                </div>
                              )}
                              {change.rewritten && (
                                <div className="px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                                  <p className="text-[10px] text-emerald-400/60 font-medium mb-0.5">
                                    AFTER
                                  </p>
                                  <p className="text-xs text-emerald-300">
                                    {change.rewritten}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Legal basis */}
                          {change.legal_basis && (
                            <div className="flex items-start gap-1.5 pl-6">
                              <Scale className="h-3 w-3 text-blue-400 mt-0.5 flex-shrink-0" />
                              <p className="text-[11px] text-blue-400/80">
                                {change.legal_basis}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* ═══ COMPLIANCE NOTE ═══ */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/15"
                  >
                    <div className="flex items-start gap-2">
                      <Scale className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-blue-400 mb-1">
                          Legal Compliance
                        </p>
                        <p className="text-sm text-blue-300/80 leading-relaxed">
                          {result.legal_compliance_note}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* ═══ ACTION BUTTONS ═══ */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="flex flex-wrap items-center gap-3 pt-2"
                  >
                    {/* Copy Rewritten Clause */}
                    <button
                      onClick={copyRewrittenClause}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 font-medium hover:bg-emerald-500/20 transition-colors"
                    >
                      {copiedClause ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copiedClause ? "Copied!" : "Copy Rewritten Clause"}
                    </button>

                    {/* Copy Full Comparison */}
                    <button
                      onClick={copyFullComparison}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                    >
                      {copiedFull ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copiedFull ? "Copied!" : "Copy Full Comparison"}
                    </button>

                    {/* WhatsApp Share */}
                    <button
                      onClick={shareWhatsApp}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                    >
                      <Share2 className="h-4 w-4" />
                      WhatsApp
                    </button>

                    {/* Re-generate */}
                    <button
                      onClick={() => {
                        cache.current.delete(clause.id);
                        fetchRewrite();
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Re-generate
                    </button>
                  </motion.div>

                  {/* ═══ DISCLAIMER ═══ */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    transition={{ delay: 1.2 }}
                    className="text-[10px] text-center text-muted-foreground/50 pt-2 border-t border-gray-800"
                  >
                    AI-generated rewrite for reference. Have a legal professional
                    review before using in official agreements.
                  </motion.p>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}