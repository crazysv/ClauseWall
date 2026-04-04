"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FileSearch, ArrowLeft, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white text-black">
      <div className="relative px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b-4 border-black gap-4">
          <div className="flex items-center gap-4">
            <Link href={`/results/${documentId}`}>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all rounded-none"
              >
                <ArrowLeft className="w-6 h-6 text-black" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight flex items-center gap-3">
                <span className="bg-black text-white p-2 border-2 border-black">
                  <FileSearch className="w-8 h-8" />
                </span>
                Shadow Agreement Detector
              </h1>
              <p className="text-sm font-bold uppercase tracking-widest text-black/60 mt-2 bg-gray-100 inline-block px-2 py-1">
                Compare verbal promises against your contract
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {analysis && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewMode("upload");
                  }}
                  className="h-12 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all font-black uppercase tracking-widest rounded-none text-xs gap-2"
                >
                  Re-Analyze
                </Button>
                <Button
                  variant="default"
                  onClick={handleDownloadReport}
                  className="h-12 bg-black text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] hover:translate-y-1 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,0.5)] transition-all font-black uppercase tracking-widest rounded-none text-xs gap-2"
                >
                  <Download className="w-4 h-4" />
                  PDF Report
                </Button>
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
                  <div className="bg-white border-8 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] p-8 sm:p-12 max-w-lg w-full text-center space-y-6">
                    <div className="relative mx-auto w-20 h-20">
                      <Loader2 className="w-20 h-20 text-black animate-spin" />
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-widest text-black border-b-4 border-black pb-4">
                      Analyzing Evidence
                    </h3>
                    <div className="space-y-3 text-sm font-bold uppercase tracking-widest text-black/70 text-left bg-gray-100 p-4 border-4 border-black">
                      <p>📝 Extracting promises from evidence...</p>
                      <p>🔍 Cross-referencing against contract...</p>
                      <p>⚖️ Checking legal enforceability...</p>
                    </div>
                    <p className="text-xs font-black text-black bg-yellow-200 py-2 border-2 border-black uppercase">
                      Takes 30-90 seconds
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
              className="space-y-8"
            >
              {/* Trust Score + Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex justify-center border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white p-6">
                  <TrustScoreGauge
                    score={analysis.overall_trust_score}
                    totalPromises={analysis.total_promises_found}
                    totalMismatches={analysis.total_mismatches}
                  />
                </div>
                <div className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white p-0">
                  <ShadowSummaryCard analysis={analysis} />
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex flex-wrap sm:flex-nowrap gap-2 bg-gray-100 border-4 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {[
                  {
                    key: "mismatches" as const,
                    label: `Mismatches (${analysis.mismatches.length})`,
                  },
                  {
                    key: "timeline" as const,
                    label: `Timeline (${analysis.promises.length})`,
                  },
                  { key: "table" as const, label: "Comparison" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-3 px-4 text-xs sm:text-sm font-black uppercase tracking-widest transition-all border-4 border-transparent ${
                      activeTab === tab.key
                        ? "bg-black text-white border-black shadow-[inset_4px_4px_0px_0px_rgba(255,255,255,0.2)]"
                        : "text-black hover:bg-gray-300 hover:border-black"
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
                    <div className="card-impact p-6 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                      <MismatchList mismatches={analysis.mismatches} />
                    </div>
                  )}
                  {activeTab === "timeline" && (
                    <div className="card-impact p-6 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                      <PromiseTimeline promises={analysis.promises} />
                    </div>
                  )}
                  {activeTab === "table" && (
                    <div className="card-impact p-6 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                      <ComparisonTable mismatches={analysis.mismatches} />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Legal Notice */}
              <div className="p-6 bg-blue-100 border-4 border-blue-600 shadow-[6px_6px_0px_0px_rgba(37,99,235,1)]">
                <p className="font-black uppercase tracking-widest text-blue-900 mb-3 text-lg border-b-4 border-blue-600 pb-2 inline-block">
                  ⚖️ Legal Note
                </p>
                <p className="text-sm font-bold uppercase tracking-widest text-blue-800 leading-relaxed">
                  Under Section 92 of the Indian Evidence Act, oral agreements
                  that contradict written contracts are generally not
                  admissible. However, provisos 1-3 allow evidence of fraud,
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
