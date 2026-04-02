"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Copy,
  Download,
  Printer,
  CheckCircle2,
  Scale,
  Shield,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { GeneratedClause } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface ContractData {
  contract_id: string | null;
  title: string;
  generated_text: string;
  generated_clauses: GeneratedClause[];
  stamp_paper_note: string;
  template_type: string;
  jurisdiction: string;
}

export default function ContractPreviewPage() {
  const prefersReducedMotion = useReducedMotion();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [expandedClauses, setExpandedClauses] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<"clauses" | "full">("clauses");

  useEffect(() => {
    async function loadContract() {
      // Try sessionStorage first
      const stored = sessionStorage.getItem("clausewall_generated_contract");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setContract(parsed);
          setLoading(false);
          return;
        } catch {
          // Fall through to DB fetch
        }
      }

      // Fetch from Supabase if we have a real ID
      if (id && id !== "temp") {
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("generated_contracts")
            .select("*")
            .eq("id", id)
            .single();

          if (data && !error) {
            setContract({
              contract_id: data.id,
              title: data.title || "Generated Contract",
              generated_text: data.generated_text,
              generated_clauses: data.generated_clauses || [],
              stamp_paper_note: data.stamp_paper_note || "",
              template_type: data.template_type,
              jurisdiction: data.jurisdiction,
            });
          }
        } catch {
        // Silently handled
      }
      }
      setLoading(false);
    }

    loadContract();
  }, [id]);

  const handleCopy = async () => {
    if (!contract) return;
    try {
      await navigator.clipboard.writeText(contract.generated_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = contract.generated_text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!contract) return;
    const blob = new Blob([contract.generated_text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${contract.title.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleClause = (num: number) => {
    setExpandedClauses((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  const expandAll = () => {
    if (!contract) return;
    setExpandedClauses(new Set(contract.generated_clauses.map((c) => c.number)));
  };

  const collapseAll = () => {
    setExpandedClauses(new Set());
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-4" />
          <p className="text-slate-400">Loading your contract...</p>
        </div>
      </div>
    );
  }

  // Not Found
  if (!contract) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Contract Not Found</h2>
          <p className="text-slate-400 mb-6">
            This contract may have expired or the link is invalid.
          </p>
          <button
            onClick={() => router.push("/builder")}
            className="px-4 md:px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
          >
            Create New Contract
          </button>
        </div>
      </div>
    );
  }

  const jurisdictionLabel =
    contract.jurisdiction.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 lg:py-12">
        {/* Back */}
        <button
          onClick={() => router.push("/builder")}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors print:hidden"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to builder
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-sm text-emerald-400 font-medium">
              ✅ Fair Contract Generated
            </span>
          </div>
          <h1 className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-bold mb-2">{contract.title}</h1>
          <div className="flex flex-wrap gap-3 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <Scale className="w-4 h-4" />
              {jurisdictionLabel}
            </span>
            <span>·</span>
            <span>{contract.generated_clauses.length} clauses</span>
            <span>·</span>
            <span className="capitalize">{contract.template_type} agreement</span>
          </div>
        </motion.div>

        {/* Action Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.1 }}
          className="flex flex-wrap gap-3 mb-8 print:hidden"
        >
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Text
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Download .txt
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print / Save PDF
          </button>
          <button
            onClick={() =>
              router.push(
                `/upload?text=${encodeURIComponent(contract.generated_text.substring(0, 500))}`
              )
            }
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Scan This Contract
          </button>
        </motion.div>

        {/* View Toggle */}
        <div className="flex gap-2 mb-6 print:hidden">
          <button
            onClick={() => setViewMode("clauses")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "clauses"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-slate-800/50 text-slate-400 border border-slate-700"
            }`}
          >
            Clause-by-Clause View
          </button>
          <button
            onClick={() => setViewMode("full")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "full"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-slate-800/50 text-slate-400 border border-slate-700"
            }`}
          >
            Full Document View
          </button>
        </div>

        {/* CLAUSE VIEW */}
        {viewMode === "clauses" && (
          <div>
            {/* Expand/Collapse All */}
            <div className="flex justify-end gap-3 mb-4 print:hidden">
              <button
                onClick={expandAll}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-300 transition-colors"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-300 transition-colors"
              >
                Collapse All
              </button>
            </div>

            <div className="space-y-3">
              {contract.generated_clauses.map((clause, index) => {
                const isExpanded = expandedClauses.has(clause.number);

                return (
                  <motion.div
                    key={clause.number}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: prefersReducedMotion ? 0 : 0.05 * index }}
                    className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden"
                  >
                    {/* Clause Header */}
                    <button
                      onClick={() => toggleClause(clause.number)}
                      className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-sm font-bold flex-shrink-0">
                          {clause.number}
                        </span>
                        <span className="font-medium text-white">
                          {clause.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {clause.law_reference && (
                          <span className="hidden md:flex items-center gap-1 text-xs px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md">
                            <Scale className="w-3 h-3" />
                            Law Referenced
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Clause Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 space-y-4">
                            {/* Clause Text */}
                            <div className="bg-slate-800/50 rounded-lg p-4 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                              {clause.text}
                            </div>

                            {/* Law Reference */}
                            {clause.law_reference && (
                              <div className="flex items-start gap-2 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                                <Scale className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs text-blue-400 font-medium mb-0.5">
                                    Legal Basis
                                  </p>
                                  <p className="text-sm text-slate-300">
                                    {clause.law_reference}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Fairness Note */}
                            {clause.fairness_note && (
                              <div className="flex items-start gap-2 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                                <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs text-emerald-400 font-medium mb-0.5">
                                    Why This Is Fair
                                  </p>
                                  <p className="text-sm text-slate-300">
                                    {clause.fairness_note}
                                  </p>
                                </div>
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

        {/* FULL DOCUMENT VIEW */}
        {viewMode === "full" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-card text-slate-900 dark:text-slate-100 rounded-xl p-8 md:p-12 shadow-2xl"
          >
            <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed">
              {contract.generated_text}
            </pre>
          </motion.div>
        )}

        {/* Stamp Paper Note */}
        {contract.stamp_paper_note && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.3 }}
            className="mt-8 p-5 bg-amber-500/5 border border-amber-500/20 rounded-xl"
          >
            <h3 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Stamp Paper & Registration Note
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {contract.stamp_paper_note}
            </p>
          </motion.div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-slate-900/30 border border-slate-800/50 rounded-xl text-center print:hidden">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            This contract was generated by ClauseWall AI to be fair and legally compliant.
            However, it is a template and should be reviewed by a legal professional
            before signing. ClauseWall is not a substitute for legal advice.
          </p>
        </div>
      </div>
    </div>
  );
}