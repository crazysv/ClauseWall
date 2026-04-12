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
  const [expandedClauses, setExpandedClauses] = useState<Set<number>>(
    new Set(),
  );
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
    setExpandedClauses(
      new Set(contract.generated_clauses.map((c) => c.number)),
    );
  };

  const collapseAll = () => {
    setExpandedClauses(new Set());
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400 mx-auto mb-4" />
          <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600">
            LOADING YOUR CONTRACT...
          </p>
        </div>
      </div>
    );
  }

  // Not Found
  if (!contract) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <h2 className="text-xs font-mono uppercase tracking-widest text-neutral-200 mb-2">
            CONTRACT NOT FOUND
          </h2>
          <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 mb-6">
            THIS CONTRACT MAY HAVE EXPIRED OR THE LINK IS INVALID.
          </p>
          <button
            onClick={() => router.push("/builder")}
            className="px-5 py-2.5 border border-emerald-900/50 bg-emerald-950/10 text-emerald-400 hover:text-emerald-300 hover:border-emerald-800 text-[8px] font-mono uppercase tracking-widest transition-colors"
          >
            CREATE NEW CONTRACT
          </button>
        </div>
      </div>
    );
  }

  const jurisdictionLabel = contract.jurisdiction
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back */}
        <button
          onClick={() => router.push("/builder")}
          className="flex items-center gap-2 text-[8px] font-mono uppercase tracking-widest text-neutral-600 hover:text-neutral-300 mb-8 transition-colors print:hidden"
        >
          <ArrowLeft className="w-3 h-3" />
          BACK TO BUILDER
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-6 border border-emerald-900/50 bg-emerald-950/10"
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-2 border border-emerald-900/50 bg-emerald-950/20">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-[8px] text-emerald-400 font-mono uppercase tracking-widest">
              ✅ FAIR CONTRACT GENERATED
            </span>
          </div>
          <h1 className="text-sm font-mono uppercase tracking-widest mb-3 text-neutral-200">
            {contract.title}
          </h1>
          <div className="flex flex-wrap gap-2 text-[7px] font-mono uppercase tracking-widest text-neutral-500">
            <span className="flex items-center gap-1 border border-neutral-800 px-1.5 py-0.5 bg-[#050505]">
              <Scale className="w-3 h-3" />
              {jurisdictionLabel}
            </span>
            <span className="border border-neutral-800 px-1.5 py-0.5 bg-[#050505]">
              {contract.generated_clauses.length} CLAUSES
            </span>
            <span className="border border-neutral-800 px-1.5 py-0.5 bg-[#050505]">
              {contract.template_type} AGREEMENT
            </span>
          </div>
        </motion.div>

        {/* Action Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-6 print:hidden"
        >
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 border border-neutral-800 bg-[#050505] text-[8px] font-mono uppercase tracking-widest text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-colors"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                COPIED!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                COPY TEXT
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-2 border border-neutral-800 bg-[#050505] text-[8px] font-mono uppercase tracking-widest text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-colors"
          >
            <Download className="w-3 h-3" />
            DOWNLOAD .TXT
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 border border-neutral-800 bg-[#050505] text-[8px] font-mono uppercase tracking-widest text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-colors"
          >
            <Printer className="w-3 h-3" />
            PRINT / SAVE PDF
          </button>
          <button
            onClick={() =>
              router.push(
                `/upload?text=${encodeURIComponent(contract.generated_text.substring(0, 500))}`,
              )
            }
            className="flex items-center gap-1.5 px-3 py-2 border border-emerald-900/50 bg-emerald-950/10 text-[8px] font-mono uppercase tracking-widest text-emerald-400 hover:text-emerald-300 hover:border-emerald-800 transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            SCAN THIS CONTRACT
          </button>
        </motion.div>

        {/* View Toggle */}
        <div className="flex gap-1 mb-6 print:hidden">
          <button
            onClick={() => setViewMode("clauses")}
            className={`px-3 py-2 border text-[8px] font-mono uppercase tracking-widest transition-colors ${viewMode === "clauses" ? "bg-amber-950/20 text-amber-400 border-amber-900/50" : "bg-[#050505] text-neutral-600 border-neutral-800 hover:border-neutral-700 hover:text-neutral-400"}`}
          >
            CLAUSE-BY-CLAUSE VIEW
          </button>
          <button
            onClick={() => setViewMode("full")}
            className={`px-3 py-2 border text-[8px] font-mono uppercase tracking-widest transition-colors ${viewMode === "full" ? "bg-amber-950/20 text-amber-400 border-amber-900/50" : "bg-[#050505] text-neutral-600 border-neutral-800 hover:border-neutral-700 hover:text-neutral-400"}`}
          >
            FULL DOCUMENT VIEW
          </button>
        </div>

        {/* CLAUSE VIEW */}
        {viewMode === "clauses" && (
          <div>
            {/* Expand/Collapse All */}
            <div className="flex justify-end gap-3 mb-3 print:hidden">
              <button
                onClick={expandAll}
                className="text-[7px] font-mono uppercase tracking-widest text-neutral-600 hover:text-neutral-300 transition-colors"
              >
                EXPAND ALL
              </button>
              <button
                onClick={collapseAll}
                className="text-[7px] font-mono uppercase tracking-widest text-neutral-600 hover:text-neutral-300 transition-colors"
              >
                COLLAPSE ALL
              </button>
            </div>

            <div className="space-y-2">
              {contract.generated_clauses.map((clause, index) => {
                const isExpanded = expandedClauses.has(clause.number);

                return (
                  <motion.div
                    key={clause.number}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="border border-neutral-900 bg-[#0a0a0a]"
                  >
                    {/* Clause Header */}
                    <button
                      onClick={() => toggleClause(clause.number)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-900/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 border border-emerald-900/50 bg-emerald-950/20 flex items-center justify-center text-emerald-400 text-[9px] font-mono tabular-nums flex-shrink-0">
                          {clause.number}
                        </span>
                        <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-300">
                          {clause.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {clause.law_reference && (
                          <span className="hidden md:flex items-center gap-1 text-[7px] font-mono uppercase tracking-widest px-1.5 py-0.5 border border-cyan-900/50 bg-cyan-950/10 text-cyan-400">
                            <Scale className="w-2.5 h-2.5" />
                            LAW
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-neutral-600" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-neutral-600" />
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
                          <div className="px-4 pb-4 space-y-4 pt-2 border-t border-dashed border-neutral-800 mx-4 mt-1">
                            {/* Clause Text */}
                            <div className="bg-[#050505] border border-neutral-800 p-5 text-[9px] font-mono text-neutral-400 leading-relaxed whitespace-pre-wrap">
                              {clause.text}
                            </div>

                            {/* Law Reference */}
                            {clause.law_reference && (
                              <div className="flex items-start gap-3 p-4 border-l-2 border-cyan-500 bg-cyan-950/10">
                                <Scale className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                                <div>
                                  <p className="text-[8px] font-mono uppercase tracking-widest text-cyan-400 mb-1">
                                    LEGAL BASIS
                                  </p>
                                  <p className="text-[9px] font-mono text-neutral-400 leading-relaxed">
                                    {clause.law_reference}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Fairness Note */}
                            {clause.fairness_note && (
                              <div className="flex items-start gap-3 p-4 border-l-2 border-emerald-500 bg-emerald-950/10">
                                <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                <div>
                                  <p className="text-[8px] font-mono uppercase tracking-widest text-emerald-400 mb-1">
                                    WHY THIS IS FAIR
                                  </p>
                                  <p className="text-[9px] font-mono text-neutral-400 leading-relaxed">
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
            className="bg-[#050505] border border-neutral-800 p-8 md:p-12"
          >
            <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-neutral-300">
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
            className="mt-6 p-5 border-l-2 border-amber-500 bg-amber-950/10"
          >
            <h3 className="text-[8px] font-mono uppercase tracking-widest text-amber-400 mb-2 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              STAMP PAPER & REGISTRATION NOTE
            </h3>
            <p className="text-[9px] font-mono text-neutral-400 leading-relaxed">
              {contract.stamp_paper_note}
            </p>
          </motion.div>
        )}

        {/* Disclaimer */}
        <div className="mt-6 p-5 border border-dashed border-neutral-800 bg-[#050505] text-center print:hidden">
          <p className="text-[7px] font-mono uppercase tracking-widest text-neutral-600 leading-relaxed">
            THIS CONTRACT WAS GENERATED BY CLAUSEWALL AI TO BE FAIR AND LEGALLY
            COMPLIANT. HOWEVER, IT IS A TEMPLATE AND SHOULD BE REVIEWED BY A
            LEGAL PROFESSIONAL BEFORE SIGNING. CLAUSEWALL IS NOT A SUBSTITUTE
            FOR LEGAL ADVICE.
          </p>
        </div>
      </div>
    </div>
  );
}
