"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import StateGraph from "@/components/statemachine/state-graph";
import ReportCard from "@/components/statemachine/report-card";
import TrapStateCard from "@/components/statemachine/trap-state-card";
import { RelatedActions } from "@/components/shared/related-actions";
import type { StateMachineReport } from "@/lib/statemachine/types";

export default function StateMachinePage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const [params, setParams] = useState<{ id: string } | null>(null);
  const [report, setReport] = useState<StateMachineReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);

  // Resolve params
  useEffect(() => {
    paramsPromise.then(setParams);
  }, [paramsPromise]);

  // Fetch state machine data
  useEffect(() => {
    if (!params) return;
    async function fetchData() {
      try {
        const res = await fetch(`/api/statemachine/${params!.id}`);
        const data = await res.json();
        if (data.success && data.report) {
          setReport(data.report);
        } else {
          setError("No state machine data available for this document.");
        }
      } catch {
        setError("Failed to load state machine data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params]);

  const handleExtract = async () => {
    if (!params) return;
    setExtracting(true);
    setError(null);
    try {
      const res = await fetch("/api/statemachine/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: params.id }),
      });
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
      } else {
        setError(data.error || "Extraction failed. Please try again.");
      }
    } catch {
      setError("Failed to extract state machine.");
    } finally {
      setExtracting(false);
    }
  };

  if (loading || !params) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200">
      {/* Header */}
      <div className="border-b border-neutral-800 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Link
            href={`/results/${params.id}`}
            className="p-2 border border-neutral-800 bg-[#050505] hover:border-neutral-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-neutral-400" />
          </Link>
          <div>
            <h1 className="text-[10px] font-mono uppercase tracking-widest text-neutral-200">
              Trap Detector
            </h1>
            <p className="text-[7px] font-mono uppercase tracking-widest text-neutral-600 mt-0.5">
              ClauseWall State Machine
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {error && !report && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto text-center border border-neutral-900 p-8 bg-[#0a0a0a] mt-12"
          >
            <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 mb-6">
              {error}
            </p>
            <button
              onClick={handleExtract}
              disabled={extracting}
              className="px-5 py-2.5 border border-cyan-900/50 bg-cyan-950/10 text-cyan-400 hover:text-cyan-300 hover:border-cyan-800 text-[8px] font-mono uppercase tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
            >
              {extracting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                "Generate Trap Analysis"
              )}
            </button>
          </motion.div>
        )}

        {report && (
          <div className="space-y-8">
            {/* Full-height graph */}
            <div className="border border-neutral-900 bg-[#050505] p-1">
              <StateGraph
                stateMachine={report.stateMachine}
                report={report}
                mode="explore"
                className="h-[500px] sm:h-[600px]"
              />
            </div>

            {/* Report card */}
            <ReportCard
              report={report}
              onExplore={() => {}}
              documentId={params.id}
            />

            {/* Trap state cards */}
            {report.trapAnalysis.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 border-b border-neutral-800 pb-2">
                  🪤 Trap States ({report.trapAnalysis.length})
                </h2>
                {report.trapAnalysis.map((trap) => (
                  <TrapStateCard
                    key={trap.stateId}
                    trap={trap}
                    stateMachine={report.stateMachine}
                    documentId={params.id}
                  />
                ))}
              </div>
            )}

            {/* Recommendations */}
            {report.recommendations.length > 0 && (
              <div className="p-5 bg-cyan-950/10 border border-cyan-900/50">
                <h2 className="text-[8px] font-mono uppercase tracking-widest text-cyan-400 border-b border-cyan-900/30 pb-2 mb-3 inline-block">
                  📋 Recommendations
                </h2>
                <ul className="space-y-2">
                  {report.recommendations.map((rec, i) => (
                    <li
                      key={i}
                      className="text-[8px] font-mono text-neutral-400 flex gap-2 leading-relaxed"
                    >
                      <span className="text-neutral-200 bg-cyan-950/20 border border-cyan-900/50 px-1.5 py-0.5 text-[7px] tabular-nums flex-shrink-0">
                        {i + 1}
                      </span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related Actions */}
            <div className="pt-6 border-t border-neutral-800">
              <RelatedActions
                documentId={params.id}
                currentPage="statemachine"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
