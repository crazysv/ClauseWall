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
import { Button } from "@/components/ui/button";
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
    <div className="relative min-h-screen px-4 sm:px-6 lg:px-8 py-8 pb-24 sm:pb-8 bg-background">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-0 w-full h-[2px] bg-black/10" />
        <div className="absolute top-1/4 left-0 w-full h-[4px] border-y-2 border-black" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 text-muted-foreground mb-4">
              <div className="p-2 border-4 border-black bg-white dark:bg-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <FileStack className="h-5 w-5 text-black dark:text-white stroke-[3px]" />
              </div>
              <span className="font-black uppercase tracking-widest text-xs">
                CROSS-CONTRACT ANALYSIS
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-widest text-foreground">
              CONTRACT{" "}
              <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950 px-2 py-1 border-4 border-black shadow-[4px_4px_0px_0px_rgba(79,70,229,1)]">
                VAULT
              </span>
            </h1>
            <p className="font-bold uppercase tracking-widest text-muted-foreground mt-4 max-w-2xl text-sm leading-relaxed">
              DETECT CONFLICTS, COVERAGE GAPS, CASCADING FAILURES, AND HIDDEN
              RISKS ACROSS ALL YOUR CONTRACTS.
            </p>
          </div>
          {state === "results" && (
            <button
              onClick={resetToSelector}
              className="flex items-center gap-2 px-4 py-2 border-4 border-black bg-white dark:bg-black font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none transition-all"
            >
              <RefreshCw className="h-4 w-4 stroke-[3px]" />
              NEW ANALYSIS
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
              <div className="border-4 border-black bg-white dark:bg-zinc-900 p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h2 className="text-xl font-black uppercase tracking-widest text-foreground mb-2">
                  SELECT CONTRACTS TO ANALYZE
                </h2>
                <p className="font-bold uppercase tracking-widest text-muted-foreground mb-8 text-sm">
                  CHOOSE AT LEAST 2 ANALYZED CONTRACTS FOR CROSS-CONTRACT
                  ANALYSIS.
                </p>

                <ContractSelector
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                />

                <div className="mt-8 flex justify-end pt-6 border-t-4 border-black">
                  <button
                    onClick={runAnalysis}
                    disabled={selectedIds.length < 2}
                    className="flex items-center gap-3 px-6 py-4 border-4 border-black bg-indigo-500 hover:bg-indigo-600 font-black uppercase tracking-widest text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    ANALYZE {selectedIds.length} CONTRACT
                    {selectedIds.length !== 1 ? "S" : ""}
                    <ArrowRight className="w-5 h-5 stroke-[3px]" />
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
              <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
              <h3 className="text-lg font-semibold text-red-400 mb-2">
                Analysis Failed
              </h3>
              <p className="text-sm text-white/40 max-w-md mb-6">{error}</p>
              <Button
                onClick={resetToSelector}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
