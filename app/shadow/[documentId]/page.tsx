"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FileSearch, ArrowLeft, Download, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type {
  ShadowAnalysis,
  ShadowAnalysisRequest,
  ShadowAnalysisResponse,
} from "@/types";
import EvidenceUpload from "@/components/shadow/evidence-upload";
import TrustScoreGauge from "@/components/shadow/trust-score-gauge";
import MismatchList from "@/components/shadow/mismatch-list";
import PromiseTimeline from "@/components/shadow/promise-timeline";
import ComparisonTable from "@/components/shadow/comparison-table";
import ShadowSummaryCard from "@/components/shadow/shadow-summary-card";

type ViewMode = "upload" | "results";

export default function ShadowPage() {
  const params = useParams();
  const documentId = params.documentId as string;

  const [analysis, setAnalysis] = useState<ShadowAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("upload");
  const [activeTab, setActiveTab] = useState<
    "mismatches" | "timeline" | "table"
  >("mismatches");

  // Fetch existing analysis on mount
  useEffect(() => {
    async function fetchExisting() {
      try {
        const res = await fetch(`/api/shadow/${documentId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.analysis) {
            setAnalysis(data.analysis as ShadowAnalysis);
            setViewMode("results");
          }
        }
      } catch {
        // No existing analysis — show upload
      } finally {
        setLoading(false);
      }
    }
    fetchExisting();
  }, [documentId]);

  // Run analysis
  const handleAnalyze = useCallback(async (request: ShadowAnalysisRequest) => {
    setAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("document_id", request.document_id);

      for (const ev of request.evidence) {
        let file: File;
        if (typeof ev.content === "string") {
          // Text — send as a text file
          file = new File([ev.content], ev.filename || `${ev.type}.txt`, {
            type: "text/plain",
          });
        } else {
          // ArrayBuffer — determine MIME
          const mimeMap: Record<string, string> = {
            image: "image/jpeg",
            audio: "audio/mpeg",
            zip: "application/zip",
            eml: "message/rfc822",
            pdf: "application/pdf",
          };
          const mime = mimeMap[ev.format] || "text/plain";
          file = new File(
            [ev.content],
            ev.filename || `${ev.type}.${ev.format}`,
            { type: mime },
          );
        }

        formData.append("evidence[]", file);
        formData.append("evidence_types[]", ev.type);
      }

      const res = await fetch("/api/shadow/analyze", {
        method: "POST",
        body: formData,
      });

      const data: ShadowAnalysisResponse = await res.json();

      if (!res.ok) {
        throw new Error(
          (data as unknown as { error: string }).error || "Analysis failed",
        );
      }

      setAnalysis(data.analysis);
      setViewMode("results");
      toast.success(
        `Found ${data.mismatches.length} mismatches in ${(data.processing_time_ms / 1000).toFixed(1)}s`,
      );
    } catch (error) {
      console.error("[ClauseWall] Shadow analysis failed:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Analysis failed. Please try again.",
      );
    } finally {
      setAnalyzing(false);
    }
  }, []);

  // Download report
  const handleDownloadReport = useCallback(async () => {
    if (!analysis) return;

    try {
      const { downloadShadowReport } =
        await import("@/lib/shadow/report-generator");

      // Fetch document type
      const fetchDocRes = await fetch(`/api/shadow/${documentId}`);
      const docData = await fetchDocRes.json();
      const documentType = docData.analysis?.document_type || "contract";

      downloadShadowReport(analysis, documentType, null);
      toast.success("Report downloaded!");
    } catch {
      toast.error("Failed to generate report.");
    }
  }, [analysis, documentId]);

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200">
      <div className="relative px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-neutral-900 gap-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/results/${documentId}`}
              className="p-2 border border-neutral-800 bg-[#050505] text-neutral-600 hover:text-neutral-300 hover:border-neutral-600 transition-colors"
              aria-label="Back to results"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 border border-amber-900/50 bg-amber-950/10">
                <FileSearch className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h1 className="text-xs font-mono uppercase tracking-widest text-neutral-200">
                  SHADOW_AGREEMENT_DETECTOR
                </h1>
                <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 mt-0.5">
                  COMPARE VERBAL PROMISES AGAINST YOUR CONTRACT
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {analysis && (
              <>
                <button
                  onClick={() => {
                    setViewMode("upload");
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 border border-neutral-800 bg-[#050505] font-mono uppercase tracking-widest text-[8px] text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  RE-ANALYZE
                </button>
                <button
                  onClick={handleDownloadReport}
                  className="flex items-center gap-2 px-3 py-1.5 border border-amber-900/50 bg-amber-950/10 font-mono uppercase tracking-widest text-[8px] text-amber-400 hover:text-amber-300 hover:border-amber-800 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  PDF REPORT
                </button>
              </>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {viewMode === "upload" ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <EvidenceUpload
                documentId={documentId}
                onAnalyze={handleAnalyze}
                isAnalyzing={analyzing}
              />

              {/* Analyzing Overlay */}
              {analyzing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                >
                  <div className="border border-neutral-800 bg-[#0a0a0a] p-8 sm:p-12 max-w-lg w-full text-center space-y-6">
                    <div className="relative mx-auto w-16 h-16">
                      <Loader2 className="w-16 h-16 text-amber-500 animate-spin" />
                    </div>
                    <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-200 border-b border-neutral-800 pb-4">
                      ANALYZING EVIDENCE
                    </h3>
                    <div className="space-y-2 text-[9px] font-mono uppercase tracking-widest text-neutral-500 text-left border border-neutral-800 bg-[#050505] p-4">
                      <p>📝 EXTRACTING PROMISES FROM EVIDENCE...</p>
                      <p>🔍 CROSS-REFERENCING AGAINST CONTRACT...</p>
                      <p>⚖️ CHECKING LEGAL ENFORCEABILITY...</p>
                    </div>
                    <p className="text-[8px] font-mono uppercase tracking-widest text-amber-400 bg-amber-950/20 border border-amber-900/50 py-2">
                      TAKES 30-90 SECONDS
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : analysis ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Trust Score + Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex justify-center border border-neutral-900 bg-[#0a0a0a] p-6">
                  <TrustScoreGauge
                    score={analysis.overall_trust_score}
                    totalPromises={analysis.total_promises_found}
                    totalMismatches={analysis.total_mismatches}
                  />
                </div>
                <div className="border border-neutral-900 bg-[#0a0a0a]">
                  <ShadowSummaryCard analysis={analysis} />
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex flex-wrap sm:flex-nowrap gap-1 border-b border-neutral-900 pb-3">
                {[
                  {
                    key: "mismatches" as const,
                    label: `MISMATCHES (${analysis.mismatches.length})`,
                  },
                  {
                    key: "timeline" as const,
                    label: `TIMELINE (${analysis.promises.length})`,
                  },
                  { key: "table" as const, label: "COMPARISON" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-2.5 px-4 text-[8px] font-mono uppercase tracking-widest transition-colors border ${
                      activeTab === tab.key
                        ? "bg-amber-950/20 text-amber-400 border-amber-900/50"
                        : "bg-[#050505] text-neutral-600 border-neutral-800 hover:border-neutral-700 hover:text-neutral-400"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {activeTab === "mismatches" && (
                    <MismatchList mismatches={analysis.mismatches} />
                  )}
                  {activeTab === "timeline" && (
                    <PromiseTimeline promises={analysis.promises} />
                  )}
                  {activeTab === "table" && (
                    <ComparisonTable mismatches={analysis.mismatches} />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Legal Notice */}
              <div className="p-5 border-l-2 border-cyan-500 bg-cyan-950/20">
                <p className="text-[9px] font-mono uppercase tracking-widest text-cyan-400 mb-3">
                  ⚖️ LEGAL NOTE
                </p>
                <p className="text-[8px] font-mono text-neutral-500 leading-relaxed">
                  Under Section 92 of the Indian Evidence Act, oral agreements
                  that contradict written contracts are generally not admissible.
                  However, provisos 1-3 allow evidence of fraud,
                  misrepresentation, or separate oral agreements on matters not
                  covered by the written document. WhatsApp and email evidence
                  may be admissible under Section 65B of the IT Act, 2000 with a
                  proper certificate.
                </p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
