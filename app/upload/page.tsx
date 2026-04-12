"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileText,
  AlertCircle,
  Loader2,
  X,
  ClipboardPaste,
  Zap,
  Shield,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { DOCUMENT_TYPES, JURISDICTIONS } from "@/lib/utils/constants";
import { toast } from "sonner";
import QuickScanResult from "@/components/upload/quick-scan-result";
import {
  loadModel,
  warmUpModel,
  getModelStatus,
  classifyDocument,
} from "@/lib/ml";
import type { QuickAnalysisResult } from "@/lib/bot/quick-analyzer";
import type { MLScanResult } from "@/lib/ml/types";
import type { ModelStatus } from "@/lib/ml/types";
import PrivacyToggle from "@/components/upload/privacy-toggle";
import PrivacyDashboard from "@/components/upload/privacy-dashboard";
import PreSendReviewModal from "@/components/upload/pre-send-review-modal";
import { usePrivacy, redactClauses } from "@/lib/privacy";
import type { RedactionResult } from "@/lib/privacy";
import { splitIntoClauses } from "@/lib/ml/clause-splitter";
import MicButton from "@/components/voice/mic-button";
import { LanguageSelector } from "@/components/bhasha/language-selector";
import type { SupportedLanguage } from "@/types/bhasha";

// CHANGED: Removed "ml-preview" — only 3 states now
type PageState = "upload" | "scanning" | "results";

