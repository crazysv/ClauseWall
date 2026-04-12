"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { RelatedActions } from "@/components/shared/related-actions";
import { motion, AnimatePresence } from "framer-motion";
import {
  DoorOpen,
  Shield,
  ShieldX,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Scale,
  Gavel,
  FileText,
  Swords,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  XCircle,
  IndianRupee,
  Clock,
  TrendingUp,
  ArrowLeft,
  Download,
  Share2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getStateName, getDocumentTypeLabel } from "@/lib/utils/constants";
import { toast } from "sonner";
import type { Document, EscapePlan } from "@/types";
import dynamic from "next/dynamic";

const AuthoritySection = dynamic(
  () => import("@/components/authority/authority-section"),
  { ssr: false },
);

const STEP_ICONS: Record<string, React.ReactNode> = {
  awareness: <Shield className="h-4 w-4" />,
  notice: <FileText className="h-4 w-4" />,
  negotiate: <Swords className="h-4 w-4" />,
  complaint: <Gavel className="h-4 w-4" />,
  refund: <IndianRupee className="h-4 w-4" />,
};

const STEP_COLORS: Record<
  string,
  { bg: string; text: string; border: string; activeBg: string }
> = {
  awareness: {
    bg: "bg-cyan-950/10",
    text: "text-cyan-400",
    border: "border-cyan-900/50",
    activeBg: "bg-cyan-950/20",
  },
  notice: {
    bg: "bg-amber-950/10",
    text: "text-amber-400",
    border: "border-amber-900/50",
    activeBg: "bg-amber-950/20",
  },
  negotiate: {
    bg: "bg-purple-950/10",
    text: "text-purple-400",
    border: "border-purple-900/50",
    activeBg: "bg-purple-950/20",
  },
  complaint: {
    bg: "bg-red-950/10",
    text: "text-red-400",
    border: "border-red-900/50",
    activeBg: "bg-red-950/20",
  },
  refund: {
    bg: "bg-emerald-950/10",
    text: "text-emerald-400",
    border: "border-emerald-900/50",
    activeBg: "bg-emerald-950/20",
  },
};

const SEVERITY_CONFIG = {
  low: {
    color: "text-emerald-400",
    bg: "bg-emerald-950/20",
    border: "border-emerald-900/50",
    label: "LOW RISK",
  },
  medium: {
    color: "text-amber-400",
    bg: "bg-amber-950/20",
    border: "border-amber-900/50",
    label: "MEDIUM RISK",
  },
  high: {
    color: "text-red-400",
    bg: "bg-red-950/20",
    border: "border-red-900/50",
    label: "HIGH RISK",
  },
  critical: {
    color: "text-red-400",
    bg: "bg-red-950/30",
    border: "border-red-500/50",
    label: "CRITICAL",
  },
};

const PROBABILITY_CONFIG = {
  low: { color: "text-red-400", label: "LOW", width: "25%", barColor: "#f87171" },
  medium: { color: "text-amber-400", label: "MODERATE", width: "50%", barColor: "#fbbf24" },
  high: { color: "text-emerald-400", label: "HIGH", width: "75%", barColor: "#34d399" },
  very_high: { color: "text-emerald-400", label: "VERY HIGH", width: "90%", barColor: "#34d399" },
};

