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
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative mx-auto max-w-4xl px-4 md:px-6 py-12 md:py-20">
        {/* SCANNING STATE — Only shows when ML didn't run */}
        {pageState === "scanning" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="relative">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <div className="absolute inset-0 h-16 w-16 bg-primary/20 blur-xl rounded-full animate-pulse" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Quick Scanning...</h2>
              <p className="text-foreground font-medium">
                Finding red flags in your contract. This takes 3-5 seconds.
              </p>
            </div>
          </div>
        )}

        {/* RESULTS STATE — Unified progressive screen */}
        {pageState === "results" && (quickScanResult || mlResult) && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-impact-heading text-foreground mb-3">
                {!quickScanResult && mlResult ? (
                  <>⚡ Instant Analysis</>
                ) : (
                  <>🛡️ Contract Analysis</>
                )}
              </h1>
              <p className="text-lg md:text-xl text-foreground">
                {!quickScanResult && mlResult
                  ? "On-device scan complete • Enhancing with AI..."
                  : "AI analysis of your contract"}
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
          <>
            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-foreground bg-primary shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] mb-6">
                <Shield className="h-8 w-8 text-foreground" />
              </div>
              <h1 className="text-impact-heading text-foreground mb-4">
                Analyze Your Contract
              </h1>
              <p className="text-lg md:text-xl text-foreground mt-4 max-w-2xl mx-auto">
                Upload your document or paste the text. Get instant red flags in
                5 seconds, then a full verified analysis in 60 seconds.
              </p>

              {/* ML Model Status Badge */}
              <div className="mt-3 flex justify-center">
                {mlStatus === "ready" && (
                  <Badge
                    variant="outline"
                    className="border-2 border-primary text-primary font-black uppercase tracking-wider bg-primary/10"
                  >
                    <Cpu className="h-3 w-3 mr-1 text-primary" />
                    On-device AI ready
                  </Badge>
                )}
                {mlStatus === "loading" && (
                  <Badge
                    variant="outline"
                    className="border-2 border-foreground text-foreground font-black uppercase tracking-wider bg-muted"
                  >
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Loading on-device AI...
                  </Badge>
                )}
              </div>
            </div>

            {/* Upload Card */}
            <Card className="card-impact border-2 border-foreground shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] bg-card">
              <CardContent className="p-6 sm:p-8 space-y-8">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="mb-6"
                >
                  <TabsList className="grid w-full grid-cols-2 border-2 border-foreground bg-muted p-1 rounded-none shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]">
                    <TabsTrigger
                      value="upload"
                      className="gap-2 font-black uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-2 data-[state=active]:border-foreground data-[state=active]:shadow-sm"
                    >
                      <Upload className="h-4 w-4" />
                      Upload PDF
                    </TabsTrigger>
                    <TabsTrigger
                      value="paste"
                      className="gap-2 font-black uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-2 data-[state=active]:border-foreground data-[state=active]:shadow-sm"
                    >
                      <ClipboardPaste className="h-4 w-4" />
                      Paste Text
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="mt-6">
                    {!file ? (
                      <div
                        {...getRootProps()}
                        className={`border-4 border-dashed rounded-none p-12 md:p-16 text-center cursor-pointer transition-all duration-150 ${isDragActive ? "border-primary bg-primary/10" : "border-foreground/50 bg-background hover:border-foreground hover:bg-muted"}`}
                      >
                        <input {...getInputProps()} />
                        <Upload
                          className={`w-12 h-12 mx-auto mb-4 transition-colors ${isDragActive ? "text-primary" : "text-foreground"}`}
                        />
                        {isDragActive ? (
                          <p className="text-xl font-black uppercase tracking-wider text-primary mt-4">
                            Drop your contract here...
                          </p>
                        ) : (
                          <>
                            <p className="text-xl font-black uppercase tracking-wider text-foreground mt-4">
                              Drag & drop your PDF here
                            </p>
                            <p className="text-sm font-bold text-foreground mt-2">
                              or click to browse
                            </p>
                            <p className="text-xs font-bold text-foreground mt-4 uppercase tracking-wider">
                              PDF or TXT • Max 10MB
                            </p>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="border-2 border-foreground bg-muted card-impact p-4 flex items-center justify-between mt-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 border-2 border-foreground bg-primary flex items-center justify-center">
                            <FileText className="h-5 w-5 text-foreground" />
                          </div>
                          <div>
                            <p className="text-base font-black uppercase tracking-wider text-foreground">
                              {file.name}
                            </p>
                            <p className="text-sm font-bold text-foreground">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={removeFile}
                          className="text-sm text-primary hover:text-red-700 font-semibold hover:bg-transparent"
                        >
                          <X className="h-4 w-4 mr-1" /> Remove
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="paste" className="mt-6">
                    <div className="space-y-2">
                      <label className="text-sm font-black uppercase tracking-wider text-foreground">
                        Paste Contract Text
                      </label>
                      <Textarea
                        placeholder="Paste your contract text here...

                                  Example:
                                  1. RENT: The Licensee agrees to pay a monthly rent of ₹25,000...
                                  2. SECURITY DEPOSIT: The Licensee shall deposit ₹1,50,000...
                                  3. LOCK-IN PERIOD: The Licensee cannot terminate this agreement for the first 11 months..."
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        className="min-h-[200px] w-full resize-none font-bold border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] focus-visible:ring-0 focus-visible:ring-offset-0 bg-background text-foreground"
                      />
                    </div>
                    <div className="flex justify-between mt-3">
                      <p className="text-xs font-black uppercase tracking-wider text-foreground tabular-nums">
                        Minimum 50 characters required
                      </p>
                      <p className="text-xs font-black uppercase tracking-wider text-foreground tabular-nums text-right">
                        {pastedText.length} characters
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Privacy Mode Toggle */}
                <div className="mb-6">
                  <PrivacyToggle />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-sm font-bold text-foreground mb-2 block">
                      Document Type <span className="text-primary">*</span>
                    </label>
                    <Select
                      value={documentType}
                      onValueChange={setDocumentType}
                    >
                      <SelectTrigger className="h-11 font-medium">
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-foreground mb-2 block">
                      State <span className="text-primary">*</span>
                    </label>
                    <Select
                      value={jurisdiction}
                      onValueChange={setJurisdiction}
                    >
                      <SelectTrigger className="h-11 font-medium">
                        <SelectValue placeholder="Select state..." />
                      </SelectTrigger>
                      <SelectContent>
                        {JURISDICTIONS.map((j) => (
                          <SelectItem key={j.value} value={j.value}>
                            {j.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Language Selector */}
                <div className="mb-6">
                  <label className="text-sm font-bold text-foreground mb-2 block">
                    Document Language
                  </label>
                  <LanguageSelector
                    value={sourceLanguage}
                    onChange={setSourceLanguage}
                  />
                  <p className="text-xs text-foreground mt-1">
                    Auto-detect works for most documents. Select manually for
                    better accuracy.
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm font-medium mb-4 p-3 rounded-none bg-destructive/5 border border-destructive">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleAnalyze}
                  disabled={!hasContent || !documentType || !jurisdiction}
                  className="w-full py-6 text-lg gap-2 button text-impact-heading border-2 border-foreground hover:-translate-y-[2px] shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none"
                >
                  {mlStatus === "ready" ? (
                    <>
                      <Zap className="h-6 w-6" />
                      INSTANT SCAN CONTRACT
                    </>
                  ) : (
                    <>
                      <Zap className="h-6 w-6" />
                      QUICK SCAN CONTRACT
                    </>
                  )}
                </Button>

                <div className="flex flex-wrap items-center justify-center gap-6 mt-6 pt-6 border-t border-border">
                  {mlStatus === "ready" && (
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Cpu className="h-4 w-4 text-primary" />
                      ML scan: instant
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Zap className="h-4 w-4 text-primary" />
                    Quick scan: 5 sec
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Shield className="h-4 w-4 text-primary" />
                    Full report: 60 sec
                  </div>
                </div>

                <p className="text-xs text-foreground text-center mt-4">
                  🔒 Your document is analyzed in real-time and not permanently
                  stored. We take your privacy seriously.
                </p>
              </CardContent>
            </Card>

            <div className="mt-8 text-center">
              <p className="text-sm text-foreground mb-3">
                Supported document types:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {DOCUMENT_TYPES.slice(0, 5).map((type) => (
                  <Badge
                    key={type.value}
                    variant="outline"
                    className="border-foreground border-2 text-foreground"
                  >
                    {type.label}
                  </Badge>
                ))}
              </div>
            </div>
          </>
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