const MIN_ML_DISPLAY_MS = 5000; // ML results shown for at least 5 seconds

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState<
    SupportedLanguage | "auto"
  >("auto");
  const [activeTab, setActiveTab] = useState("upload");
  const [error, setError] = useState("");

  const [pageState, setPageState] = useState<PageState>("upload");

  // ML state
  const [mlResult, setMlResult] = useState<MLScanResult | null>(null);
  const [mlStatus, setMlStatus] = useState<ModelStatus>("idle");

  // Privacy state
  const {
    level: privacyLevel,
    addStep,
    clearSteps,
    setBytesSent,
  } = usePrivacy();
  const [redactionStats, setRedactionStats] = useState<
    RedactionResult["stats"] | null
  >(null);
  const [showPreSendReview, setShowPreSendReview] = useState(false);
  const [redactedClausesForReview, setRedactedClausesForReview] = useState<
    string[]
  >([]);
  const [pendingQuickScanData, setPendingQuickScanData] = useState<{
    file: File | null;
    text: string;
  } | null>(null);

  // Quick scan state — CHANGED: removed isQuickScanLoading, quickScanReady
  const [quickScanResult, setQuickScanResult] =
    useState<QuickAnalysisResult | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);

  // Preload ML model on mount
  useEffect(() => {
    const preload = async () => {
      setMlStatus("loading");
      const loaded = await loadModel();
      if (loaded) {
        await warmUpModel();
        setMlStatus("ready");
      } else {
        setMlStatus("error");
      }
    };
    preload();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const status = getModelStatus();
      setMlStatus(status);
      if (status === "ready" || status === "error") {
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError("");
    const uploadedFile = acceptedFiles[0];

    if (!uploadedFile) return;

    if (
      uploadedFile.type !== "application/pdf" &&
      uploadedFile.type !== "text/plain"
    ) {
      setError("Only PDF and TXT files are supported");
      return;
    }

    if (uploadedFile.size > 10 * 1024 * 1024) {
      setError("File size must be under 10MB");
      return;
    }

    setFile(uploadedFile);
    toast.success(`File "${uploadedFile.name}" selected`);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const getClientSideText = async (): Promise<string | null> => {
    if (activeTab === "paste" && pastedText.trim().length >= 50) {
      return pastedText;
    }

    if (activeTab === "upload" && file) {
      if (file.type === "text/plain") {
        return await file.text();
      }

      if (file.type === "application/pdf") {
        try {
          const { extractTextFromPDFClient } =
            await import("@/lib/pdf/client-parser");
          const text = await extractTextFromPDFClient(file);
          if (text) {
            console.log(
              `[ClauseWall] PDF parsed client-side: ${text.length} chars`,
            );
          }
          return text; // null if parsing failed — ML skipped, quick scan handles it
        } catch {
          console.warn("[ClauseWall] Client PDF import failed, skipping ML");
          return null;
        }
      }

      return null;
    }

    return null;
  };

  const runQuickScan = async (inputFile: File | null, inputText: string) => {
    let quickResponse: Response;

    if (activeTab === "upload" && inputFile) {
      const formData = new FormData();
      formData.append("file", inputFile);
      formData.append("documentType", documentType);
      formData.append("jurisdiction", jurisdiction);

      quickResponse = await fetch("/api/quick-scan", {
        method: "POST",
        body: formData,
      });
    } else {
      quickResponse = await fetch("/api/quick-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          documentType,
          jurisdiction,
        }),
      });
    }

    const quickData = await quickResponse.json();

    if (!quickResponse.ok) {
      throw new Error(quickData.error || "Quick scan failed");
    }

    return quickData;
  };

  const triggerFullAnalysis = async (
    rawText: string,
    inputFile: File | null,
  ) => {
    if (!rawText || rawText.trim().length < 50) return;

    try {
      let analyzeResponse: Response;

      if (activeTab === "upload" && inputFile) {
        const formData = new FormData();
        formData.append("file", inputFile);
        formData.append("documentType", documentType);
        formData.append("jurisdiction", jurisdiction);
        formData.append("sourceLanguage", sourceLanguage);

        analyzeResponse = await fetch("/api/analyze", {
          method: "POST",
          body: formData,
        });
      } else {
        analyzeResponse = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: rawText,
            documentType,
            jurisdiction,
            sourceLanguage,
            filename: inputFile?.name || "pasted-text.txt",
          }),
        });
      }

      const analyzeData = await analyzeResponse.json();

      if (analyzeResponse.ok && analyzeData.documentId) {
        setDocumentId(analyzeData.documentId);
        // Analysis is triggered server-side by /api/analyze
      }
    } catch (fullError) {
      console.error("[ClauseWall] Full analysis trigger failed:", fullError);
    }
  };

  /**
   * MAIN HANDLER — Unified progressive flow
   * ML instant → Quick Scan enhances → Full Analysis in background
   * All shown on ONE screen
   */
  const handleAnalyze = async () => {
    setError("");
    clearSteps();
    setRedactionStats(null);

    if (activeTab === "upload" && !file) {
      setError("Please upload a document first");
      return;
    }
    if (activeTab === "paste" && !pastedText.trim()) {
      setError("Please paste your contract text");
      return;
    }
    if (!documentType) {
      setError("Please select a document type");
      return;
    }
    if (!jurisdiction) {
      setError("Please select your state");
      return;
    }

    try {
      let mlRan = false;

      // --- STEP 1: Extract text client-side ---
      addStep({
        id: "text_extract",
        label: "Extracting text from document...",
        status: "pending",
        location: "device",
        timestamp: Date.now(),
      });

      const clientText = await getClientSideText();

      addStep({
        id: "text_extract",
        label: clientText
          ? `Text extracted (${clientText.length} chars)`
          : "Text extraction skipped",
        status: clientText ? "done" : "error",
        location: "device",
        timestamp: Date.now(),
      });

      // --- STEP 2: ML Instant Scan ---
      let mlStartTime = 0;

      if (clientText && mlStatus === "ready") {
        addStep({
          id: "ml_classify",
          label: "Running on-device ML classification...",
          status: "pending",
          location: "device",
          timestamp: Date.now(),
        });

        mlStartTime = Date.now();
        const mlScanResult = await classifyDocument(clientText);

        if (mlScanResult && mlScanResult.totalClauses > 0) {
          setMlResult(mlScanResult);
          setPageState("results");
          mlRan = true;
          window.scrollTo({ top: 0, behavior: "smooth" });

          addStep({
            id: "ml_classify",
            label: `ML classified ${mlScanResult.totalClauses} clauses in ${mlScanResult.inferenceTimeMs.toFixed(0)}ms`,
            status: "done",
            location: "device",
            timestamp: Date.now(),
          });

          toast.success(
            `⚡ Instant scan: ${mlScanResult.totalClauses} clauses in ${mlScanResult.inferenceTimeMs.toFixed(0)}ms`,
          );
        }
      }

      // --- MAXIMUM PRIVACY: Stop here ---
      if (privacyLevel === "maximum" && mlRan) {
        setBytesSent(0);
        addStep({
          id: "complete",
          label: "Analysis complete — zero data sent",
          status: "done",
          location: "device",
          timestamp: Date.now(),
        });
        toast.success("🔒 Maximum privacy: All processing done on-device");
        return;
      }

      if (!mlRan) {
        setPageState("scanning");
        toast.info("Running quick scan...");
      }

      // --- STEP 3: PII Redaction (Balanced mode) ---
      if (privacyLevel === "balanced" && clientText) {
        addStep({
          id: "pii_redact",
          label: "Redacting personal information...",
          status: "pending",
          location: "device",
          timestamp: Date.now(),
        });

        const clauses = splitIntoClauses(clientText);
        const clauseTexts = clauses.map((c) => c.text);
        const { redactedClauses: redacted, totalRedactions } =
          redactClauses(clauseTexts);

        setRedactionStats(totalRedactions);

        addStep({
          id: "pii_redact",
          label: `${totalRedactions.total} PII items redacted`,
          status: "done",
          location: "device",
          timestamp: Date.now(),
        });

        // Show pre-send review
        if (totalRedactions.total > 0) {
          setRedactedClausesForReview(redacted);
          setPendingQuickScanData({
            file: activeTab === "upload" ? file : null,
            text: pastedText,
          });
          setShowPreSendReview(true);

          // Wait for minimum ML display time
          if (mlRan && mlStartTime > 0) {
            const elapsed = Date.now() - mlStartTime;
            const remaining = MIN_ML_DISPLAY_MS - elapsed;
            if (remaining > 0) {
              await new Promise((resolve) => setTimeout(resolve, remaining));
            }
          }

          return; // Wait for user approval in modal
        }
      }

      // --- STEP 4: Quick Scan ---
      addStep({
        id: "ai_send",
        label: "Sending for AI analysis...",
        status: "pending",
        location: "server",
        timestamp: Date.now(),
      });

      const quickData = await runQuickScan(
        activeTab === "upload" ? file : null,
        pastedText,
      );

      const sentBytes = JSON.stringify(quickData).length;
      setBytesSent(sentBytes);

      addStep({
        id: "ai_send",
        label: `AI analysis complete (${(sentBytes / 1024).toFixed(1)} KB sent)`,
        status: "done",
        location: "server",
        timestamp: Date.now(),
      });

      // Ensure ML minimum display time
      if (mlRan && mlStartTime > 0) {
        const elapsed = Date.now() - mlStartTime;
        const remaining = MIN_ML_DISPLAY_MS - elapsed;
        if (remaining > 0) {
          await new Promise((resolve) => setTimeout(resolve, remaining));
        }
      }

      setQuickScanResult(quickData);

      if (!mlRan) {
        setPageState("results");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      // --- STEP 5: Full Analysis ---
      const rawText = quickData.raw_text;
      await triggerFullAnalysis(rawText, activeTab === "upload" ? file : null);
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      toast.error(errorMessage);
      setPageState("upload");
    }
  };

  /**
   * Handle user approving pre-send review
   */
  const handlePreSendApprove = async () => {
    setShowPreSendReview(false);

    if (!pendingQuickScanData) return;

    try {
      addStep({
        id: "ai_send",
        label: "Sending anonymized clauses to AI...",
        status: "pending",
        location: "server",
        timestamp: Date.now(),
      });

      const quickData = await runQuickScan(
        pendingQuickScanData.file,
        pendingQuickScanData.text,
      );

      const sentBytes = JSON.stringify(quickData).length;
      setBytesSent(sentBytes);

      addStep({
        id: "ai_send",
        label: `AI analysis complete (${(sentBytes / 1024).toFixed(1)} KB sent)`,
        status: "done",
        location: "server",
        timestamp: Date.now(),
      });

      setQuickScanResult(quickData);

      if (!mlResult) {
        setPageState("results");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      const rawText = quickData.raw_text;
      await triggerFullAnalysis(rawText, pendingQuickScanData.file);
    } catch (err) {
      toast.error((err as Error).message);
      setPageState("upload");
    } finally {
      setPendingQuickScanData(null);
    }
  };

  // CHANGED: Simplified — removed isQuickScanLoading, quickScanReady
  const handleReset = () => {
    setPageState("upload");
    setQuickScanResult(null);
    setMlResult(null);
    setDocumentId(null);
    setFile(null);
    setPastedText("");
    setError("");
    clearSteps();
    setRedactionStats(null);
  };

  const removeFile = () => {
    setFile(null);
    setError("");
  };

  const hasContent =
    (activeTab === "upload" && file) ||
    (activeTab === "paste" && pastedText.trim().length > 50);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-300 font-sans selection:bg-red-500/30 selection:text-red-200">
      <div className="relative mx-auto max-w-4xl px-4 md:px-6 py-12 md:py-20">
        {/* SCANNING STATE */}
        {pageState === "scanning" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
            <div className="relative w-full max-w-md h-1 bg-[#111] overflow-hidden rounded-full">
              <motion.div 
                className="absolute top-0 left-0 h-full bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.8)]"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2 tracking-tight flex items-center justify-center gap-3">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                Executing Forensic Scan...
              </h2>
              <p className="text-neutral-500 font-mono text-sm uppercase tracking-widest mt-4">
                Identifying predatory vectors. This takes 3-5 seconds.
              </p>
            </div>
          </div>
        )}

        {/* RESULTS STATE — Unified progressive screen */}
        {pageState === "results" && (quickScanResult || mlResult) && (
          <>
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
                {!quickScanResult && mlResult ? (
                  <span className="flex items-center justify-center gap-3"><Zap className="w-8 h-8 text-cyan-500" /> Instant Autopsy</span>
                ) : (
                  <span className="flex items-center justify-center gap-3"><Shield className="w-8 h-8 text-red-500" /> Forensic Results</span>
                )}
              </h1>
              <p className="text-neutral-400 font-medium text-lg">
                {!quickScanResult && mlResult
                  ? "On-device triage complete • Initializing deeper network analysis..."
                  : "Finalized AI analysis of extracted legal clauses"}
              </p>
              {mlResult && quickScanResult && (
                <Badge
                  variant="outline"
                  className="mt-2 border-amber-500/30 text-amber-400 gap-1"
                >
                  <Cpu className="h-3 w-3" />
                  Pre-scanned on-device in {mlResult.inferenceTimeMs.toFixed(0)}
                  ms
                </Badge>
              )}
            </div>

            <QuickScanResult
              result={quickScanResult}
              mlResult={mlResult}
              documentId={documentId}
              onReset={handleReset}
            />

            {/* Privacy Dashboard */}
            <div className="mt-4">
              <PrivacyDashboard redactionStats={redactionStats} />
            </div>
          </>
        )}

        {/* UPLOAD STATE */}
        {pageState === "upload" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-950/30 border border-red-500/20 text-red-500 text-xs font-mono uppercase tracking-widest mb-6 rounded-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Intake Module Active
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-6 leading-tight font-display">
                Submit Evidence <br className="md:hidden" />
                <span className="text-red-500 border-b-4 border-red-600 pb-2">For Dissection.</span>
              </h1>
              <p className="text-neutral-400 text-lg max-w-2xl mx-auto font-medium">
                Upload your lease, employment bond, or loan agreement entirely locally. We will extract the text, redact your identity, and begin the autopsy.
              </p>

              {/* ML Model Status Badge */}
              <div className="mt-8 flex justify-center">
                {mlStatus === "ready" && (
                  <Badge
                    variant="outline"
                    className="border border-green-500/30 text-green-400 font-mono text-[10px] uppercase tracking-wider bg-green-950/20 px-3 py-1 rounded-sm"
                  >
                    <Cpu className="h-3 w-3 mr-2" />
                    On-device Analysis Engine Loaded
                  </Badge>
                )}
                {mlStatus === "loading" && (
                  <Badge
                    variant="outline"
                    className="border border-cyan-500/30 text-cyan-400 font-mono text-[10px] uppercase tracking-wider bg-cyan-950/20 px-3 py-1 rounded-sm"
                  >
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    Booting Neural Engine...
                  </Badge>
                )}
              </div>
            </div>

            {/* Upload Card */}
            <div className="bg-[#0e0e0e] border border-neutral-900 shadow-2xl rounded-sm overflow-hidden mb-8 relative">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#0e0e0e] via-red-600/50 to-[#0e0e0e] opacity-50" />
              <div className="p-6 md:p-10 space-y-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
                  <TabsList className="grid w-full grid-cols-2 bg-[#050505] border border-neutral-800 p-1 rounded-sm mb-4">
                    <TabsTrigger
                      value="upload"
                      className="gap-2 font-mono text-[11px] uppercase tracking-widest text-neutral-500 data-[state=active]:bg-neutral-800 data-[state=active]:text-white rounded-sm py-2.5 transition-all"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Evidence Upload
                    </TabsTrigger>
                    <TabsTrigger
                      value="paste"
                      className="gap-2 font-mono text-[11px] uppercase tracking-widest text-neutral-500 data-[state=active]:bg-neutral-800 data-[state=active]:text-white rounded-sm py-2.5 transition-all"
                    >
                      <ClipboardPaste className="h-3.5 w-3.5" />
                      Raw Text Source
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="mt-2 outline-none">
                    {!file ? (
                      <div
                        {...getRootProps()}
                        className={`border border-dashed rounded-sm p-12 md:p-20 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center ${isDragActive ? "border-red-500 bg-red-950/10 shadow-[0_0_30px_rgba(220,38,38,0.05)]" : "border-neutral-800 hover:border-red-500/40 hover:bg-[#111]"}`}
                      >
                        <input {...getInputProps()} />
                        <div className={`p-4 rounded-full mb-6 transition-colors ${isDragActive ? "bg-red-950/50 text-red-500" : "bg-neutral-900/50 text-neutral-500"}`}>
                           <Upload className="w-8 h-8" />
                        </div>
                        {isDragActive ? (
                          <p className="text-xl font-bold text-red-500 font-display tracking-tight">
                            Release to begin intake...
                          </p>
                        ) : (
                          <>
                            <p className="text-lg font-bold text-white mb-2 tracking-tight">
                              Drag & Drop Evidence
                            </p>
                            <p className="text-sm text-neutral-500">
                              Or click to browse local filesystem
                            </p>
                            <div className="mt-8 flex gap-3 justify-center">
                              <Badge variant="outline" className="border-neutral-800 text-neutral-400 font-mono text-[10px] uppercase bg-black">PDF / TXT</Badge>
                              <Badge variant="outline" className="border-neutral-800 text-neutral-400 font-mono text-[10px] uppercase bg-black">Max 10MB</Badge>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="border border-red-900/30 bg-[#160a0a] p-4 flex items-center justify-between mt-4 rounded-sm">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-sm bg-red-950/50 border border-red-900/50 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-red-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white mb-1 truncate max-w-[200px] md:max-w-sm">
                              {file.name}
                            </p>
                            <p className="text-[11px] font-mono text-red-400/80 uppercase tracking-wider">
                              {(file.size / 1024).toFixed(1)} KB • Evidence Locked
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={removeFile}
                          className="text-neutral-500 hover:text-red-400 hover:bg-transparent"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="paste" className="mt-2 outline-none">
                    <div className="space-y-3">
                      <label className="text-[11px] font-mono uppercase tracking-widest text-neutral-500">
                        Paste Raw Evidence Text
                      </label>
                      <div className="relative">
                        <Textarea
                          placeholder="Initialize string sequence...&#10;&#10;e.g., '1. The Licensee agrees to waive all rights to participate in a class-action lawsuit...'&#10;"
                          value={pastedText}
                          onChange={(e) => setPastedText(e.target.value)}
                          className="min-h-[200px] w-full resize-none font-mono text-sm leading-relaxed border border-neutral-800 bg-black/50 text-neutral-300 focus-visible:ring-1 focus-visible:ring-red-500/50 focus-visible:border-red-500/50 focus-visible:ring-offset-0 placeholder:text-neutral-700 rounded-sm p-5"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between mt-4">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-600">
                        Min 50 chars required
                      </p>
                      <p className={`text-[10px] font-mono uppercase tracking-widest ${pastedText.length >= 50 ? "text-cyan-500" : "text-neutral-600"}`}>
                        {pastedText.length} chars
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                
                {/* --- DEFERRED SETTINGS: ONLY SHOW AFTER INGESTION --- */}
                {hasContent && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-6 pt-4 mb-8 overflow-hidden"
                  >
                    
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[11px] font-mono tracking-widest uppercase text-neutral-500 mb-2 block">
                        Evidence Type <span className="text-red-500">*</span>
                      </label>
                      <Select value={documentType} onValueChange={setDocumentType}>
                        <SelectTrigger className="h-12 bg-black border border-neutral-800 text-neutral-300 rounded-sm hover:border-neutral-700 transition-colors focus:ring-1 focus:ring-red-500/50">
                          <SelectValue placeholder="Select classification..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0a0a0a] border-neutral-800 text-neutral-300 rounded-sm shadow-2xl">
                          {DOCUMENT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value} className="focus:bg-neutral-900 focus:text-white cursor-pointer">
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono tracking-widest uppercase text-neutral-500 mb-2 block">
                        Jurisdiction <span className="text-red-500">*</span>
                      </label>
                      <Select value={jurisdiction} onValueChange={setJurisdiction}>
                        <SelectTrigger className="h-12 bg-black border border-neutral-800 text-neutral-300 rounded-sm hover:border-neutral-700 transition-colors focus:ring-1 focus:ring-red-500/50">
                          <SelectValue placeholder="Select state laws..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0a0a0a] border-neutral-800 text-neutral-300 rounded-sm shadow-2xl">
                          {JURISDICTIONS.map((j) => (
                            <SelectItem key={j.value} value={j.value} className="focus:bg-neutral-900 focus:text-white cursor-pointer">
                              {j.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>


                    {/* Advanced Settings Accordion */}
                    <Accordion type="single" collapsible className="w-full mt-6">
                      <AccordionItem value="advanced" className="border border-neutral-800 bg-black/30 rounded-sm px-1">
                        <AccordionTrigger className="text-[11px] font-mono uppercase tracking-widest py-4 px-4 text-neutral-500 hover:text-neutral-300 hover:no-underline transition-all group">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-700 group-hover:bg-neutral-500 transition-colors" /> Settings Configuration
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-6 px-4 space-y-8 bg-transparent">
                          
                          {/* Privacy Slider Inside Advanced */}
                          <div>
                            <div className="mb-4">
                              <h4 className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">Data Exfiltration & Privacy Rules</h4>
                              <p className="text-sm font-medium text-neutral-600 mt-2">ClauseWall anonymizes personally identifiable indicators locally by default before network transitions.</p>
                            </div>
                            <PrivacyToggle />
                          </div>

                          <div className="h-px bg-neutral-900 my-6" />

                          {/* LanguageSelector Inside Advanced */}
                          <div>
                            <label className="text-[11px] font-mono tracking-widest uppercase text-neutral-400 mb-3 block">
                              Source Language
                            </label>
                            <LanguageSelector
                              value={sourceLanguage}
                              onChange={setSourceLanguage}
                            />
                            <p className="text-xs text-neutral-600 mt-3 font-medium">
                              Auto-detect correctly parses major Indian and global languages.
                            </p>
                          </div>

                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </motion.div>
                )}

                {error && (
                  <div className="flex items-center gap-3 text-red-400 text-sm font-medium mt-6 mb-2 p-4 rounded-sm bg-red-950/30 border border-red-900/50">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleAnalyze}
                  disabled={!hasContent || !documentType || !jurisdiction}
                  className="w-full py-8 text-xl font-bold gap-3 bg-red-600 hover:bg-red-500 text-white rounded-sm hover:-translate-y-0.5 transition-all duration-300 shadow-[0_0_20px_rgba(220,38,38,0.15)] hover:shadow-[0_0_40px_rgba(220,38,38,0.3)] disabled:opacity-30 disabled:hover:translate-y-0 disabled:shadow-none disabled:bg-neutral-800 disabled:text-neutral-500 mt-4"
                >
                  {mlStatus === "ready" ? (
                    <>
                      <Zap className="h-5 w-5" />
                      Initialize Dissection
                    </>
                  ) : (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Initializing Core Systems...
                    </>
                  )}
                </Button>

                
                {/* TRUST LOCKUP */}
                <div className="flex flex-col items-center justify-center gap-4 mt-8 pt-8 border-t border-neutral-900">
                  <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                    <span className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-cyan-500"/> On-Device Privacy</span>
                    <span className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-red-500"/> 5-sec Scan</span>
                    <span className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-red-500"/> Auto-Deleted</span>
                  </div>
                  <p className="text-xs text-neutral-600 text-center font-medium">
                    Evidence is strictly encrypted. No full documents ever traverse the network.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center pb-8">
              <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-600 mb-4">
                Supported Classifications
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {DOCUMENT_TYPES.slice(0, 5).map((type) => (
                  <Badge
                    key={type.value}
                    variant="outline"
                    className="border-neutral-800 bg-[#0e0e0e]/50 text-neutral-500 font-mono text-[10px] rounded-sm py-1"
                  >
                    {type.label}
                  </Badge>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Voice Mic Button */}
        <MicButton />

        {/* Pre-Send Review Modal */}
        <PreSendReviewModal
          isOpen={showPreSendReview}
          onClose={() => {
            setShowPreSendReview(false);
            setPendingQuickScanData(null);
          }}
          onApprove={handlePreSendApprove}
          redactedClauses={redactedClausesForReview}
          redactionStats={
            redactionStats || {
              total: 0,
              names: 0,
              ids: 0,
              contacts: 0,
              addresses: 0,
              financial: 0,
            }
          }
          originalClauseCount={redactedClausesForReview.length}
        />
      </div>
    </div>
  );
}