function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatCurrencyFull(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function EscapePlanPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [plan, setPlan] = useState<EscapePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([1]));
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);

  const supabase = createClient();

  // Load checked items from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`cw_escape_checklist_${documentId}`);
    if (saved) {
      try {
        setCheckedItems(new Set(JSON.parse(saved)));
      } catch {
        // ignore
      }
    }
  }, [documentId]);

  // Save checked items
  const toggleCheck = (index: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      localStorage.setItem(
        `cw_escape_checklist_${documentId}`,
        JSON.stringify(Array.from(next)),
      );
      return next;
    });
  };

  const toggleStep = (stepNumber: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepNumber)) {
        next.delete(stepNumber);
      } else {
        next.add(stepNumber);
      }
      return next;
    });
  };

  const fetchEscapePlan = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch document info
      const { data: doc, error: docError } = await supabase
        .from("documents")
        .select("*")
        .eq("id", documentId)
        .single();

      if (docError || !doc) {
        setError("Document not found");
        setLoading(false);
        return;
      }

      setDocument(doc as Document);

      // Generate escape plan
      const res = await fetch("/api/escape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to generate escape plan");
      }

      setPlan(data as EscapePlan);
    } catch (err) {
      console.error("[ClauseWall] Escape plan failed:", err);
      setError("Failed to generate escape plan. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [documentId, supabase]);

  useEffect(() => {
    fetchEscapePlan();
  }, [fetchEscapePlan]);

  const copyPlan = useCallback(() => {
    if (!plan || !document) return;

    const lines = [
      "🚪 ESCAPE PLAN — ClauseWall",
      "",
      `Document: ${document.original_filename || "Contract"}`,
      `Risk Score: ${document.overall_risk_score}/100`,
      `Total Recoverable: ${formatCurrencyFull(plan.total_recoverable)}`,
      "",
      "VOID CLAUSES:",
    ];

    plan.void_clauses.forEach((vc, i) => {
      lines.push(`${i + 1}. Clause #${vc.clause_number} — ${vc.why_void}`);
      lines.push(`   Law: ${vc.law}`);
      if (vc.recoverable_amount > 0) {
        lines.push(
          `   Recoverable: ${formatCurrencyFull(vc.recoverable_amount)}`,
        );
      }
      lines.push("");
    });

    lines.push("ESCAPE STEPS:");
    plan.escape_steps.forEach((step) => {
      lines.push(`Step ${step.step_number}: ${step.title} (${step.timeframe})`);
      lines.push(`  ${step.description}`);
      lines.push("");
    });

    lines.push("IMMEDIATE ACTIONS:");
    plan.immediate_actions.forEach((a) => lines.push(`☐ ${a}`));
    lines.push("");
    lines.push("Generated by ClauseWall — AI Contract Intelligence for India");

    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    toast.success("Escape plan copied!");
    setTimeout(() => setCopied(false), 2000);
  }, [plan, document]);

  // Loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] gap-6 px-4">
        <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
        <div className="text-center">
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-neutral-200 mb-2">
            Generating Escape Plan
          </h2>
          <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 mt-2">
            Finding loopholes. Calculating recovery.
          </p>
        </div>
      </div>
    );
  }

  // Error
  if (error || !document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] gap-6 px-4">
        <div className="border border-neutral-900 p-8 text-center max-w-md bg-[#0a0a0a]">
          <XCircle className="h-10 w-10 text-red-400 mx-auto mb-4" />
          <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 mb-6">
            {error || "Something went wrong"}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={fetchEscapePlan}
              className="px-4 py-2 border border-cyan-900/50 bg-cyan-950/10 text-cyan-400 text-[8px] font-mono uppercase tracking-widest hover:text-cyan-300 hover:border-cyan-800 transition-colors"
            >
              Try Again
            </button>
            <Link
              href={`/results/${documentId}`}
              className="px-4 py-2 border border-neutral-800 bg-[#050505] text-neutral-400 text-[8px] font-mono uppercase tracking-widest hover:text-neutral-200 hover:border-neutral-600 transition-colors text-center"
            >
              Back to Results
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  const severity = SEVERITY_CONFIG[plan.severity] || SEVERITY_CONFIG.medium;
  const probability =
    PROBABILITY_CONFIG[plan.success_probability] || PROBABILITY_CONFIG.medium;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200">
      {/* Header */}
      <div className="border-b border-neutral-800 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push(`/results/${documentId}`)}
            className="p-2 border border-neutral-800 bg-[#050505] hover:border-neutral-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-neutral-400" />
          </button>
          <div>
            <h1 className="text-[10px] font-mono uppercase tracking-widest text-neutral-200">
              Escape Plan
            </h1>
            <p className="text-[7px] font-mono uppercase tracking-widest text-neutral-600 mt-0.5">
              ClauseWall Contract Exit Strategy
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Doc metadata */}
        <div className="flex flex-wrap items-center gap-1.5 mb-6">
          {[
            { icon: <FileText className="h-2.5 w-2.5" />, label: document.original_filename || "Contract" },
            { icon: null, label: getDocumentTypeLabel(document.document_type) },
            { icon: null, label: getStateName(document.jurisdiction) },
          ].map((pill, i) => (
            <span
              key={i}
              className="text-[7px] font-mono uppercase tracking-widest text-neutral-500 bg-[#050505] border border-neutral-800 px-2 py-0.5 flex items-center gap-1.5"
            >
              {pill.icon}
              {pill.label}
            </span>
          ))}
        </div>

        {/* ── Escape Verdict ── */}
        <div
          className={`mb-10 border ${
            plan.can_escape ? "border-emerald-900/50" : "border-red-900/50"
          }`}
        >
          {/* Top Verdict Bar */}
          <div
            className={`p-4 sm:p-5 border-b flex items-center gap-3 ${
              plan.can_escape
                ? "bg-emerald-950/30 border-emerald-900/50"
                : "bg-red-950/30 border-red-900/50"
            }`}
          >
            <div
              className={`p-2 border ${
                plan.can_escape
                  ? "border-emerald-900/50 bg-emerald-950/20"
                  : "border-red-900/50 bg-red-950/20"
              }`}
            >
              {plan.can_escape ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              ) : (
                <ShieldX className="h-5 w-5 text-red-400" />
              )}
            </div>
            <h2
              className={`text-[10px] font-mono uppercase tracking-widest ${
                plan.can_escape ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {plan.can_escape
                ? "You can escape this contract"
                : "Limited escape options"}
            </h2>
          </div>

          {/* Main Stats */}
          <div className="p-5 sm:p-6">
            <p className="text-[8px] font-mono text-neutral-400 leading-relaxed mb-6 border-l-2 border-neutral-700 pl-3">
              {plan.summary}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                {
                  label: "Recoverable",
                  value: plan.total_recoverable > 0 ? formatCurrency(plan.total_recoverable) : "—",
                  color: "text-emerald-400",
                  bg: "bg-emerald-950/10",
                  border: "border-emerald-900/50",
                },
                {
                  label: "Void Clauses",
                  value: plan.void_clauses.length,
                  color: "text-amber-400",
                  bg: "bg-amber-950/10",
                  border: "border-amber-900/50",
                },
                {
                  label: "Timeline",
                  value: plan.estimated_timeline,
                  color: "text-cyan-400",
                  bg: "bg-cyan-950/10",
                  border: "border-cyan-900/50",
                },
                {
                  label: "Success Rate",
                  value: probability.label,
                  color: probability.color,
                  bg: "bg-[#050505]",
                  border: "border-neutral-800",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`p-3 border ${stat.bg} ${stat.border}`}
                >
                  <p className="text-[7px] font-mono uppercase tracking-widest text-neutral-600 mb-1">
                    {stat.label}
                  </p>
                  <p
                    className={`text-sm font-mono tabular-nums uppercase tracking-tight truncate ${stat.color}`}
                  >
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Void Clauses ── */}
        {plan.void_clauses.length > 0 && (
          <div className="mb-10">
            <h2 className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2 border-b border-neutral-800 pb-2">
              <Scale className="h-3.5 w-3.5" />
              Void Clauses — Cannot Be Enforced
            </h2>
            <div className="space-y-3">
              {plan.void_clauses.map((vc, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-[#0a0a0a] border border-neutral-900 overflow-hidden"
                >
                  {/* Header */}
                  <div className="bg-red-950/20 border-b border-red-900/50 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[7px] font-mono uppercase tracking-widest text-neutral-300 bg-[#050505] border border-neutral-800 px-1.5 py-0.5">
                          Clause #{vc.clause_number}
                        </span>
                        <span
                          className={`text-[7px] font-mono uppercase tracking-widest px-1.5 py-0.5 border ${
                            vc.void_type === "fully_void"
                              ? "bg-red-950/30 text-red-400 border-red-900/50"
                              : "bg-amber-950/20 text-amber-400 border-amber-900/50"
                          }`}
                        >
                          {vc.void_type === "fully_void"
                            ? "Fully Void"
                            : "Partially Void"}
                        </span>
                      </div>
                      <p className="text-[8px] font-mono text-neutral-300 uppercase tracking-wide">
                        {vc.why_void}
                      </p>
                    </div>
                    {vc.recoverable_amount > 0 && (
                      <div className="flex-shrink-0 bg-emerald-950/20 border border-emerald-900/50 px-3 py-1.5 text-right sm:text-center w-full sm:w-auto flex justify-between sm:block">
                        <p className="text-[7px] font-mono uppercase tracking-widest text-neutral-500">
                          Recoverable
                        </p>
                        <p className="text-sm font-mono tabular-nums text-emerald-400">
                          {formatCurrency(vc.recoverable_amount)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="p-3 bg-[#050505] border border-neutral-800">
                      <p className="text-[8px] font-mono text-neutral-500 italic line-clamp-3 leading-relaxed">
                        &quot;{vc.clause_text}&quot;
                      </p>
                    </div>

                    <div className="p-3 bg-cyan-950/10 border-l-2 border-cyan-500">
                      <p className="text-[7px] font-mono uppercase tracking-widest text-cyan-400 mb-1.5 border-b border-cyan-900/30 pb-1">
                        📖 Legal Basis
                      </p>
                      <p className="text-[8px] font-mono text-neutral-300 mb-0.5">
                        {vc.law}
                      </p>
                      <p className="text-[7px] font-mono text-neutral-500 leading-relaxed">
                        {vc.law_explanation}
                      </p>
                    </div>

                    {vc.enforceable_portion && (
                      <div className="p-3 bg-amber-950/10 border-l-2 border-amber-500">
                        <p className="text-[7px] font-mono uppercase tracking-widest text-amber-400 mb-1.5 border-b border-amber-900/30 pb-1">
                          ⚠️ What Is Enforceable
                        </p>
                        <p className="text-[8px] font-mono text-neutral-400 leading-relaxed">
                          {vc.enforceable_portion}
                        </p>
                      </div>
                    )}

                    <div className="p-3 bg-emerald-950/10 border-l-2 border-emerald-500">
                      <p className="text-[7px] font-mono uppercase tracking-widest text-emerald-400 mb-1.5 border-b border-emerald-900/30 pb-1">
                        🔄 How to Recover
                      </p>
                      <p className="text-[8px] font-mono text-neutral-400 leading-relaxed">
                        {vc.recovery_method}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step-by-Step Escape ── */}
        {plan.escape_steps.length > 0 && (
          <div className="mb-10">
            <h2 className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2 border-b border-neutral-800 pb-2">
              <TrendingUp className="h-3.5 w-3.5" />
              Step-by-Step Escape Plan
            </h2>

            {/* Progress Steps (horizontal) */}
            <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-3 custom-scrollbar">
              {plan.escape_steps.map((step, i) => {
                const stepColor =
                  STEP_COLORS[step.action_type] || STEP_COLORS.awareness;
                return (
                  <div key={i} className="flex items-center flex-shrink-0">
                    <button
                      onClick={() => toggleStep(step.step_number)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[7px] font-mono uppercase tracking-widest transition-colors whitespace-nowrap border ${
                        expandedSteps.has(step.step_number)
                          ? `${stepColor.activeBg} ${stepColor.text} ${stepColor.border}`
                          : "bg-[#050505] text-neutral-600 border-neutral-800 hover:text-neutral-400 hover:border-neutral-600"
                      }`}
                    >
                      <span>{step.step_number}</span>
                      {step.title}
                    </button>
                    {i < plan.escape_steps.length - 1 && (
                      <div className="w-4 h-px bg-neutral-800 mx-1" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step Cards */}
            <div className="space-y-3">
              {plan.escape_steps.map((step, i) => {
                const isExpanded = expandedSteps.has(step.step_number);
                const stepColor =
                  STEP_COLORS[step.action_type] || STEP_COLORS.awareness;

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-[#0a0a0a] border border-neutral-900 overflow-hidden"
                  >
                    {/* Step Header */}
                    <button
                      onClick={() => toggleStep(step.step_number)}
                      className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
                        isExpanded ? stepColor.activeBg : "hover:bg-[#111111]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 border ${stepColor.border} bg-[#050505]`}
                        >
                          <span className={stepColor.text}>
                            {STEP_ICONS[step.action_type] ||
                              STEP_ICONS.awareness}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[8px] font-mono ${stepColor.text}`}
                            >
                              Step {step.step_number}
                            </span>
                            <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-200">
                              {step.title}
                            </span>
                          </div>
                          <p className="text-[7px] font-mono uppercase tracking-widest text-neutral-600 mt-0.5 flex items-center gap-1.5">
                            <Clock className="h-2.5 w-2.5" />
                            {step.timeframe}
                          </p>
                        </div>
                      </div>
                      <div className="p-1.5 border border-neutral-800 bg-[#050505]">
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5 text-neutral-500" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-4 border-t border-neutral-800 pt-4">
                            <p className="text-[8px] font-mono text-neutral-400 leading-relaxed">
                              {step.details}
                            </p>

                            {/* Link to ClauseWall tools */}
                            {step.link_to && (
                              <Link
                                href={
                                  step.link_to === "letter"
                                    ? `/letter/${documentId}`
                                    : `/negotiate/${documentId}`
                                }
                                className="flex items-center justify-between p-3 bg-cyan-950/10 border border-cyan-900/50 hover:border-cyan-800 transition-colors group"
                              >
                                <div className="flex items-center gap-2">
                                  {step.link_to === "letter" ? (
                                    <FileText className="h-3.5 w-3.5 text-cyan-400" />
                                  ) : (
                                    <Swords className="h-3.5 w-3.5 text-cyan-400" />
                                  )}
                                  <span className="text-[8px] text-cyan-400 font-mono uppercase tracking-widest">
                                    {step.link_to === "letter"
                                      ? "Generate Legal Notice"
                                      : "View Negotiation Playbook"}
                                  </span>
                                </div>
                                <ExternalLink className="h-3 w-3 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
                              </Link>
                            )}

                            {/* Authorities */}
                            {step.authorities &&
                              step.authorities.length > 0 && (
                                <div className="space-y-3">
                                  <p className="text-[7px] font-mono text-neutral-500 uppercase tracking-widest border-b border-neutral-800 pb-1">
                                    Where to file
                                  </p>
                                  {step.authorities.map((auth, ai) => (
                                    <div
                                      key={ai}
                                      className="p-3 bg-[#050505] border border-neutral-800"
                                    >
                                      <div className="flex items-start justify-between gap-3 mb-2">
                                        <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-200">
                                          {auth.name}
                                        </p>
                                        <span className="text-[7px] font-mono uppercase tracking-widest text-neutral-500 border border-neutral-700 px-1.5 py-0.5 bg-[#0a0a0a]">
                                          {auth.jurisdiction}
                                        </span>
                                      </div>
                                      <p className="text-[8px] font-mono text-neutral-400 mb-3 border-l-2 border-neutral-700 pl-2">
                                        For: {auth.for}
                                      </p>
                                      <div className="flex flex-col sm:flex-row gap-3 sm:items-center text-[7px] font-mono uppercase tracking-widest text-neutral-400 bg-[#0a0a0a] border border-neutral-800 p-2">
                                        <span className="flex items-center gap-1.5">
                                          💰 {auth.cost}
                                        </span>
                                        <span className="hidden sm:inline text-neutral-700">
                                          •
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                          ⏰ {auth.timeline}
                                        </span>
                                      </div>
                                      {auth.how_to_file && (
                                        <p className="text-[7px] font-mono text-amber-400 mt-2 bg-amber-950/10 p-2 border-l-2 border-amber-500 leading-relaxed">
                                          {auth.how_to_file}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
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

        {/* ── Money Recovery ── */}
        {plan.recovery.items.length > 0 && (
          <div className="border border-emerald-900/50 mb-10">
            <h2 className="text-[9px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-950/20 p-4 flex items-center gap-2 border-b border-emerald-900/50">
              <IndianRupee className="h-4 w-4" />
              Money Recovery Breakdown
            </h2>

            <div className="p-4 sm:p-5 space-y-2">
              {plan.recovery.items.map((item, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-[#050505] border border-neutral-800"
                >
                  <div>
                    <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-300 mb-0.5">
                      {item.label}
                    </p>
                    <p className="text-[7px] font-mono text-neutral-500 leading-relaxed">
                      {item.explanation}
                    </p>
                  </div>
                  <p className="text-sm font-mono tabular-nums text-emerald-400 flex-shrink-0 sm:ml-4 mt-2 sm:mt-0">
                    {formatCurrencyFull(item.amount)}
                  </p>
                </div>
              ))}

              {plan.recovery.interest_amount > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-amber-950/10 border border-amber-900/50">
                  <div>
                    <p className="text-[8px] font-mono uppercase tracking-widest text-amber-400 mb-0.5">
                      Interest
                    </p>
                    <p className="text-[7px] font-mono text-neutral-500">
                      @ {plan.recovery.interest_rate}
                    </p>
                  </div>
                  <p className="text-sm font-mono tabular-nums text-emerald-400 flex-shrink-0 sm:ml-4 mt-2 sm:mt-0">
                    {formatCurrencyFull(plan.recovery.interest_amount)}
                  </p>
                </div>
              )}

              <div className="border border-emerald-900/50 bg-emerald-950/20 p-4 mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-400 mb-2 sm:mb-0">
                  Total Recoverable
                </p>
                <p className="text-2xl font-mono tabular-nums text-emerald-400">
                  {formatCurrencyFull(plan.recovery.total)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Immediate Actions Checklist ── */}
        {plan.immediate_actions.length > 0 && (
          <div className="border border-neutral-900 mb-10">
            <div className="p-4 sm:p-5">
              <h2 className="text-[9px] font-mono uppercase tracking-widest text-amber-400 mb-4 flex items-center gap-2 border-b border-neutral-800 pb-2">
                <AlertTriangle className="h-3.5 w-3.5" />
                Do This Right Now
              </h2>
              <div className="space-y-2">
                {plan.immediate_actions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => toggleCheck(i)}
                    className={`w-full flex items-start gap-3 p-3 border transition-colors text-left ${
                      checkedItems.has(i)
                        ? "bg-emerald-950/10 border-emerald-900/50 opacity-60"
                        : "bg-[#050505] border-neutral-800 hover:border-neutral-600"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 border flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                        checkedItems.has(i)
                          ? "bg-emerald-500 border-emerald-400"
                          : "border-neutral-700 bg-[#0a0a0a]"
                      }`}
                    >
                      {checkedItems.has(i) && (
                        <Check className="h-2.5 w-2.5 text-black" />
                      )}
                    </div>
                    <span
                      className={`text-[8px] font-mono leading-relaxed ${
                        checkedItems.has(i)
                          ? "text-emerald-400 line-through"
                          : "text-neutral-400"
                      }`}
                    >
                      {action}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-[7px] font-mono uppercase tracking-widest text-neutral-600 mt-4 border-t border-neutral-800 pt-3">
                ✓ {checkedItems.size}/{plan.immediate_actions.length} completed
                — Your progress is saved
              </p>
            </div>
          </div>
        )}

        {/* ── Success Probability ── */}
        <div className="border border-neutral-900 mb-10">
          <div className="p-4 sm:p-5">
            <h2 className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2 border-b border-neutral-800 pb-2">
              <TrendingUp className="h-3.5 w-3.5" />
              Success Probability
            </h2>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[7px] font-mono uppercase tracking-widest text-neutral-600">
                  Likelihood of favorable outcome
                </span>
                <span
                  className={`text-[8px] font-mono uppercase tracking-widest ${probability.color}`}
                >
                  {probability.label}
                </span>
              </div>
              <div className="w-full h-2 bg-[#050505] border border-neutral-800 overflow-hidden relative">
                <motion.div
                  className="h-full"
                  initial={{ width: 0 }}
                  animate={{ width: probability.width }}
                  transition={{ duration: 1, delay: 0.5 }}
                  style={{
                    backgroundColor: probability.barColor,
                    opacity: 0.7,
                  }}
                />
              </div>
            </div>
            <p className="text-[8px] font-mono text-neutral-400 leading-relaxed border-l-2 border-neutral-700 pl-3">
              {plan.success_explanation}
            </p>
          </div>
        </div>

        {/* ── Disclaimers ── */}
        {plan.warnings.length > 0 && (
          <div className="border border-amber-900/50 bg-amber-950/10 mb-10">
            <div className="p-4">
              <p className="text-[8px] font-mono uppercase tracking-widest text-amber-400 mb-3 border-b border-amber-900/30 pb-2 flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3" />
                Important Disclaimers
              </p>
              <ul className="space-y-2">
                {plan.warnings.map((w, i) => (
                  <li
                    key={i}
                    className="text-[8px] font-mono text-neutral-400 flex items-start gap-2 leading-relaxed"
                  >
                    <span className="text-amber-500 text-sm leading-none mt-0.5">
                      •
                    </span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── Action Bar ── */}
        <div className="flex flex-wrap gap-2 mb-10">
          <button
            onClick={copyPlan}
            className="flex items-center gap-2 px-4 py-2.5 border border-neutral-800 bg-[#050505] text-neutral-400 text-[8px] font-mono uppercase tracking-widest hover:text-neutral-200 hover:border-neutral-600 transition-colors"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "Copied Plan!" : "Copy Escape Plan"}
          </button>
        </div>

        {/* ── File Your Complaint Here ── */}
        <div className="mt-6">
          <AuthoritySection
            documentType={document.document_type}
            jurisdiction={document.jurisdiction}
            entityName={document.entity_name || ""}
            clauseTypes={plan.void_clauses
              .map((vc) => vc.why_void)
              .filter(Boolean)}
            preloadedRouting={(document as any).authority_routing || null}
          />
        </div>

        {/* Related Actions */}
        <div className="mt-6">
          <RelatedActions documentId={documentId} currentPage="escape" />
        </div>
      </div>
    </div>
  );
}
