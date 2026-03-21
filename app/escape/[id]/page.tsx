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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { getStateName, getDocumentTypeLabel } from "@/lib/utils/constants";
import { toast } from "sonner";
import type { Document, EscapePlan } from "@/types";

const STEP_ICONS: Record<string, React.ReactNode> = {
  awareness: <Shield className="h-5 w-5" />,
  notice: <FileText className="h-5 w-5" />,
  negotiate: <Swords className="h-5 w-5" />,
  complaint: <Gavel className="h-5 w-5" />,
  refund: <IndianRupee className="h-5 w-5" />,
};

const STEP_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  awareness: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  notice: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
  negotiate: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
  complaint: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  refund: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
};

const SEVERITY_CONFIG = {
  low: { color: "text-green-400", bg: "bg-green-500/10", label: "Low Risk" },
  medium: { color: "text-yellow-400", bg: "bg-yellow-500/10", label: "Medium Risk" },
  high: { color: "text-red-400", bg: "bg-red-500/10", label: "High Risk" },
  critical: { color: "text-purple-400", bg: "bg-purple-500/10", label: "Critical" },
};

const PROBABILITY_CONFIG = {
  low: { color: "text-red-400", label: "Low", width: "25%" },
  medium: { color: "text-yellow-400", label: "Moderate", width: "50%" },
  high: { color: "text-green-400", label: "High", width: "75%" },
  very_high: { color: "text-green-400", label: "Very High", width: "90%" },
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
        JSON.stringify(Array.from(next))
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
        lines.push(`   Recoverable: ${formatCurrencyFull(vc.recoverable_amount)}`);
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        <div className="relative">
          <Loader2 className="h-16 w-16 text-orange-500 animate-spin" />
          <div className="absolute inset-0 h-16 w-16 bg-orange-500/20 blur-xl rounded-full animate-pulse" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Generating Your Escape Plan</h2>
          <p className="text-muted-foreground max-w-md">
            Analyzing void clauses, calculating recoverable amounts, and building your step-by-step exit strategy...
          </p>
        </div>
      </div>
    );
  }

  // Error
  if (error || !document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <XCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-400 text-center">{error || "Something went wrong"}</p>
        <div className="flex gap-3">
          <Button onClick={fetchEscapePlan} variant="outline">
            Try Again
          </Button>
          <Link href={`/results/${documentId}`}>
            <Button variant="outline">Back to Results</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  const severity = SEVERITY_CONFIG[plan.severity] || SEVERITY_CONFIG.medium;
  const probability = PROBABILITY_CONFIG[plan.success_probability] || PROBABILITY_CONFIG.medium;

  return (
    <div className="relative px-4 sm:px-6 lg:px-8 py-8">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/results/${documentId}`)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Results
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <FileText className="h-4 w-4" />
            <span>{document.original_filename || "Contract"}</span>
            <span>•</span>
            <span>{getDocumentTypeLabel(document.document_type)}</span>
            <span>•</span>
            <span>{getStateName(document.jurisdiction)}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <DoorOpen className="h-7 w-7 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Your Escape Plan</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Already signed? Here&apos;s how to protect yourself.
              </p>
            </div>
          </div>
        </div>

        {/* ── Escape Verdict ── */}
        <Card
          className={`mb-6 ${
            plan.can_escape
              ? "bg-green-500/5 border-green-500/20"
              : "bg-red-500/5 border-red-500/20"
          }`}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-xl ${
                  plan.can_escape ? "bg-green-500/15" : "bg-red-500/15"
                }`}
              >
                {plan.can_escape ? (
                  <CheckCircle2 className="h-8 w-8 text-green-400" />
                ) : (
                  <ShieldX className="h-8 w-8 text-red-400" />
                )}
              </div>
              <div className="flex-1">
                <h2
                  className={`text-xl font-bold mb-1 ${
                    plan.can_escape ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {plan.can_escape
                    ? "You CAN Escape This Contract"
                    : "Limited Escape Options"}
                </h2>
                <p className="text-sm text-gray-300 leading-relaxed mb-4">
                  {plan.summary}
                </p>

                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className="text-xs text-gray-500 mb-0.5">Recoverable</p>
                    <p className="text-lg font-bold text-green-400">
                      {plan.total_recoverable > 0
                        ? formatCurrency(plan.total_recoverable)
                        : "—"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className="text-xs text-gray-500 mb-0.5">Void Clauses</p>
                    <p className="text-lg font-bold text-orange-400">
                      {plan.void_clauses.length}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className="text-xs text-gray-500 mb-0.5">Timeline</p>
                    <p className="text-lg font-bold text-blue-400">
                      {plan.estimated_timeline}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className="text-xs text-gray-500 mb-0.5">Success Rate</p>
                    <p className={`text-lg font-bold ${probability.color}`}>
                      {probability.label}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Void Clauses ── */}
        {plan.void_clauses.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Scale className="h-5 w-5 text-orange-400" />
              Void Clauses — Cannot Be Enforced
            </h2>
            <div className="space-y-3">
              {plan.void_clauses.map((vc, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card className="bg-gray-900/50 border-red-500/20 border-l-4 border-l-red-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-xs">
                              Clause #{vc.clause_number}
                            </Badge>
                            <Badge
                              className={`text-xs ${
                                vc.void_type === "fully_void"
                                  ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                                  : "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
                              }`}
                            >
                              {vc.void_type === "fully_void"
                                ? "Fully Void"
                                : "Partially Void"}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-red-300">
                            {vc.why_void}
                          </p>
                        </div>
                        {vc.recoverable_amount > 0 && (
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-gray-500">Recoverable</p>
                            <p className="text-lg font-bold text-green-400">
                              {formatCurrency(vc.recoverable_amount)}
                            </p>
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-gray-400 italic mb-3 line-clamp-2">
                        &quot;{vc.clause_text}&quot;
                      </p>

                      <div className="space-y-2">
                        <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/15">
                          <p className="text-xs font-medium text-blue-400 mb-1">
                            📖 Legal Basis
                          </p>
                          <p className="text-sm text-blue-300 font-medium">
                            {vc.law}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {vc.law_explanation}
                          </p>
                        </div>

                        {vc.enforceable_portion && (
                          <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/15">
                            <p className="text-xs font-medium text-yellow-400 mb-1">
                              ⚠️ What IS Enforceable
                            </p>
                            <p className="text-sm text-yellow-300">
                              {vc.enforceable_portion}
                            </p>
                          </div>
                        )}

                        <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/15">
                          <p className="text-xs font-medium text-green-400 mb-1">
                            🔄 How to Recover
                          </p>
                          <p className="text-sm text-green-300">
                            {vc.recovery_method}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step-by-Step Escape ── */}
        {plan.escape_steps.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              Step-by-Step Escape Plan
            </h2>

            {/* Progress Steps (horizontal) */}
            <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2">
              {plan.escape_steps.map((step, i) => {
                const stepColor =
                  STEP_COLORS[step.action_type] || STEP_COLORS.awareness;
                return (
                  <div key={i} className="flex items-center">
                    <button
                      onClick={() => toggleStep(step.step_number)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                        expandedSteps.has(step.step_number)
                          ? `${stepColor.bg} ${stepColor.text} border ${stepColor.border}`
                          : "bg-white/5 text-gray-500 border border-white/5 hover:text-gray-300"
                      }`}
                    >
                      <span className="font-bold">{"①②③④⑤⑥⑦⑧⑨⑩"[step.step_number - 1] || step.step_number}</span>
                      {step.title}
                    </button>
                    {i < plan.escape_steps.length - 1 && (
                      <div className="w-4 h-px bg-gray-700 mx-0.5" />
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
                const CIRCLED = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card
                      className={`bg-gray-900/50 border-gray-800 overflow-hidden ${
                        isExpanded ? `border-l-4 ${stepColor.border.replace("border-", "border-l-")}` : ""
                      }`}
                    >
                      {/* Step Header */}
                      <button
                        onClick={() => toggleStep(step.step_number)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${stepColor.bg}`}>
                            <span className={stepColor.text}>
                              {STEP_ICONS[step.action_type] || STEP_ICONS.awareness}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold ${stepColor.text}`}>
                                {CIRCLED[step.step_number - 1] || `Step ${step.step_number}`}
                              </span>
                              <span className="font-semibold text-sm">
                                {step.title}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {step.timeframe}
                            </p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
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
                            <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                              <p className="text-sm text-gray-300 leading-relaxed">
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
                                  className="flex items-center justify-between p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 hover:bg-blue-500/10 transition-colors group"
                                >
                                  <div className="flex items-center gap-2">
                                    {step.link_to === "letter" ? (
                                      <FileText className="h-4 w-4 text-blue-400" />
                                    ) : (
                                      <Swords className="h-4 w-4 text-blue-400" />
                                    )}
                                    <span className="text-sm text-blue-400 font-medium">
                                      {step.link_to === "letter"
                                        ? "Generate Legal Notice →"
                                        : "View Negotiation Playbook →"}
                                    </span>
                                  </div>
                                  <ExternalLink className="h-4 w-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
                                </Link>
                              )}

                              {/* Authorities */}
                              {step.authorities && step.authorities.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Where to File
                                  </p>
                                  {step.authorities.map((auth, ai) => (
                                    <div
                                      key={ai}
                                      className="p-3 rounded-lg bg-white/[0.03] border border-white/5"
                                    >
                                      <div className="flex items-start justify-between gap-2 mb-1">
                                        <p className="text-sm font-medium text-white">
                                          {auth.name}
                                        </p>
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] border-white/10 text-gray-500"
                                        >
                                          {auth.jurisdiction}
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-gray-400 mb-2">
                                        For: {auth.for}
                                      </p>
                                      <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span>💰 Cost: {auth.cost}</span>
                                        <span>⏰ Timeline: {auth.timeline}</span>
                                      </div>
                                      {auth.how_to_file && (
                                        <p className="text-xs text-gray-400 mt-2 italic">
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
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Money Recovery ── */}
        {plan.recovery.items.length > 0 && (
          <Card className="bg-gray-900/50 border-green-500/20 mb-8">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-green-400" />
                Money Recovery Breakdown
              </h2>

              <div className="space-y-3 mb-4">
                {plan.recovery.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03]"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-300">
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-500">{item.explanation}</p>
                    </div>
                    <p className="text-lg font-bold text-green-400 flex-shrink-0 ml-4">
                      {formatCurrencyFull(item.amount)}
                    </p>
                  </div>
                ))}

                {plan.recovery.interest_amount > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03]">
                    <div>
                      <p className="text-sm font-medium text-gray-300">
                        Interest
                      </p>
                      <p className="text-xs text-gray-500">
                        @ {plan.recovery.interest_rate}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-green-400 flex-shrink-0 ml-4">
                      {formatCurrencyFull(plan.recovery.interest_amount)}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                <p className="text-sm font-bold text-gray-300">
                  TOTAL RECOVERABLE
                </p>
                <p className="text-2xl font-bold text-green-400">
                  {formatCurrencyFull(plan.recovery.total)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Immediate Actions Checklist ── */}
        {plan.immediate_actions.length > 0 && (
          <Card className="bg-gray-900/50 border-orange-500/20 mb-8">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-400" />
                Do This RIGHT NOW
              </h2>
              <div className="space-y-2">
                {plan.immediate_actions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => toggleCheck(i)}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all ${
                      checkedItems.has(i)
                        ? "bg-green-500/5 border border-green-500/15"
                        : "bg-white/[0.03] border border-white/5 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                        checkedItems.has(i)
                          ? "bg-green-500 border-green-500"
                          : "border-gray-600"
                      }`}
                    >
                      {checkedItems.has(i) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        checkedItems.has(i)
                          ? "text-green-400 line-through"
                          : "text-gray-300"
                      }`}
                    >
                      {action}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-3">
                ✓ {checkedItems.size}/{plan.immediate_actions.length} completed
                — your progress is saved
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── Success Probability ── */}
        <Card className="bg-gray-900/50 border-gray-800 mb-8">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              Success Probability
            </h2>
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-gray-400">Likelihood of favorable outcome</span>
                <span className={`text-sm font-bold ${probability.color}`}>
                  {probability.label}
                </span>
              </div>
              <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                  initial={{ width: 0 }}
                  animate={{ width: probability.width }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              {plan.success_explanation}
            </p>
          </CardContent>
        </Card>

        {/* ── Disclaimers ── */}
        {plan.warnings.length > 0 && (
          <Card className="bg-gray-900/50 border-yellow-500/10 mb-8">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-yellow-400/70 mb-2">
                ⚠️ Important Disclaimers
              </p>
              <ul className="space-y-1">
                {plan.warnings.map((w, i) => (
                  <li key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                    <span className="text-yellow-500/50 mt-0.5">•</span>
                    {w}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* ── Action Bar ── */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={copyPlan}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copied!" : "Copy Plan"}
          </Button>
        </div>

        {/* Related Actions */}
        <RelatedActions documentId={documentId} currentPage="escape" />
      </div>
    </div>
  );
}