"use client";

import { useState, useCallback } from "react";
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
import type { QuickAnalysisResult } from "@/lib/bot/quick-analyzer";

type PageState = "upload" | "scanning" | "results";

export default function UploadPage() {
  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [activeTab, setActiveTab] = useState("upload");
  const [error, setError] = useState("");

  // Quick scan state
  const [pageState, setPageState] = useState<PageState>("upload");
  const [quickScanResult, setQuickScanResult] = useState<QuickAnalysisResult | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);

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

  const handleAnalyze = async () => {
    setError("");

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

    setPageState("scanning");
    toast.info("Running quick scan...");

    try {
      // Step 1: Quick Scan
      let quickResponse: Response;

      if (activeTab === "upload" && file) {
        const formData = new FormData();
        formData.append("file", file);
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
            text: pastedText,
            documentType,
            jurisdiction,
          }),
        });
      }

      const quickData = await quickResponse.json();

      if (!quickResponse.ok) {
        throw new Error(quickData.error || "Quick scan failed");
      }

      setQuickScanResult(quickData);
      setPageState("results");
      toast.success("Quick scan complete!");

      // Step 2: Save to DB + Trigger Full Analysis (same as bot flow)
    const rawText = quickData.raw_text;
  if (rawText && rawText.trim().length >= 50) {
  try {
    // First save document via /api/analyze (just creates DB record)
    let analyzeResponse: Response;

    if (activeTab === "upload" && file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);
      formData.append("jurisdiction", jurisdiction);

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
          filename: file?.name || "pasted-text.txt",
        }),
      });
    }

    const analyzeData = await analyzeResponse.json();

    if (analyzeResponse.ok && analyzeData.documentId) {
      setDocumentId(analyzeData.documentId);

      // Trigger full analysis via the working bot trigger route
      fetch("/api/bot/trigger-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: analyzeData.documentId,
          text: rawText,
          documentType,
          jurisdiction,
        }),
      }).catch((err) => {
        console.error("[ClauseWall] Trigger failed:", err);
      });
    }
  } catch (fullError) {
    console.error("[ClauseWall] Full analysis trigger failed:", fullError);
  }
}
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      toast.error(errorMessage);
      setPageState("upload");
    }
  };

  const handleReset = () => {
    setPageState("upload");
    setQuickScanResult(null);
    setDocumentId(null);
    setFile(null);
    setPastedText("");
    setError("");
  };

  const removeFile = () => {
    setFile(null);
    setError("");
  };

  const hasContent =
    (activeTab === "upload" && file) ||
    (activeTab === "paste" && pastedText.trim().length > 50);

  return (
    <div className="relative px-4 sm:px-6 lg:px-8 py-12">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl">
        {/* SCANNING STATE */}
        {pageState === "scanning" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="relative">
              <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
              <div className="absolute inset-0 h-16 w-16 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Quick Scanning...</h2>
              <p className="text-muted-foreground">
                Finding red flags in your contract. This takes 3-5 seconds.
              </p>
            </div>
          </div>
        )}

        {/* RESULTS STATE */}
        {pageState === "results" && quickScanResult && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold mb-3">
                🚦 Quick <span className="gradient-text">Scan Results</span>
              </h1>
              <p className="text-muted-foreground">
                Instant AI analysis of your contract
              </p>
            </div>

            <QuickScanResult
              result={quickScanResult}
              documentId={documentId}
              onReset={handleReset}
            />
          </>
        )}

        {/* UPLOAD STATE */}
        {pageState === "upload" && (
          <>
            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 mb-6">
                <Shield className="h-8 w-8 text-blue-400" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-3">
                Analyze Your{" "}
                <span className="gradient-text">Contract</span>
              </h1>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Upload your document or paste the text. Get instant red flags in
                5 seconds, then a full verified analysis in 60 seconds.
              </p>
            </div>

            {/* Upload Card */}
            <Card className="glass border-white/5 glow-blue">
              <CardContent className="p-6 sm:p-8">
                {/* Tabs: Upload vs Paste */}
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="mb-6"
                >
                  <TabsList className="grid w-full grid-cols-2 bg-white/5">
                    <TabsTrigger
                      value="upload"
                      className="gap-2 data-[state=active]:bg-blue-600"
                    >
                      <Upload className="h-4 w-4" />
                      Upload PDF
                    </TabsTrigger>
                    <TabsTrigger
                      value="paste"
                      className="gap-2 data-[state=active]:bg-blue-600"
                    >
                      <ClipboardPaste className="h-4 w-4" />
                      Paste Text
                    </TabsTrigger>
                  </TabsList>

                  {/* Upload Tab */}
                  <TabsContent value="upload" className="mt-6">
                    {!file ? (
                      <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                          isDragActive
                            ? "border-blue-500 bg-blue-500/5"
                            : "border-white/10 hover:border-blue-500/50 hover:bg-white/[0.02]"
                        }`}
                      >
                        <input {...getInputProps()} />
                        <Upload
                          className={`h-12 w-12 mx-auto mb-4 ${
                            isDragActive
                              ? "text-blue-400"
                              : "text-muted-foreground"
                          }`}
                        />
                        {isDragActive ? (
                          <p className="text-blue-400 font-medium">
                            Drop your contract here...
                          </p>
                        ) : (
                          <>
                            <p className="text-foreground font-medium mb-1">
                              Drag & drop your contract here
                            </p>
                            <p className="text-sm text-muted-foreground">
                              or click to browse • PDF or TXT • Max 10MB
                            </p>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="glass rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={removeFile}
                          className="text-muted-foreground hover:text-red-400"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  {/* Paste Tab */}
                  <TabsContent value="paste" className="mt-6">
                    <Textarea
                      placeholder="Paste your contract text here...

Example:
1. RENT: The Licensee agrees to pay a monthly rent of ₹25,000...
2. SECURITY DEPOSIT: The Licensee shall deposit ₹1,50,000...
3. LOCK-IN PERIOD: The Licensee cannot terminate this agreement for the first 11 months..."
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      className="min-h-[250px] bg-white/5 border-white/10 resize-none text-sm font-mono"
                    />
                    <div className="flex justify-between mt-2">
                      <p className="text-xs text-muted-foreground">
                        Minimum 50 characters required
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pastedText.length} characters
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Document Type & Jurisdiction */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Document Type <span className="text-red-400">*</span>
                    </label>
                    <Select
                      value={documentType}
                      onValueChange={setDocumentType}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
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
                    <label className="text-sm font-medium mb-2 block">
                      State <span className="text-red-400">*</span>
                    </label>
                    <Select
                      value={jurisdiction}
                      onValueChange={setJurisdiction}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
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

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* Analyze Button */}
                <Button
                  onClick={handleAnalyze}
                  disabled={
                    !hasContent || !documentType || !jurisdiction
                  }
                  className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                >
                  <Zap className="h-5 w-5" />
                  Quick Scan Contract
                </Button>

                {/* How it works */}
                <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-yellow-500" />
                    Quick scan: 5 sec
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3 text-blue-500" />
                    Full report: 60 sec
                  </div>
                </div>

                {/* Privacy Note */}
                <p className="text-xs text-muted-foreground text-center mt-4">
                  🔒 Your document is analyzed in real-time and not permanently
                  stored. We take your privacy seriously.
                </p>
              </CardContent>
            </Card>

            {/* Supported Types */}
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Supported document types:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {DOCUMENT_TYPES.slice(0, 5).map((type) => (
                  <Badge
                    key={type.value}
                    variant="outline"
                    className="border-white/10 text-muted-foreground"
                  >
                    {type.label}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}