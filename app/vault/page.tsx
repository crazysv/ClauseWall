"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileStack,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { VaultAnalysisResult } from "@/types";
import VaultOverview from "@/components/vault/vault-overview";
import ContractSelector from "@/components/vault/contract-selector";
import VaultLoading from "@/components/vault/vault-loading";

type PageState = "selector" | "analyzing" | "results" | "error";

export default function VaultPage() {
  const [state, setState] = useState<PageState>("selector");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<VaultAnalysisResult | null>(null);
  const [error, setError] = useState<string>("");

  const runAnalysis = useCallback(async () => {
    if (selectedIds.length < 2) {
      toast.error("Please select at least 2 contracts");
      return;
    }

    setState("analyzing");
    setError("");

    try {
      const res = await fetch("/api/vault/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_ids: selectedIds }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setAnalysis(data as VaultAnalysisResult);
      setState("results");

      if (data.save_error) {
        toast.warning("Analysis complete but could not be saved.");
      } else {
        toast.success("Cross-contract analysis complete!");
      }
    } catch (err) {
      console.error("[Vault] Analysis failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Analysis failed. Please try again.",
      );
      setState("error");
      toast.error("Analysis failed. Please try again.");
    }
  }, [selectedIds]);

  const resetToSelector = () => {
    setState("selector");
    setAnalysis(null);
    setError("");
  };

  return (
    <div className="relative min-h-screen px-4 sm:px-6 lg:px-8 py-8 pb-24 sm:pb-8 bg-[#050505]">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 w-full h-[1px] bg-neutral-800" />
        <div className="absolute top-[25%] left-0 w-full h-[1px] bg-neutral-900/50" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 text-neutral-500 mb-4">
              <div className="p-2 border border-cyan-900/50 bg-cyan-950/20">
                <FileStack className="h-4 w-4 text-cyan-500" />
              </div>
              <span className="font-mono uppercase tracking-widest text-[10px] text-cyan-500">
                [ CROSS-CONTRACT_INTELLIGENCE ]
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-mono uppercase tracking-widest text-neutral-200">
              CONTRACT{" "}
              <span className="text-cyan-400">
                VAULT
              </span>
            </h1>
            <p className="font-mono uppercase tracking-widest text-neutral-500 mt-4 max-w-2xl text-[10px] leading-relaxed">
              DETECT CONFLICTS, COVERAGE GAPS, CASCADING FAILURES, AND HIDDEN
              RISKS ACROSS ALL YOUR CONTRACTS.
            </p>
          </div>
          {state === "results" && (
            <button
              onClick={resetToSelector}
              className="flex items-center gap-2 px-4 py-2 border border-neutral-800 bg-neutral-950 font-mono uppercase tracking-widest text-[10px] text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              NEW_ANALYSIS
            </button>
          )}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {/* ── SELECTOR STATE ── */}
          {state === "selector" && (
            <motion.div
              key="selector"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="border border-neutral-900 bg-[#0a0a0a] p-6 sm:p-8">
                <h2 className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-2">
                  [ SELECT_PAYLOADS_FOR_SCAN ]
                </h2>
                <p className="font-mono uppercase tracking-widest text-neutral-600 mb-8 text-[9px]">
                  CHOOSE AT LEAST 2 ANALYZED CONTRACTS FOR CROSS-CONTRACT
                  ANALYSIS.
                </p>

                <ContractSelector
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                />

                <div className="mt-8 flex justify-end pt-6 border-t border-neutral-900">
                  <button
                    onClick={runAnalysis}
                    disabled={selectedIds.length < 2}
                    className="flex items-center gap-3 px-6 py-3 border border-cyan-500/50 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-[#050505] font-mono uppercase tracking-widest text-[10px] transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-cyan-500/10 disabled:hover:text-cyan-400"
                  >
                    EXECUTE_SCAN — {selectedIds.length} PAYLOAD
                    {selectedIds.length !== 1 ? "S" : ""}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── ANALYZING STATE ── */}
          {state === "analyzing" && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <VaultLoading />
            </motion.div>
          )}

          {/* ── RESULTS STATE ── */}
          {state === "results" && analysis && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <VaultOverview analysis={analysis} />
            </motion.div>
          )}

          {/* ── ERROR STATE ── */}
          {state === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="p-4 border border-red-900/50 bg-red-950/20 mb-6">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-red-500 mb-3">
                [ ANALYSIS_FAILED ]
              </h3>
              <p className="text-xs font-mono text-neutral-400 max-w-md mb-6">{error}</p>
              <button
                onClick={resetToSelector}
                className="flex items-center gap-2 px-5 py-2 border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors font-mono text-[10px] uppercase tracking-widest"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                RETRY_SCAN
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
