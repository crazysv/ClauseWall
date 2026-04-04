"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
        } catch (err) {
          console.error("Failed to fetch contract:", err);
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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading your contract...</p>
        </div>
      </div>
    );
  }

  // Not Found
  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Contract Not Found</h2>
          <p className="text-gray-400 mb-6">
            This contract may have expired or the link is invalid.
          </p>
          <button
            onClick={() => router.push("/builder")}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Back */}
        <button
          onClick={() => router.push("/builder")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-black uppercase tracking-widest mb-8 transition-colors border-b-4 border-transparent hover:border-black print:hidden"
        >
          <ArrowLeft className="w-5 h-5 stroke-[3px]" />
          BACK TO BUILDER
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-8 border-4 border-black bg-emerald-100 dark:bg-emerald-900/30 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 border-4 border-black bg-emerald-400">
              <Shield className="w-6 h-6 text-black stroke-[3px]" />
            </div>
            <span className="text-sm text-emerald-900 dark:text-emerald-100 font-black uppercase tracking-widest">
              ✅ FAIR CONTRACT GENERATED
            </span>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-widest mb-4 text-foreground">{contract.title}</h1>
          <div className="flex flex-wrap gap-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            <span className="flex items-center gap-1 border-2 border-black px-2 py-0.5 bg-white dark:bg-zinc-900">
              <Scale className="w-4 h-4 stroke-[3px]" />
              {jurisdictionLabel}
            </span>
            <span className="border-2 border-black px-2 py-0.5 bg-white dark:bg-zinc-900">{contract.generated_clauses.length} CLAUSES</span>
            <span className="border-2 border-black px-2 py-0.5 bg-white dark:bg-zinc-900">{contract.template_type} AGREEMENT</span>
          </div>
        </motion.div>

        {/* Action Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-4 mb-8 print:hidden"
        >
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-6 py-3 border-4 border-black bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none text-sm font-black uppercase tracking-widest transition-all text-foreground"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[3px]" />
                COPIED!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5 stroke-[3px]" />
                COPY TEXT
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-6 py-3 border-4 border-black bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none text-sm font-black uppercase tracking-widest transition-all text-foreground"
          >
            <Download className="w-5 h-5 stroke-[3px]" />
            DOWNLOAD .TXT
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3 border-4 border-black bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none text-sm font-black uppercase tracking-widest transition-all text-foreground"
          >
            <Printer className="w-5 h-5 stroke-[3px]" />
            PRINT / SAVE PDF
          </button>
          <button
            onClick={() =>
              router.push(
                `/upload?text=${encodeURIComponent(contract.generated_text.substring(0, 500))}`
              )
            }
            className="flex items-center gap-2 px-6 py-3 border-4 border-black bg-emerald-400 hover:bg-emerald-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none text-sm font-black uppercase tracking-widest transition-all text-black"
          >
            <Sparkles className="w-5 h-5 stroke-[3px]" />
            SCAN THIS CONTRACT
          </button>
        </motion.div>

        {/* View Toggle */}
        <div className="flex gap-4 mb-8 print:hidden">
          <button
            onClick={() => setViewMode("clauses")}
            className={`px-6 py-3 border-4 border-black text-sm font-black uppercase tracking-widest transition-all ${
              viewMode === "clauses"
                ? "bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                : "bg-white dark:bg-zinc-900 text-foreground shadow-none hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            }`}
          >
            CLAUSE-BY-CLAUSE VIEW
          </button>
          <button
            onClick={() => setViewMode("full")}
            className={`px-6 py-3 border-4 border-black text-sm font-black uppercase tracking-widest transition-all ${
              viewMode === "full"
                ? "bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                : "bg-white dark:bg-zinc-900 text-foreground shadow-none hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            }`}
          >
            FULL DOCUMENT VIEW
          </button>
        </div>

        {/* CLAUSE VIEW */}
        {viewMode === "clauses" && (
          <div>
            {/* Expand/Collapse All */}
            <div className="flex justify-end gap-3 mb-4 print:hidden">
              <button
                onClick={expandAll}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
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
                    transition={{ delay: 0.05 * index }}
                    className="border-4 border-black bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4"
                  >
                    {/* Clause Header */}
                    <button
                      onClick={() => toggleClause(clause.number)}
                      className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className="w-10 h-10 border-4 border-black bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-900 dark:text-emerald-100 text-base font-black flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          {clause.number}
                        </span>
                        <span className="font-black uppercase tracking-widest text-lg text-foreground">
                          {clause.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {clause.law_reference && (
                          <span className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-1 border-2 border-black bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100">
                            <Scale className="w-4 h-4 stroke-[3px]" />
                            LAW REFERENCED
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-6 h-6 stroke-[3px] text-black dark:text-white" />
                        ) : (
                          <ChevronDown className="w-6 h-6 stroke-[3px] text-black dark:text-white" />
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
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6 space-y-6 pt-2 border-t-4 border-black mx-6 mt-2 border-dashed">
                            {/* Clause Text */}
                            <div className="bg-gray-100 dark:bg-zinc-800 border-4 border-black p-6 text-foreground font-medium text-base leading-relaxed whitespace-pre-wrap shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                              {clause.text}
                            </div>

                            {/* Law Reference */}
                            {clause.law_reference && (
                              <div className="flex items-start gap-3 p-4 border-l-8 border-black border-y-4 border-r-4 bg-blue-100 dark:bg-blue-900/30 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <Scale className="w-6 h-6 text-blue-900 dark:text-blue-100 flex-shrink-0 stroke-[3px]" />
                                <div>
                                  <p className="text-sm text-blue-900 dark:text-blue-100 font-black uppercase tracking-widest mb-1">
                                    LEGAL BASIS
                                  </p>
                                  <p className="text-base font-medium text-foreground">
                                    {clause.law_reference}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Fairness Note */}
                            {clause.fairness_note && (
                              <div className="flex items-start gap-3 p-4 border-l-8 border-black border-y-4 border-r-4 bg-emerald-100 dark:bg-emerald-900/30 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <Shield className="w-6 h-6 text-emerald-900 dark:text-emerald-100 flex-shrink-0 stroke-[3px]" />
                                <div>
                                  <p className="text-sm text-emerald-900 dark:text-emerald-100 font-black uppercase tracking-widest mb-1">
                                    WHY THIS IS FAIR
                                  </p>
                                  <p className="text-base font-medium text-foreground">
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
            className="bg-white dark:bg-zinc-900 text-foreground border-4 border-black p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            <pre className="whitespace-pre-wrap font-serif text-base leading-relaxed">
              {contract.generated_text}
            </pre>
          </motion.div>
        )}

        {/* Stamp Paper Note */}
        {contract.stamp_paper_note && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 p-6 border-4 border-black bg-amber-100 dark:bg-amber-900/30 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <h3 className="text-base font-black uppercase tracking-widest text-amber-900 dark:text-amber-100 mb-3 flex items-center gap-3">
              <FileText className="w-6 h-6 stroke-[3px]" />
              STAMP PAPER & REGISTRATION NOTE
            </h3>
            <p className="text-base font-bold text-foreground leading-relaxed">
              {contract.stamp_paper_note}
            </p>
          </motion.div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 p-6 border-4 border-black border-dashed bg-gray-100 dark:bg-zinc-900 text-center print:hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            This contract was generated by ClauseWall AI to be fair and legally compliant.
            However, it is a template and should be reviewed by a legal professional
            before signing. ClauseWall is not a substitute for legal advice.
          </p>
        </div>
      </div>
    </div>
  );
}