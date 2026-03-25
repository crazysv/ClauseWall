"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSearch,
  ArrowLeft,
  Download,
  Loader2,
} from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"mismatches" | "timeline" | "table">("mismatches");

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
          file = new File([ev.content], ev.filename || `${ev.type}.txt`, { type: "text/plain" });
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
          file = new File([ev.content], ev.filename || `${ev.type}.${ev.format}`, { type: mime });
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
        throw new Error((data as unknown as { error: string }).error || "Analysis failed");
      }

      setAnalysis(data.analysis);
      setViewMode("results");
      toast.success(`Found ${data.mismatches.length} mismatches in ${(data.processing_time_ms / 1000).toFixed(1)}s`);
    } catch (error) {
      console.error("[ClauseWall] Shadow analysis failed:", error);
      toast.error(error instanceof Error ? error.message : "Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }, []);

  // Download report
  const handleDownloadReport = useCallback(async () => {
    if (!analysis) return;

    try {
      const { downloadShadowReport } = await import("@/lib/shadow/report-generator");

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
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-500/3 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-orange-500/3 rounded-full blur-3xl" />
      </div>

      <div className="relative px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href={`/results/${documentId}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <FileSearch className="w-6 h-6 text-amber-400" />
                Shadow Agreement Detector
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Compare verbal promises against your contract
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {analysis && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setViewMode("upload"); }}
                  className="gap-2 text-xs"
                >
                  Re-Analyze
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadReport}
                  className="gap-2 text-xs"
                >
                  <Download className="w-3 h-3" />
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
                  className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
                >
                  <div className="bg-gray-950 rounded-2xl border border-white/10 p-8 max-w-sm w-full mx-4 text-center space-y-4">
                    <div className="relative mx-auto w-16 h-16">
                      <Loader2 className="w-16 h-16 text-amber-400 animate-spin" />
                      <div className="absolute inset-0 w-16 h-16 bg-amber-500/15 blur-xl rounded-full animate-pulse" />
                    </div>
                    <h3 className="text-lg font-semibold">Analyzing Evidence...</h3>
                    <div className="space-y-1 text-sm text-white/50">
                      <p>📝 Extracting promises from evidence</p>
                      <p>🔍 Cross-referencing against contract</p>
                      <p>⚖️ Checking legal enforceability</p>
                    </div>
                    <p className="text-xs text-white/30">This may take 30-90 seconds</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex justify-center">
                  <TrustScoreGauge
                    score={analysis.overall_trust_score}
                    totalPromises={analysis.total_promises_found}
                    totalMismatches={analysis.total_mismatches}
                  />
                </div>
                <ShadowSummaryCard analysis={analysis} />
              </div>

              {/* Tab Navigation */}
              <div className="flex gap-1 bg-white/[0.02] rounded-lg p-1 border border-white/5">
                {([
                  { key: "mismatches" as const, label: `Mismatches (${analysis.mismatches.length})` },
                  { key: "timeline" as const, label: `Timeline (${analysis.promises.length})` },
                  { key: "table" as const, label: "Comparison" },
                ]).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-2 px-3 rounded text-sm transition-colors ${
                      activeTab === tab.key
                        ? "bg-white/10 text-white font-medium"
                        : "text-white/40 hover:text-white/60"
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
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs text-blue-300/60">
                <p className="font-medium text-blue-300/80 mb-1">⚖️ Legal Note</p>
                <p>
                  Under Section 92 of the Indian Evidence Act, oral agreements that contradict written contracts are generally not admissible. However, provisos 1-3 allow evidence of fraud, misrepresentation, or separate oral agreements on matters not covered by the written document. WhatsApp and email evidence may be admissible under Section 65B of the IT Act, 2000 with a proper certificate.
                </p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
