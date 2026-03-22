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
        err instanceof Error ? err.message : "Analysis failed. Please try again."
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
    <div className="relative min-h-screen px-4 sm:px-6 lg:px-8 py-8 pb-24 sm:pb-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <FileStack className="h-4 w-4" />
              <span>Cross-Contract Analysis</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Contract <span className="text-indigo-400">Vault</span>
            </h1>
            <p className="text-sm text-white/40 mt-1">
              Detect conflicts, coverage gaps, cascading failures, and hidden
              risks across all your contracts.
            </p>
          </div>
          {state === "results" && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetToSelector}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              New Analysis
            </Button>
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
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-lg font-semibold mb-1">
                  Select Contracts to Analyze
                </h2>
                <p className="text-sm text-white/40 mb-4">
                  Choose at least 2 analyzed contracts for cross-contract
                  analysis.
                </p>

                <ContractSelector
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                />

                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={runAnalysis}
                    disabled={selectedIds.length < 2}
                    className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                  >
                    Analyze {selectedIds.length} Contract
                    {selectedIds.length !== 1 ? "s" : ""}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
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
