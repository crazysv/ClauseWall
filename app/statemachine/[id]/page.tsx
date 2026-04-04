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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-black">
      {/* Header */}
      <div className="border-b-4 border-black px-4 sm:px-6 py-4 bg-yellow-400">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link
            href={`/results/${params.id}`}
            className="p-2 bg-white border-2 border-black hover:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <ArrowLeft className="h-5 w-5 text-black" />
          </Link>
          <div>
            <h1 className="font-black text-xl uppercase tracking-widest text-black">
              Trap Detector
            </h1>
            <p className="text-sm font-bold uppercase tracking-widest text-black/70 mt-1">
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
            className="max-w-md mx-auto text-center border-4 border-black p-8 bg-gray-50 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mt-12"
          >
            <p className="text-black font-bold uppercase tracking-widest mb-6">
              {error}
            </p>
            <button
              onClick={handleExtract}
              disabled={extracting}
              className="px-6 py-3 bg-black text-white hover:bg-gray-800 text-sm font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 mx-auto border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] w-full"
            >
              {extracting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Extracting...
                </>
              ) : (
                "Generate Trap Analysis"
              )}
            </button>
          </motion.div>
        )}

        {report && (
          <div className="space-y-12">
            {/* Full-height graph */}
            <div className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white p-2">
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
              <div className="space-y-4">
                <h2 className="text-xl font-black uppercase tracking-widest text-black border-b-4 border-black pb-2">
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
              <div className="p-6 bg-blue-100 border-4 border-blue-600 shadow-[6px_6px_0px_0px_rgba(37,99,235,1)]">
                <h2 className="text-lg font-black uppercase tracking-widest text-blue-900 border-b-4 border-blue-600 pb-2 mb-4 inline-block">
                  📋 Recommendations
                </h2>
                <ul className="space-y-3">
                  {report.recommendations.map((rec, i) => (
                    <li
                      key={i}
                      className="text-sm font-bold text-blue-900 flex gap-3"
                    >
                      <span className="font-black text-white bg-blue-600 px-2 border-2 border-blue-900 shrink-0">
                        {i + 1}
                      </span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related Actions */}
            <div className="pt-8 border-t-4 border-black">
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
