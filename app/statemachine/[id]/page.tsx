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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="border-b border-white/5 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Link
            href={`/results/${params.id}`}
            className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-semibold text-sm sm:text-base">Trap Detector</h1>
            <p className="text-xs text-gray-500">ClauseWall</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {error && !report && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={handleExtract}
              disabled={extracting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
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
          <div className="space-y-6">
            {/* Full-height graph */}
            <StateGraph
              stateMachine={report.stateMachine}
              report={report}
              mode="explore"
              className="h-[500px] sm:h-[600px]"
            />

            {/* Report card */}
            <ReportCard report={report} onExplore={() => {}} documentId={params.id} />

            {/* Trap state cards */}
            {report.trapAnalysis.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-gray-300">
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
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <h2 className="text-sm font-semibold text-gray-300 mb-3">📋 Recommendations</h2>
                <ul className="space-y-2">
                  {report.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs text-gray-400 flex gap-2">
                      <span className="text-amber-400 flex-shrink-0">{i + 1}.</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related Actions */}
            <RelatedActions documentId={params.id} currentPage="statemachine" />
          </div>
        )}
      </div>
    </div>
  );
}
