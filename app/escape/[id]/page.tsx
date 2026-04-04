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
import dynamic from "next/dynamic";

const AuthoritySection = dynamic(
  () => import("@/components/authority/authority-section"),
  { ssr: false }
);

const STEP_ICONS: Record<string, React.ReactNode> = {
  awareness: <Shield className="h-5 w-5" />,
  notice: <FileText className="h-5 w-5" />,
  negotiate: <Swords className="h-5 w-5" />,
  complaint: <Gavel className="h-5 w-5" />,
  refund: <IndianRupee className="h-5 w-5" />,
};

const STEP_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  awareness: { bg: "bg-blue-100", text: "text-blue-900", border: "border-black" },
  notice: { bg: "bg-yellow-100", text: "text-yellow-900", border: "border-black" },
  negotiate: { bg: "bg-purple-100", text: "text-purple-900", border: "border-black" },
  complaint: { bg: "bg-red-100", text: "text-red-900", border: "border-black" },
  refund: { bg: "bg-green-100", text: "text-green-900", border: "border-black" },
};

const SEVERITY_CONFIG = {
  low: { color: "text-green-700", bg: "bg-green-400", label: "LOW RISK" },
  medium: { color: "text-yellow-700", bg: "bg-yellow-400", label: "MEDIUM RISK" },
  high: { color: "text-red-700", bg: "bg-red-400", label: "HIGH RISK" },
  critical: { color: "text-purple-700", bg: "bg-purple-400", label: "CRITICAL" },
};

