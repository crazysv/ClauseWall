"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { RelatedActions } from "@/components/shared/related-actions";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Copy,
  Printer,
  Download,
  MessageSquare,
  Shield,
  Scale,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
  Lightbulb,
  ArrowRight,
  FileText,
  Flag,
  Swords,
  Share2,
  Check,
  Link as LinkIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getStateName, getDocumentTypeLabel } from "@/lib/utils/constants";
import type { NegotiationPlaybook, NegotiationScript } from "@/types";
import { toast } from "sonner";

export default function NegotiatePage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;

  const [playbook, setPlaybook] = useState<NegotiationPlaybook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedScripts, setExpandedScripts] = useState<Set<number>>(
    new Set(),
  );
  const [expandedCounters, setExpandedCounters] = useState<Set<string>>(
    new Set(),
  );
  const [copied, setCopied] = useState(false);
  const [copiedScript, setCopiedScript] = useState<number | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const supabase = createClient();

  // Document info
  const [docInfo, setDocInfo] = useState<{
    filename: string;
    document_type: string;
    jurisdiction: string;
    entity_name: string | null;
    overall_risk_score: number;
  } | null>(null);

  useEffect(() => {
    async function loadAndGenerate() {
      try {
        const { data: doc, error: docErr } = await supabase
          .from("documents")
          .select(
            "original_filename, document_type, jurisdiction, entity_name, overall_risk_score, analysis_status",
          )
          .eq("id", documentId)
          .single();

        if (docErr || !doc) {
          setError("Document not found");
          setLoading(false);
          return;
        }

        if (doc.analysis_status !== "completed") {
          setError(
            "Analysis is not complete yet. Please wait for it to finish.",
          );
          setLoading(false);
          return;
        }

        setDocInfo({
          filename: doc.original_filename || "Untitled",
          document_type: doc.document_type,
          jurisdiction: doc.jurisdiction,
          entity_name: doc.entity_name,
          overall_risk_score: doc.overall_risk_score,
        });

        const response = await fetch("/api/negotiate/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to generate playbook");
        }

        setPlaybook(data.playbook);

        if (data.playbook.scripts.length > 0) {
          setExpandedScripts(new Set([0]));
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    loadAndGenerate();
  }, [documentId]);

  // ── Toggle Functions ────────────────────────

  const toggleScript = (index: number) => {
    setExpandedScripts((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleCounter = (key: string) => {
    setExpandedCounters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAllScripts = () => {
    if (!playbook) return;
    setExpandedScripts(new Set(playbook.scripts.map((_, i) => i)));
  };

  const collapseAllScripts = () => {
    setExpandedScripts(new Set());
  };

  // ── Copy Functions ──────────────────────────

  const handleCopyAll = async () => {
    if (!playbook) return;
    const text = formatPlaybookAsText(playbook);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Full playbook copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleCopyScript = async (script: NegotiationScript, index: number) => {
    const text = formatScriptAsText(script, docInfo?.entity_name || null);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedScript(index);
      toast.success("Script copied!");
      setTimeout(() => setCopiedScript(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  // ── WhatsApp Share Functions ────────────────

  const getPageUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.href;
    }
    return `https://clause-wall.vercel.app/negotiate/${documentId}`;
  };

  const openWhatsApp = (text: string) => {
    const encoded = encodeURIComponent(text);
    // wa.me works on both mobile (opens app) and desktop (opens WhatsApp Web)
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  const handleWhatsAppFullPlaybook = () => {
    if (!playbook) return;
    const text = formatPlaybookAsText(playbook);

    // WhatsApp has ~65,000 char limit, but shorter is better
    const truncated =
      text.length > 4000
        ? text.substring(0, 3900) +
          "\n\n... (Full playbook available at: " +
          getPageUrl() +
          ")"
        : text;

    openWhatsApp(truncated);
    setShowShareMenu(false);
    toast.success("Opening WhatsApp...");
  };

  const handleWhatsAppLink = () => {
    if (!playbook || !docInfo) return;

    const issueCount = playbook.total_issues;
    const entityText = docInfo.entity_name
      ? ` with ${docInfo.entity_name}`
      : "";

    const text = `🛡️ *Negotiation Playbook — ClauseWall*\n\nI'm negotiating a *${getDocumentTypeLabel(docInfo.document_type)}*${entityText}.\n\nFound *${issueCount} issues* to negotiate. Here's my playbook:\n\n👉 ${getPageUrl()}\n\nCan you help me review before I talk to them?\n\n_Generated by ClauseWall — India's AI Contract Analyzer_`;

    openWhatsApp(text);
    setShowShareMenu(false);
    toast.success("Opening WhatsApp...");
  };

  const handleWhatsAppScript = (script: NegotiationScript) => {
    const text = formatScriptForWhatsApp(script, docInfo?.entity_name || null);
    openWhatsApp(text);
    toast.success("Opening WhatsApp...");
  };

  // ── Print & Download ────────────────────────

  const handlePrint = () => window.print();

  const handleDownload = () => {
    if (!playbook) return;
    const text = formatPlaybookAsText(playbook);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Negotiation_Playbook_${docInfo?.filename || "contract"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Risk Helpers ────────────────────────────

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "illegal":
        return <Scale className="h-3.5 w-3.5 text-purple-400" />;
      case "dangerous":
        return <XCircle className="h-3.5 w-3.5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
      default:
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
    }
  };

  const getRiskBadgeClass = (level: string) => {
    switch (level) {
      case "illegal":
        return "text-purple-400 bg-purple-950/20 border-purple-900/50";
      case "dangerous":
        return "text-red-500 bg-red-950/20 border-red-900/50";
      case "warning":
        return "text-amber-500 bg-amber-950/20 border-amber-900/50";
      default:
        return "text-amber-500 bg-amber-950/20 border-amber-900/50";
    }
  };

  const getStrengthBadge = (strength: string) => {
    switch (strength) {
      case "strong":
        return (
          <span className="text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 border border-emerald-900/50 text-emerald-400 bg-emerald-950/20">
            STRONG POSITION
          </span>
        );
      case "moderate":
        return (
          <span className="text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 border border-amber-900/50 text-amber-400 bg-amber-950/20">
            MODERATE POSITION
          </span>
        );
      case "weak":
        return (
          <span className="text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 border border-neutral-800 text-neutral-500 bg-neutral-900">
            DIPLOMATIC
          </span>
        );
      default:
        return null;
    }
  };

  // ── Loading ─────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-6">
        <div className="p-4 border border-neutral-800 bg-[#050505]">
          <Swords className="h-10 w-10 text-cyan-500 animate-pulse" />
        </div>
        <div className="text-center">
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-2">
            [ GENERATING_PLAYBOOK ]
          </h2>
          <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-600 max-w-md">
            CRAFTING PERSONALIZED NEGOTIATION SCRIPTS WITH COUNTER-RESPONSES AND
            ESCALATION PATHS...
          </p>
        </div>
        <Loader2 className="h-5 w-5 text-cyan-500 animate-spin" />
      </div>
    );
  }

  // ── Error ───────────────────────────────────

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-6 px-4">
        <div className="p-3 border border-red-900/50 bg-red-950/20">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-[10px] font-mono uppercase tracking-widest text-neutral-300">
          {error}
        </h2>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 border border-neutral-800 bg-[#050505] font-mono uppercase tracking-widest text-[9px] text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          GO BACK
        </button>
      </div>
    );
  }

  if (!playbook || !docInfo) return null;

  const jurisdictionName = getStateName(docInfo.jurisdiction);

  // ── Render ──────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-16">
        {/* Back */}
        <button
          onClick={() => router.push(`/results/${documentId}`)}
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-300 font-mono uppercase tracking-widest text-[9px] mb-8 transition-colors print:hidden"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          BACK TO RESULTS
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 border border-neutral-800 bg-[#050505]">
              <Swords className="w-6 h-6 text-cyan-500" />
            </div>
            <div>
              <h1 className="text-xs font-mono uppercase tracking-widest text-neutral-200 mb-1">
                NEGOTIATION_PLAYBOOK
              </h1>
              <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-600">
                {docInfo.filename} · {getDocumentTypeLabel(docInfo.document_type)}{" "}
                · {jurisdictionName}
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap gap-3 mt-6">
            <div className="px-3 py-1.5 border border-neutral-800 bg-[#050505] text-[9px] font-mono uppercase tracking-widest">
              <span className="text-neutral-600 mr-2">ISSUES:</span>
              <span className="text-neutral-200">{playbook.total_issues}</span>
            </div>
            <div className="px-3 py-1.5 border border-neutral-800 bg-[#050505] text-[9px] font-mono uppercase tracking-widest">
              <span className="text-neutral-600 mr-2">PRIORITY:</span>
              <span className="text-neutral-200">
                {playbook.priority_order}
              </span>
            </div>
            {docInfo.entity_name && (
              <div className="px-3 py-1.5 border border-neutral-800 bg-[#050505] text-[9px] font-mono uppercase tracking-widest">
                <span className="text-neutral-600 mr-2">TARGET:</span>
                <span className="text-neutral-200">{docInfo.entity_name}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Action Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center gap-2 mb-10 print:hidden"
        >
          <button
            onClick={handleCopyAll}
            className="flex items-center gap-2 px-3 py-1.5 border border-neutral-800 bg-[#050505] font-mono uppercase tracking-widest text-[9px] text-neutral-500 hover:text-neutral-200 hover:border-neutral-600 transition-colors"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "COPIED" : "COPY ALL"}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-1.5 border border-neutral-800 bg-[#050505] font-mono uppercase tracking-widest text-[9px] text-neutral-500 hover:text-neutral-200 hover:border-neutral-600 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            DOWNLOAD
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-1.5 border border-neutral-800 bg-[#050505] font-mono uppercase tracking-widest text-[9px] text-neutral-500 hover:text-neutral-200 hover:border-neutral-600 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            PRINT
          </button>

          {/* WhatsApp Share Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="flex items-center gap-2 px-3 py-1.5 border border-emerald-900/50 bg-emerald-950/10 font-mono uppercase tracking-widest text-[9px] text-emerald-500 hover:text-emerald-300 hover:border-emerald-800 transition-colors"
            >
              <WhatsAppIcon />
              SHARE
              <ChevronDown
                className={`h-3 w-3 transition-transform ${showShareMenu ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showShareMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-2 w-64 bg-[#0a0a0a] border border-neutral-800 z-50 overflow-hidden"
                >
                  <div className="p-2">
                    <button
                      onClick={handleWhatsAppFullPlaybook}
                      className="w-full flex items-start gap-3 p-3 hover:bg-neutral-900 transition-colors text-left"
                    >
                      <MessageSquare className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-200">
                          FULL PLAYBOOK
                        </p>
                        <p className="text-[8px] font-mono text-neutral-600 mt-0.5">
                          SEND ENTIRE PLAYBOOK
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={handleWhatsAppLink}
                      className="w-full flex items-start gap-3 p-3 hover:bg-neutral-900 transition-colors text-left mt-1"
                    >
                      <LinkIcon className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-200">
                          SHARE LINK
                        </p>
                        <p className="text-[8px] font-mono text-neutral-600 mt-0.5">
                          SEND PAGE LINK
                        </p>
                      </div>
                    </button>
                  </div>

                  <div className="border-t border-neutral-800 p-3 bg-[#050505]">
                    <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600">
                      YOU CAN ALSO SHARE INDIVIDUAL SCRIPTS FROM INSIDE EACH
                      CARD
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1" />
          <button
            onClick={expandAllScripts}
            className="text-[9px] font-mono uppercase tracking-widest text-neutral-600 hover:text-neutral-300 transition-colors"
          >
            EXPAND ALL
          </button>
          <span className="text-neutral-800 mx-1">|</span>
          <button
            onClick={collapseAllScripts}
            className="text-[9px] font-mono uppercase tracking-widest text-neutral-600 hover:text-neutral-300 transition-colors"
          >
            COLLAPSE ALL
          </button>
        </motion.div>

        {/* Close share menu on outside click */}
        {showShareMenu && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowShareMenu(false)}
          />
        )}

        {/* Opening Approach */}
        {playbook.opening_approach && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-10 border-l-2 border-cyan-900/50 bg-cyan-950/10 p-6"
          >
            <div className="flex items-center gap-2 border-b border-cyan-900/30 pb-3 mb-4">
              <Target className="h-3.5 w-3.5 text-cyan-400" />
              <p className="text-[9px] font-mono uppercase tracking-widest text-cyan-400">
                OPENING_APPROACH
              </p>
            </div>
            <p className="text-sm font-mono text-cyan-300/80 leading-relaxed">
              &quot;{playbook.opening_approach}&quot;
            </p>
          </motion.div>
        )}

        {/* No Issues */}
        {playbook.scripts.length === 0 && (
          <div className="border border-emerald-900/50 bg-emerald-950/10 p-10 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-6" />
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 mb-2">
              [ NO_NEGOTIATION_NEEDED ]
            </h3>
            <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-600 max-w-lg mx-auto">
              THIS CONTRACT APPEARS FAIR. NO RISKY CLAUSES FOUND TO NEGOTIATE.
            </p>
          </div>
        )}

        {/* Script Cards */}
        <div className="space-y-3 mb-8">
          {playbook.scripts.map((script, index) => {
            const isExpanded = expandedScripts.has(index);
            const isScriptCopied = copiedScript === index;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.08 }}
              >
                <div className="border border-neutral-900 bg-[#0a0a0a] overflow-hidden mb-3">
                  {/* Script Header */}
                  <button
                    onClick={() => toggleScript(index)}
                    className="w-full p-5 lg:p-6 flex items-start justify-between text-left hover:bg-neutral-900/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-8 h-8 border border-neutral-700 bg-[#050505] text-sm font-mono tabular-nums text-neutral-400 flex-shrink-0">
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          {getRiskIcon(script.risk_level)}
                          <span
                            className={`text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 border ${getRiskBadgeClass(script.risk_level)}`}
                          >
                            {script.risk_level.toUpperCase()}
                          </span>
                          <span className="text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 border border-neutral-800 text-neutral-500 bg-neutral-900">
                            {script.clause_type}
                          </span>
                          {getStrengthBadge(script.strength)}
                        </div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-300">
                          {script.clause_summary}
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-neutral-600 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-neutral-600 flex-shrink-0" />
                    )}
                  </button>

                  {/* Script Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-neutral-900 bg-[#050505]"
                      >
                        <div className="px-5 lg:px-6 pb-6 pt-6 space-y-6">
                          {/* Opening Statement */}
                          <div className="p-5 border-l-2 border-cyan-900/50 bg-cyan-950/10">
                            <p className="text-[9px] font-mono uppercase tracking-widest text-cyan-400 mb-3 flex items-center gap-2">
                              <MessageSquare className="h-3.5 w-3.5" />
                              YOUR_OPENING
                            </p>
                            <p className="text-sm font-mono text-cyan-300/80 leading-relaxed">
                              &quot;{script.opening_statement}&quot;
                            </p>
                          </div>

                          {/* Counter Responses */}
                          {script.counter_responses &&
                            script.counter_responses.length > 0 && (
                              <div className="mt-8">
                                <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2 border-l-2 border-neutral-700 pl-3">
                                  <Swords className="h-3.5 w-3.5" />
                                  IF_THEY_PUSH_BACK
                                </p>
                                <div className="space-y-3">
                                  {script.counter_responses.map(
                                    (cr, crIndex) => {
                                      const counterKey = `${index}-${crIndex}`;
                                      const isCounterExpanded =
                                        expandedCounters.has(counterKey);

                                      return (
                                        <div
                                          key={crIndex}
                                          className="border border-neutral-800 bg-[#0a0a0a]"
                                        >
                                          <button
                                            onClick={() =>
                                              toggleCounter(counterKey)
                                            }
                                            className="w-full flex items-center gap-3 p-4 text-left hover:bg-neutral-900/50 transition-colors"
                                          >
                                            <span className="text-red-500 font-mono uppercase tracking-widest text-[8px] flex-shrink-0">
                                              THEY_SAY:
                                            </span>
                                            <span className="text-[10px] font-mono text-neutral-400 flex-1 italic">
                                              &quot;{cr.they_say}&quot;
                                            </span>
                                            {isCounterExpanded ? (
                                              <ChevronUp className="h-3.5 w-3.5 text-neutral-700 flex-shrink-0" />
                                            ) : (
                                              <ChevronDown className="h-3.5 w-3.5 text-neutral-700 flex-shrink-0" />
                                            )}
                                          </button>

                                          <AnimatePresence>
                                            {isCounterExpanded && (
                                              <motion.div
                                                initial={{
                                                  height: 0,
                                                  opacity: 0,
                                                }}
                                                animate={{
                                                  height: "auto",
                                                  opacity: 1,
                                                }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.15 }}
                                                className="overflow-hidden border-t border-neutral-800 bg-emerald-950/10"
                                              >
                                                <div className="p-4 border-l-2 border-emerald-900/50">
                                                  <span className="text-emerald-500 font-mono uppercase tracking-widest text-[8px] block mb-2">
                                                    YOU_SAY:
                                                  </span>
                                                  <p className="text-sm font-mono text-emerald-300/80 leading-relaxed">
                                                    &quot;{cr.you_say}&quot;
                                                  </p>
                                                </div>
                                              </motion.div>
                                            )}
                                          </AnimatePresence>
                                        </div>
                                      );
                                    },
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Escalation */}
                          {script.escalation && (
                            <div className="p-5 border-l-2 border-red-900/50 bg-red-950/10 mt-8">
                              <p className="text-[9px] font-mono uppercase tracking-widest text-red-400 mb-3 flex items-center gap-2">
                                <Flag className="h-3.5 w-3.5" />
                                IF_THEY_REFUSE
                              </p>
                              <div className="space-y-3 text-sm">
                                <div className="flex items-start gap-3">
                                  <span className="text-red-500/70 font-mono uppercase tracking-widest text-[8px] mt-0.5 flex-shrink-0">
                                    ACTION:
                                  </span>
                                  <span className="text-[10px] font-mono text-neutral-300">
                                    {script.escalation.action}
                                  </span>
                                </div>
                                <div className="flex items-start gap-3">
                                  <span className="text-red-500/70 font-mono uppercase tracking-widest text-[8px] mt-0.5 flex-shrink-0">
                                    AUTHORITY:
                                  </span>
                                  <span className="text-[10px] font-mono text-neutral-300">
                                    {script.escalation.authority}
                                  </span>
                                </div>
                                <div className="flex items-start gap-3">
                                  <span className="text-red-500/70 font-mono uppercase tracking-widest text-[8px] mt-0.5 flex-shrink-0">
                                    LAW_REF:
                                  </span>
                                  <span className="text-[10px] font-mono text-cyan-400">
                                    {script.escalation.law_reference}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Per-Script Action Buttons */}
                          <div className="flex flex-wrap gap-2 pt-6 mt-6 border-t border-neutral-900">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyScript(script, index);
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 border border-neutral-800 bg-[#0a0a0a] text-[9px] font-mono uppercase tracking-widest text-neutral-500 hover:text-neutral-200 hover:border-neutral-600 transition-colors"
                            >
                              {isScriptCopied ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                              {isScriptCopied ? "COPIED" : "COPY SCRIPT"}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleWhatsAppScript(script);
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 border border-emerald-900/50 bg-emerald-950/10 text-[9px] font-mono uppercase tracking-widest text-emerald-500 hover:text-emerald-300 hover:border-emerald-800 transition-colors"
                            >
                              <WhatsAppIcon size={14} />
                              SHARE SCRIPT
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Closing Statement */}
        {playbook.closing_statement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-10 border-l-2 border-emerald-900/50 bg-emerald-950/10 p-6"
          >
            <div className="flex items-center gap-2 border-b border-emerald-900/30 pb-3 mb-4">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <p className="text-[9px] font-mono uppercase tracking-widest text-emerald-400">
                CLOSING_APPROACH
              </p>
            </div>
            <p className="text-sm font-mono text-emerald-300/80 leading-relaxed italic">
              &quot;{playbook.closing_statement}&quot;
            </p>
          </motion.div>
        )}

        {/* General Tips */}
        {playbook.general_tips.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-10 border border-amber-900/50 bg-amber-950/10 p-6"
          >
            <div className="flex items-center gap-2 border-b border-amber-900/30 pb-3 mb-4">
              <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
              <p className="text-[9px] font-mono uppercase tracking-widest text-amber-400">
                NEGOTIATION_INTEL
              </p>
            </div>
            <ul className="space-y-3">
              {playbook.general_tips.map((tip, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-[10px] font-mono text-amber-300/70 leading-relaxed"
                >
                  <span className="text-amber-600 shrink-0 mt-0.5">→</span>
                  {tip}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Related Actions */}
        <RelatedActions documentId={documentId} currentPage="negotiate" />

        {/* Disclaimer */}
        <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-700 text-center mt-12 print:hidden border-t border-neutral-900 pt-8">
          THESE SCRIPTS ARE AI-GENERATED GUIDANCE, NOT LEGAL ADVICE. ADAPT THEM
          TO YOUR SITUATION. CLAUSEWALL IS NOT A SUBSTITUTE FOR PROFESSIONAL
          LEGAL COUNSEL.
        </p>
      </div>
    </div>
  );
}

// ============================================
// WhatsApp Icon Component
// ============================================

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className="flex-shrink-0"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// ============================================
// Format Helpers
// ============================================

function formatPlaybookAsText(playbook: NegotiationPlaybook): string {
  const lines: string[] = [];

  lines.push("═".repeat(50));
  lines.push("🛡️ NEGOTIATION PLAYBOOK — ClauseWall");
  lines.push("═".repeat(50));
  lines.push("");
  lines.push(`Contract Type: ${playbook.document_type}`);
  lines.push(`Jurisdiction: ${playbook.jurisdiction}`);
  if (playbook.entity_name)
    lines.push(`Negotiating with: ${playbook.entity_name}`);
  lines.push(`Total Issues: ${playbook.total_issues}`);
  lines.push(`Priority: ${playbook.priority_order}`);
  lines.push("");

  if (playbook.opening_approach) {
    lines.push("── HOW TO START ──");
    lines.push(`"${playbook.opening_approach}"`);
    lines.push("");
  }

  for (const script of playbook.scripts) {
    lines.push("─".repeat(50));
    lines.push(
      `ISSUE: ${script.clause_type.toUpperCase()} (${script.risk_level.toUpperCase()})`,
    );
    lines.push(`Position: ${script.strength}`);
    lines.push(`Summary: ${script.clause_summary}`);
    lines.push("");
    lines.push("YOUR OPENING:");
    lines.push(`"${script.opening_statement}"`);
    lines.push("");

    if (script.counter_responses) {
      for (const cr of script.counter_responses) {
        lines.push(`  If they say: "${cr.they_say}"`);
        lines.push(`  You say: "${cr.you_say}"`);
        lines.push("");
      }
    }

    if (script.escalation) {
      lines.push("IF THEY REFUSE:");
      lines.push(`  Action: ${script.escalation.action}`);
      lines.push(`  Authority: ${script.escalation.authority}`);
      lines.push(`  Law: ${script.escalation.law_reference}`);
    }
    lines.push("");
  }

  if (playbook.closing_statement) {
    lines.push("── HOW TO END ──");
    lines.push(`"${playbook.closing_statement}"`);
    lines.push("");
  }

  if (playbook.general_tips.length > 0) {
    lines.push("── GENERAL TIPS ──");
    for (const tip of playbook.general_tips) {
      lines.push(`💡 ${tip}`);
    }
    lines.push("");
  }

  lines.push("═".repeat(50));
  lines.push("Generated by ClauseWall — Not legal advice");
  lines.push("clausewall.vercel.app");
  lines.push("═".repeat(50));

  return lines.join("\n");
}

function formatScriptAsText(
  script: NegotiationScript,
  entityName: string | null,
): string {
  const lines: string[] = [];

  lines.push("🛡️ NEGOTIATION SCRIPT — ClauseWall");
  lines.push("─".repeat(40));
  lines.push(
    `Issue: ${script.clause_type.toUpperCase()} (${script.risk_level.toUpperCase()})`,
  );
  lines.push(`Position: ${script.strength}`);
  lines.push(`Summary: ${script.clause_summary}`);
  lines.push("");

  lines.push("🗣️ SAY THIS:");
  lines.push(`"${script.opening_statement}"`);
  lines.push("");

  if (script.counter_responses && script.counter_responses.length > 0) {
    lines.push("IF THEY PUSH BACK:");
    for (const cr of script.counter_responses) {
      lines.push(`  They say: "${cr.they_say}"`);
      lines.push(`  You say: "${cr.you_say}"`);
      lines.push("");
    }
  }

  if (script.escalation) {
    lines.push("⚠️ IF THEY REFUSE:");
    lines.push(`  Action: ${script.escalation.action}`);
    lines.push(`  Authority: ${script.escalation.authority}`);
    lines.push(`  Law: ${script.escalation.law_reference}`);
    lines.push("");
  }

  lines.push("— via ClauseWall (clausewall.vercel.app)");

  return lines.join("\n");
}

function formatScriptForWhatsApp(
  script: NegotiationScript,
  entityName: string | null,
): string {
  let text = `🛡️ *Negotiation Script — ClauseWall*\n\n`;

  text += `*Issue:* ${script.clause_type} (${script.risk_level})\n`;
  text += `*Position:* ${script.strength}\n`;
  text += `*Summary:* ${script.clause_summary}\n\n`;

  text += `🗣️ *SAY THIS:*\n`;
  text += `"${script.opening_statement}"\n\n`;

  if (script.counter_responses && script.counter_responses.length > 0) {
    text += `⚔️ *IF THEY PUSH BACK:*\n\n`;
    for (const cr of script.counter_responses) {
      text += `They say: _"${cr.they_say}"_\n`;
      text += `You say: *"${cr.you_say}"*\n\n`;
    }
  }

  if (script.escalation) {
    text += `🚨 *IF THEY REFUSE:*\n`;
    text += `Action: ${script.escalation.action}\n`;
    text += `Authority: ${script.escalation.authority}\n`;
    text += `Law: ${script.escalation.law_reference}\n\n`;
  }

  text += `_Via ClauseWall — clausewall.vercel.app_`;

  return text;
}