const PROBABILITY_CONFIG = {
  low: { color: "text-red-700", label: "LOW", width: "25%" },
  medium: { color: "text-yellow-700", label: "MODERATE", width: "50%" },
  high: { color: "text-green-700", label: "HIGH", width: "75%" },
  very_high: { color: "text-green-700", label: "VERY HIGH", width: "90%" },
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
        <Loader2 className="h-16 w-16 text-black animate-spin" />
        <div className="text-center">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-black mb-2 border-b-4 border-black pb-2">GENERATING ESCAPE PLAN</h2>
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mt-4">
            FINDING LOOPHOLES. CALCULATING RECOVERY.
          </p>
        </div>
      </div>
    );
  }

  // Error
  if (error || !document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center max-w-md">
          <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <p className="text-2xl font-black text-red-700 uppercase tracking-tighter mb-8">{error || "Something went wrong"}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={fetchEscapePlan} className="border-2 border-black font-black uppercase tracking-wider rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all">
              TRY AGAIN
            </Button>
            <Link href={`/results/${documentId}`}>
              <Button variant="outline" className="border-2 border-black font-black uppercase tracking-wider rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all">BACK TO RESULTS</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  const severity = SEVERITY_CONFIG[plan.severity] || SEVERITY_CONFIG.medium;
  const probability = PROBABILITY_CONFIG[plan.success_probability] || PROBABILITY_CONFIG.medium;

  return (
    <div className="relative px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen">
      <div className="relative mx-auto max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/results/${documentId}`)}
          className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-black transition-all hover:-translate-x-1 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          BACK TO RESULTS
        </button>

        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-wrap items-center gap-2 text-black font-bold uppercase tracking-widest text-xs mb-4">
            <span className="bg-white border-2 border-black px-2 py-1 flex items-center gap-2"><FileText className="h-3 w-3" /> {document.original_filename || "Contract"}</span>
            <span className="bg-white border-2 border-black px-2 py-1">{getDocumentTypeLabel(document.document_type)}</span>
            <span className="bg-white border-2 border-black px-2 py-1">{getStateName(document.jurisdiction)}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 border-4 border-black bg-orange-400 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <DoorOpen className="h-8 w-8 text-black" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-black">ESCAPE PLAN</h1>
              <p className="text-sm font-bold tracking-widest uppercase text-muted-foreground mt-2">
                ALREADY SIGNED? HERE'S HOW TO BREAK IT.
              </p>
            </div>
          </div>
        </div>

        {/* ── Escape Verdict ── */}
        <Card
          className={`mb-12 border-4 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white`}
        >
          <CardContent className="p-0">
            {/* Top Verdict Bar */}
            <div className={`p-6 border-b-4 border-black flex items-center gap-4 ${
              plan.can_escape ? "bg-green-400" : "bg-red-500"
            }`}>
              <div className="bg-white border-2 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {plan.can_escape ? (
                  <CheckCircle2 className="h-8 w-8 text-black" />
                ) : (
                  <ShieldX className="h-8 w-8 text-black" />
                )}
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-black">
                {plan.can_escape
                  ? "YOU CAN ESCAPE THIS CONTRACT"
                  : "LIMITED ESCAPE OPTIONS"}
              </h2>
            </div>
            {/* Main Stats */}
            <div className="p-8">
              <p className="text-base font-bold text-black leading-relaxed mb-8 border-l-4 border-black pl-4">
                {plan.summary}
              </p>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 border-2 border-black bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">RECOVERABLE</p>
                  <p className="text-2xl font-black text-green-700">
                    {plan.total_recoverable > 0
                      ? formatCurrency(plan.total_recoverable)
                      : "—"}
                  </p>
                </div>
                <div className="p-4 border-2 border-black bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">VOID CLAUSES</p>
                  <p className="text-2xl font-black text-orange-600">
                    {plan.void_clauses.length}
                  </p>
                </div>
                <div className="p-4 border-2 border-black bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">TIMELINE</p>
                  <p className="text-xl font-black text-blue-700 uppercase tracking-tight truncate">
                    {plan.estimated_timeline}
                  </p>
                </div>
                <div className="p-4 border-2 border-black bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">SUCCESS RATE</p>
                  <p className={`text-xl font-black uppercase tracking-widest ${probability.color}`}>
                    {probability.label}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Void Clauses ── */}
        {plan.void_clauses.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-black mb-6 flex items-center gap-3 border-b-4 border-black pb-4">
              <Scale className="h-6 w-6 text-black" />
              VOID CLAUSES — CANNOT BE ENFORCED
            </h2>
            <div className="space-y-6">
              {plan.void_clauses.map((vc, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card className="border-2 border-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden">
                    {/* Header */}
                    <div className="bg-red-500 border-b-2 border-black px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <Badge className="bg-white text-black border-2 border-black font-black uppercase tracking-widest text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100 rounded-none">
                            CLAUSE #{vc.clause_number}
                          </Badge>
                          <Badge
                            className={`text-xs font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100 rounded-none ${
                              vc.void_type === "fully_void"
                                ? "bg-purple-200 text-purple-900"
                                : "bg-yellow-200 text-yellow-900"
                            }`}
                          >
                            {vc.void_type === "fully_void"
                              ? "FULLY VOID"
                              : "PARTIALLY VOID"}
                          </Badge>
                        </div>
                        <p className="text-sm font-bold text-white uppercase tracking-tight">
                          {vc.why_void}
                        </p>
                      </div>
                      {vc.recoverable_amount > 0 && (
                        <div className="flex-shrink-0 bg-white border-2 border-black p-2 sm:px-4 sm:py-2 text-right sm:text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] w-full sm:w-auto flex justify-between sm:block">
                          <p className="text-xs font-black uppercase tracking-widest text-black">RECOVERABLE</p>
                          <p className="text-xl sm:text-lg font-black text-green-700">
                            {formatCurrency(vc.recoverable_amount)}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="p-4 bg-gray-50 border-2 border-black mb-6">
                        <p className="text-sm font-bold text-black italic line-clamp-3">
                          &quot;{vc.clause_text}&quot;
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="border-2 border-black p-4 bg-blue-50">
                          <p className="text-xs font-black uppercase tracking-widest text-blue-900 mb-2 border-b-2 border-blue-900/10 pb-2">
                            📖 LEGAL BASIS
                          </p>
                          <p className="text-sm font-bold text-black mb-1">
                            {vc.law}
                          </p>
                          <p className="text-xs text-gray-700 font-bold">
                            {vc.law_explanation}
                          </p>
                        </div>

                        {vc.enforceable_portion && (
                          <div className="border-2 border-black p-4 bg-yellow-50">
                            <p className="text-xs font-black uppercase tracking-widest text-yellow-900 mb-2 border-b-2 border-yellow-900/10 pb-2">
                              ⚠️ WHAT IS ENFORCEABLE
                            </p>
                            <p className="text-sm font-bold text-black">
                              {vc.enforceable_portion}
                            </p>
                          </div>
                        )}

                        <div className="border-2 border-black p-4 bg-green-50">
                          <p className="text-xs font-black uppercase tracking-widest text-green-900 mb-2 border-b-2 border-green-900/10 pb-2">
                            🔄 HOW TO RECOVER
                          </p>
                          <p className="text-sm font-bold text-black">
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
          <div className="mb-12">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-black mb-6 flex items-center gap-3 border-b-4 border-black pb-4">
              <TrendingUp className="h-6 w-6 text-black" />
              STEP-BY-STEP ESCAPE PLAN
            </h2>

            {/* Progress Steps (horizontal) */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-4 custom-scrollbar">
              {plan.escape_steps.map((step, i) => {
                const stepColor =
                  STEP_COLORS[step.action_type] || STEP_COLORS.awareness;
                return (
                  <div key={i} className="flex items-center flex-shrink-0">
                    <button
                      onClick={() => toggleStep(step.step_number)}
                      className={`flex items-center gap-2 px-4 py-2 font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none ${
                        expandedSteps.has(step.step_number)
                          ? `${stepColor.bg} ${stepColor.text} ${stepColor.border}`
                          : "bg-white text-gray-500 border-gray-300 hover:text-black hover:border-black"
                      }`}
                    >
                      <span>{step.step_number}</span>
                      {step.title}
                    </button>
                    {i < plan.escape_steps.length - 1 && (
                      <div className="w-6 h-1 w-6 bg-black mx-2" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step Cards */}
            <div className="space-y-6">
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
                  >
                    <Card
                      className={`bg-white border-4 border-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden transition-all ${
                        isExpanded ? "ring-4 ring-black/10" : ""
                      }`}
                    >
                      {/* Step Header */}
                      <button
                        onClick={() => toggleStep(step.step_number)}
                        className={`w-full flex items-center justify-between p-6 text-left transition-colors ${
                          isExpanded ? stepColor.bg : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-6">
                          <div className={`p-4 border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                            <span className={stepColor.text}>
                              {STEP_ICONS[step.action_type] || STEP_ICONS.awareness}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <span className={`text-lg font-black ${stepColor.text}`}>
                                STEP {step.step_number}
                              </span>
                              <span className="text-xl font-black text-black uppercase tracking-tight">
                                {step.title}
                              </span>
                            </div>
                            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mt-1 flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {step.timeframe}
                            </p>
                          </div>
                        </div>
                        <div className="border-2 border-black p-2 bg-white">
                        {isExpanded ? (
                          <ChevronUp className="h-6 w-6 text-black" />
                        ) : (
                          <ChevronDown className="h-6 w-6 text-black" />
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
                            <div className="px-6 pb-6 space-y-6 border-t-4 border-black pt-6 bg-white">
                              <p className="text-base font-bold text-black leading-relaxed">
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
                                  className="flex items-center justify-between p-4 bg-blue-50 border-2 border-blue-900 shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(30,58,138,1)] transition-all group"
                                >
                                  <div className="flex items-center gap-3">
                                    {step.link_to === "letter" ? (
                                      <FileText className="h-5 w-5 text-blue-900" />
                                    ) : (
                                      <Swords className="h-5 w-5 text-blue-900" />
                                    )}
                                    <span className="text-base text-blue-900 font-black uppercase tracking-wider">
                                      {step.link_to === "letter"
                                        ? "GENERATE LEGAL NOTICE"
                                        : "VIEW NEGOTIATION PLAYBOOK"}
                                    </span>
                                  </div>
                                  <ExternalLink className="h-5 w-5 text-blue-900 group-hover:translate-x-1 transition-transform" />
                                </Link>
                              )}

                              {/* Authorities */}
                              {step.authorities && step.authorities.length > 0 && (
                                <div className="space-y-4">
                                  <p className="text-sm font-black text-black uppercase tracking-widest border-b-2 border-black pb-2">
                                    WHERE TO FILE
                                  </p>
                                  {step.authorities.map((auth, ai) => (
                                    <div
                                      key={ai}
                                      className="p-4 bg-gray-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                    >
                                      <div className="flex items-start justify-between gap-4 mb-2">
                                        <p className="text-lg font-black text-black uppercase tracking-tight">
                                          {auth.name}
                                        </p>
                                        <Badge
                                          variant="outline"
                                          className="text-xs font-black uppercase tracking-widest border-2 border-black text-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                        >
                                          {auth.jurisdiction}
                                        </Badge>
                                      </div>
                                      <p className="text-sm font-bold text-gray-700 mb-4 border-l-4 border-black pl-3">
                                        FOR: {auth.for}
                                      </p>
                                      <div className="flex flex-col sm:flex-row gap-4 sm:items-center text-sm font-black uppercase tracking-widest text-black bg-white border-2 border-black p-3">
                                        <span className="flex items-center gap-2">💰 {auth.cost}</span>
                                        <span className="hidden sm:inline">•</span>
                                        <span className="flex items-center gap-2">⏰ {auth.timeline}</span>
                                      </div>
                                      {auth.how_to_file && (
                                        <p className="text-xs font-bold text-gray-600 mt-4 italic bg-yellow-50 p-3 border-l-4 border-yellow-400">
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
          <Card className="border-4 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-12 bg-white">
            <CardContent className="p-0">
              <h2 className="text-2xl font-black text-white bg-green-700 p-6 flex items-center gap-3 border-b-4 border-black uppercase tracking-tighter">
                <IndianRupee className="h-8 w-8 text-white" />
                MONEY RECOVERY BREAKDOWN
              </h2>

              <div className="p-6 sm:p-8 space-y-4">
                {plan.recovery.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 border-2 border-black"
                  >
                    <div>
                      <p className="text-base font-black uppercase tracking-widest text-black mb-1">
                        {item.label}
                      </p>
                      <p className="text-sm font-bold text-gray-500">{item.explanation}</p>
                    </div>
                    <p className="text-xl font-black text-green-700 flex-shrink-0 sm:ml-4 mt-2 sm:mt-0">
                      {formatCurrencyFull(item.amount)}
                    </p>
                  </div>
                ))}

                {plan.recovery.interest_amount > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-yellow-50 border-2 border-black">
                    <div>
                      <p className="text-base font-black uppercase tracking-widest text-black mb-1">
                        INTEREST
                      </p>
                      <p className="text-sm font-bold text-gray-700">
                        @ {plan.recovery.interest_rate}
                      </p>
                    </div>
                    <p className="text-xl font-black text-green-700 flex-shrink-0 sm:ml-4 mt-2 sm:mt-0">
                      {formatCurrencyFull(plan.recovery.interest_amount)}
                    </p>
                  </div>
                )}

                <div className="border-4 border-black p-6 bg-green-50 mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                  <p className="text-sm font-black uppercase tracking-widest text-black mb-2 sm:mb-0">
                    TOTAL RECOVERABLE
                  </p>
                  <p className="text-3xl sm:text-4xl font-black text-green-700">
                    {formatCurrencyFull(plan.recovery.total)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Immediate Actions Checklist ── */}
        {plan.immediate_actions.length > 0 && (
          <Card className="border-4 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white mb-12">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-black mb-6 flex items-center gap-3 border-b-4 border-black pb-4">
                <AlertTriangle className="h-8 w-8 text-orange-500" />
                DO THIS RIGHT NOW
              </h2>
              <div className="space-y-4">
                {plan.immediate_actions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => toggleCheck(i)}
                    className={`w-full flex items-start gap-4 p-4 border-2 transition-all ${
                      checkedItems.has(i)
                        ? "bg-green-50 border-green-700 opacity-60"
                        : "bg-white border-black hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                        checkedItems.has(i)
                          ? "bg-green-500 border-green-700"
                          : "border-black bg-white"
                      }`}
                    >
                      {checkedItems.has(i) && (
                        <Check className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <span
                      className={`text-base font-bold text-left leading-relaxed ${
                        checkedItems.has(i)
                          ? "text-green-900 line-through"
                          : "text-black"
                      }`}
                    >
                      {action}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-black mt-6 border-t-2 border-black/10 pt-4">
                ✓ {checkedItems.size}/{plan.immediate_actions.length} COMPLETED
                — YOUR PROGRESS IS SAVED
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── Success Probability ── */}
        <Card className="border-4 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white mb-12">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-black mb-6 flex items-center gap-3 border-b-2 border-black/10 pb-4">
              <TrendingUp className="h-6 w-6 text-black" />
              SUCCESS PROBABILITY
            </h2>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">LIKELIHOOD OF FAVORABLE OUTCOME</span>
                <span className={`text-sm font-black uppercase tracking-widest ${probability.color}`}>
                  {probability.label}
                </span>
              </div>
              <div className="w-full h-8 bg-gray-100 border-2 border-black overflow-hidden relative">
                <motion.div
                  className={`h-full border-r-2 border-black ${probability.color.replace('text-', 'bg-').replace('-700', '-400')}`}
                  initial={{ width: 0 }}
                  animate={{ width: probability.width }}
                  transition={{ duration: 1, delay: 0.5 }}
                  style={{
                    background: "repeating-linear-gradient(45deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 10px, transparent 10px, transparent 20px)",
                    backgroundColor: probability.color.includes('green') ? '#4ade80' : probability.color.includes('yellow') ? '#facc15' : '#f87171' // hacky way, but works
                  }}
                />
              </div>
            </div>
            <p className="text-sm font-bold text-gray-700 leading-relaxed border-l-4 border-black pl-4">
              {plan.success_explanation}
            </p>
          </CardContent>
        </Card>

        {/* ── Disclaimers ── */}
        {plan.warnings.length > 0 && (
          <Card className="border-4 border-yellow-400 rounded-none bg-yellow-50 mb-12 shadow-[8px_8px_0px_0px_rgba(250,204,21,1)]">
            <CardContent className="p-6">
              <p className="text-sm font-black uppercase tracking-widest text-yellow-900 mb-4 border-b-2 border-yellow-200 pb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                IMPORTANT DISCLAIMERS
              </p>
              <ul className="space-y-3">
                {plan.warnings.map((w, i) => (
                  <li key={i} className="text-sm font-bold text-yellow-900 flex items-start gap-3">
                    <span className="text-yellow-500 text-lg leading-none mt-0.5">•</span>
                    {w}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* ── Action Bar ── */}
        <div className="flex flex-wrap gap-4 mb-12">
          <Button
            className="border-2 border-black font-black uppercase tracking-wider rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all gap-2 px-6 py-6 bg-white hover:bg-gray-100 text-black"
            onClick={copyPlan}
          >
            {copied ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
            {copied ? "COPIED PLAN!" : "COPY ESCAPE PLAN"}
          </Button>
        </div>

        {/* ── File Your Complaint Here ── */}
        <div className="mt-8">
          <AuthoritySection
            documentType={document.document_type}
            jurisdiction={document.jurisdiction}
            entityName={document.entity_name || ""}
            clauseTypes={plan.void_clauses.map(vc => vc.why_void).filter(Boolean)}
            preloadedRouting={(document as any).authority_routing || null}
          />
        </div>

        {/* Related Actions */}
        <RelatedActions documentId={documentId} currentPage="escape" />
      </div>
    </div>
  );
}