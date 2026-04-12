"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileText,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Scale,
  Trophy,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import type { ComparisonResult } from "@/lib/bot/compare-analyzer";
import ComparisonCardModal from "@/components/compare/comparison-card-modal";

type InputMode = "file" | "text";

export default function ComparePage() {
  const [inputModeA, setInputModeA] = useState<InputMode>("file");
  const [inputModeB, setInputModeB] = useState<InputMode>("file");
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [textA, setTextA] = useState("");
  const [textB, setTextB] = useState("");
  const [documentType, setDocumentType] = useState("rental");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [expandedClauses, setExpandedClauses] = useState<Set<number>>(
    new Set(),
  );
  const [showShareCard, setShowShareCard] = useState(false);

  const onDropA = useCallback((files: File[]) => {
    if (files[0]) setFileA(files[0]);
  }, []);

  const onDropB = useCallback((files: File[]) => {
    if (files[0]) setFileB(files[0]);
  }, []);

  const dropzoneA = useDropzone({
    onDrop: onDropA,
    accept: { "application/pdf": [".pdf"], "text/plain": [".txt"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const dropzoneB = useDropzone({
    onDrop: onDropB,
    accept: { "application/pdf": [".pdf"], "text/plain": [".txt"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleCompare = async () => {
    const hasA = inputModeA === "file" ? fileA : textA.trim().length >= 50;
    const hasB = inputModeB === "file" ? fileB : textB.trim().length >= 50;

    if (!hasA || !hasB) {
      toast.error("Please provide both contracts");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("documentType", documentType);

      if (inputModeA === "file" && fileA) {
        formData.append("fileA", fileA);
      } else {
        formData.append("textA", textA);
      }

      if (inputModeB === "file" && fileB) {
        formData.append("fileB", fileB);
      } else {
        formData.append("textB", textB);
      }

      const response = await fetch("/api/compare", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Comparison failed");
      }

      const data = await response.json();
      setResult(data);
      toast.success("Comparison complete!");
    } catch (error) {
      toast.error((error as Error).message || "Comparison failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleClause = (index: number) => {
    const newExpanded = new Set(expandedClauses);
    if (newExpanded.has(index)) newExpanded.delete(index);
    else newExpanded.add(index);
    setExpandedClauses(newExpanded);
  };

  // ── Risk Helpers (forensic palette) ─────────

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "safe":
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
      case "warning":
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
      case "dangerous":
        return <XCircle className="h-3.5 w-3.5 text-red-500" />;
      case "illegal":
        return <Scale className="h-3.5 w-3.5 text-purple-400" />;
      default:
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "safe":
        return "text-emerald-400";
      case "warning":
        return "text-amber-400";
      case "dangerous":
        return "text-red-500";
      case "illegal":
        return "text-purple-400";
      default:
        return "text-amber-400";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-purple-400";
    if (score >= 60) return "text-red-500";
    if (score >= 30) return "text-amber-400";
    return "text-emerald-400";
  };

  const getScoreBorder = (score: number) => {
    if (score >= 80) return "border-purple-900/50 bg-purple-950/20";
    if (score >= 60) return "border-red-900/50 bg-red-950/20";
    if (score >= 30) return "border-amber-900/50 bg-amber-950/20";
    return "border-emerald-900/50 bg-emerald-950/20";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "border-purple-900/50 text-purple-400 bg-purple-950/20";
    if (score >= 60) return "border-red-900/50 text-red-500 bg-red-950/20";
    if (score >= 30) return "border-amber-900/50 text-amber-400 bg-amber-950/20";
    return "border-emerald-900/50 text-emerald-400 bg-emerald-950/20";
  };

  const getRiskBadgeClass = (level: string) => {
    switch (level) {
      case "safe":
        return "text-emerald-400 bg-emerald-950/20 border-emerald-900/50";
      case "warning":
        return "text-amber-400 bg-amber-950/20 border-amber-900/50";
      case "dangerous":
        return "text-red-500 bg-red-950/20 border-red-900/50";
      case "illegal":
        return "text-purple-400 bg-purple-950/20 border-purple-900/50";
      default:
        return "text-amber-400 bg-amber-950/20 border-amber-900/50";
    }
  };

  // ── Document type options ───────────────────

  const docTypeOptions = [
    { value: "rental", label: "RENTAL AGREEMENT" },
    { value: "employment", label: "EMPLOYMENT" },
    { value: "loan", label: "LOAN AGREEMENT" },
    { value: "freelance", label: "FREELANCE" },
    { value: "tos", label: "TERMS OF SERVICE" },
    { value: "nda", label: "NDA" },
    { value: "other", label: "OTHER" },
  ];

  return (
    <div className="relative px-4 sm:px-6 lg:px-8 py-8 bg-[#0a0a0a] min-h-screen">
      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="p-3 border border-neutral-800 bg-[#050505]">
              <ArrowLeftRight className="h-6 w-6 text-cyan-500" />
            </div>
            <h1 className="text-xs font-mono uppercase tracking-widest text-neutral-200">
              COMPARATIVE_ANALYSIS
            </h1>
          </div>
          <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-600 w-full max-w-xl mx-auto border-t border-neutral-900 pt-4">
            UPLOAD TWO CONTRACTS SIDE-BY-SIDE. WE WILL COMPARE THEM
            CLAUSE-BY-CLAUSE AND IDENTIFY WHICH ONE IS SAFER.
          </p>
        </div>

        {/* Upload Section */}
        {!result && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Contract A */}
              <div className="border border-neutral-900 bg-[#0a0a0a]">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-900">
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-neutral-300 flex items-center gap-3">
                      <span className="px-1.5 py-0.5 border border-cyan-900/50 text-cyan-400 bg-cyan-950/20 text-[8px]">
                        A
                      </span>
                      CONTRACT_A
                    </h3>
                    <div className="flex border border-neutral-800 bg-[#050505]">
                      <button
                        className={`px-3 py-1 text-[8px] font-mono uppercase tracking-widest transition-colors ${
                          inputModeA === "file"
                            ? "bg-neutral-800 text-neutral-200"
                            : "text-neutral-600 hover:text-neutral-400"
                        }`}
                        onClick={() => setInputModeA("file")}
                      >
                        FILE
                      </button>
                      <button
                        className={`px-3 py-1 text-[8px] font-mono uppercase tracking-widest transition-colors ${
                          inputModeA === "text"
                            ? "bg-neutral-800 text-neutral-200"
                            : "text-neutral-600 hover:text-neutral-400"
                        }`}
                        onClick={() => setInputModeA("text")}
                      >
                        TEXT
                      </button>
                    </div>
                  </div>

                  {inputModeA === "file" ? (
                    <div
                      {...dropzoneA.getRootProps()}
                      className={`border border-dashed p-8 sm:p-12 text-center cursor-pointer transition-all ${
                        dropzoneA.isDragActive
                          ? "border-cyan-500 bg-cyan-950/10"
                          : fileA
                            ? "border-emerald-900/50 bg-emerald-950/10"
                            : "border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900/30"
                      }`}
                    >
                      <input {...dropzoneA.getInputProps()} />
                      {fileA ? (
                        <div className="flex flex-col items-center gap-3">
                          <FileText className="h-8 w-8 text-emerald-500" />
                          <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-300 truncate max-w-[200px]">
                            {fileA.name}
                          </p>
                          <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600">
                            CLICK TO CHANGE
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <Upload className="h-8 w-8 text-neutral-600 mb-2" />
                          <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-500">
                            DROP PDF/TXT OR CLICK TO UPLOAD
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <textarea
                      placeholder="PASTE CONTRACT A TEXT HERE..."
                      value={textA}
                      onChange={(e) => setTextA(e.target.value)}
                      className="w-full min-h-[250px] bg-[#050505] border border-neutral-800 text-neutral-300 font-mono text-xs p-4 placeholder:text-neutral-700 placeholder:uppercase focus:outline-none focus:border-neutral-600 transition-colors resize-y"
                    />
                  )}
                </div>
              </div>

              {/* Contract B */}
              <div className="border border-neutral-900 bg-[#0a0a0a]">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-900">
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-neutral-300 flex items-center gap-3">
                      <span className="px-1.5 py-0.5 border border-purple-900/50 text-purple-400 bg-purple-950/20 text-[8px]">
                        B
                      </span>
                      CONTRACT_B
                    </h3>
                    <div className="flex border border-neutral-800 bg-[#050505]">
                      <button
                        className={`px-3 py-1 text-[8px] font-mono uppercase tracking-widest transition-colors ${
                          inputModeB === "file"
                            ? "bg-neutral-800 text-neutral-200"
                            : "text-neutral-600 hover:text-neutral-400"
                        }`}
                        onClick={() => setInputModeB("file")}
                      >
                        FILE
                      </button>
                      <button
                        className={`px-3 py-1 text-[8px] font-mono uppercase tracking-widest transition-colors ${
                          inputModeB === "text"
                            ? "bg-neutral-800 text-neutral-200"
                            : "text-neutral-600 hover:text-neutral-400"
                        }`}
                        onClick={() => setInputModeB("text")}
                      >
                        TEXT
                      </button>
                    </div>
                  </div>

                  {inputModeB === "file" ? (
                    <div
                      {...dropzoneB.getRootProps()}
                      className={`border border-dashed p-8 sm:p-12 text-center cursor-pointer transition-all ${
                        dropzoneB.isDragActive
                          ? "border-cyan-500 bg-cyan-950/10"
                          : fileB
                            ? "border-emerald-900/50 bg-emerald-950/10"
                            : "border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900/30"
                      }`}
                    >
                      <input {...dropzoneB.getInputProps()} />
                      {fileB ? (
                        <div className="flex flex-col items-center gap-3">
                          <FileText className="h-8 w-8 text-emerald-500" />
                          <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-300 truncate max-w-[200px]">
                            {fileB.name}
                          </p>
                          <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600">
                            CLICK TO CHANGE
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <Upload className="h-8 w-8 text-neutral-600 mb-2" />
                          <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-500">
                            DROP PDF/TXT OR CLICK TO UPLOAD
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <textarea
                      placeholder="PASTE CONTRACT B TEXT HERE..."
                      value={textB}
                      onChange={(e) => setTextB(e.target.value)}
                      className="w-full min-h-[250px] bg-[#050505] border border-neutral-800 text-neutral-300 font-mono text-xs p-4 placeholder:text-neutral-700 placeholder:uppercase focus:outline-none focus:border-neutral-600 transition-colors resize-y"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Document Type + Compare Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <div className="relative">
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="appearance-none bg-[#050505] border border-neutral-800 text-neutral-300 font-mono uppercase tracking-widest text-[9px] h-10 px-4 pr-8 focus:outline-none focus:border-neutral-600 transition-colors cursor-pointer"
                >
                  {docTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-600 pointer-events-none" />
              </div>

              <button
                onClick={handleCompare}
                disabled={loading}
                className="flex items-center gap-3 h-10 px-8 border border-cyan-900/50 bg-cyan-950/10 font-mono uppercase tracking-widest text-[9px] text-cyan-400 hover:text-cyan-300 hover:border-cyan-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors group"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    COMPARING...
                  </>
                ) : (
                  <>
                    <ArrowLeftRight className="h-3.5 w-3.5 group-hover:rotate-180 transition-transform duration-500" />
                    COMPARE CONTRACTS
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Verdict Banner */}
            <div className="border border-neutral-900 bg-[#0a0a0a] mb-8 overflow-hidden">
              <div className="p-8 sm:p-12 text-center">
                <div className="p-3 border border-neutral-800 bg-[#050505] inline-flex items-center justify-center mb-6">
                  <Trophy className="h-8 w-8 text-amber-500" />
                </div>
                <h2 className="text-sm sm:text-base font-mono uppercase tracking-widest text-neutral-200 mb-4">
                  {result.winner === "A"
                    ? "[ CONTRACT_A IS SAFER ]"
                    : result.winner === "B"
                      ? "[ CONTRACT_B IS SAFER ]"
                      : "[ BOTH ARE EQUALLY RISKY ]"}
                </h2>
                <p className="text-[10px] font-mono text-neutral-500 leading-relaxed max-w-2xl mx-auto border-t border-neutral-900 pt-4">
                  {result.verdict}
                </p>
              </div>
            </div>

            {/* Score Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div
                className={`border bg-[#0a0a0a] ${
                  result.winner === "A"
                    ? "border-emerald-900/50"
                    : "border-neutral-900"
                }`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6 border-b border-neutral-900 pb-4">
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-neutral-300 flex items-center gap-2">
                      <span className="px-1.5 py-0.5 border border-cyan-900/50 text-cyan-400 bg-cyan-950/20 text-[8px]">
                        A
                      </span>
                      CONTRACT_A
                    </h3>
                    {result.winner === "A" && (
                      <span className="text-[8px] font-mono uppercase tracking-widest px-2 py-0.5 border border-emerald-900/50 text-emerald-400 bg-emerald-950/20">
                        ▲ SAFER CHOICE
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-center p-8 border ${getScoreBorder(result.score_a)}`}
                  >
                    <p
                      className={`text-4xl font-mono tabular-nums ${getScoreColor(result.score_a)}`}
                    >
                      {result.score_a}
                    </p>
                    <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 mt-2">
                      /100 RISK_SCORE
                    </p>
                    <span
                      className={`inline-block mt-4 text-[8px] font-mono uppercase tracking-widest px-2 py-0.5 border ${getScoreLabel(result.score_a)}`}
                    >
                      {result.label_a}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className={`border bg-[#0a0a0a] ${
                  result.winner === "B"
                    ? "border-emerald-900/50"
                    : "border-neutral-900"
                }`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6 border-b border-neutral-900 pb-4">
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-neutral-300 flex items-center gap-2">
                      <span className="px-1.5 py-0.5 border border-purple-900/50 text-purple-400 bg-purple-950/20 text-[8px]">
                        B
                      </span>
                      CONTRACT_B
                    </h3>
                    {result.winner === "B" && (
                      <span className="text-[8px] font-mono uppercase tracking-widest px-2 py-0.5 border border-emerald-900/50 text-emerald-400 bg-emerald-950/20">
                        ▲ SAFER CHOICE
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-center p-8 border ${getScoreBorder(result.score_b)}`}
                  >
                    <p
                      className={`text-4xl font-mono tabular-nums ${getScoreColor(result.score_b)}`}
                    >
                      {result.score_b}
                    </p>
                    <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 mt-2">
                      /100 RISK_SCORE
                    </p>
                    <span
                      className={`inline-block mt-4 text-[8px] font-mono uppercase tracking-widest px-2 py-0.5 border ${getScoreLabel(result.score_b)}`}
                    >
                      {result.label_b}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Differences */}
            {result.key_differences.length > 0 && (
              <div className="border border-neutral-900 bg-[#0a0a0a] mb-8">
                <div className="p-6 sm:p-8">
                  <h3 className="text-[10px] font-mono uppercase tracking-widest text-amber-400 mb-6 flex items-center gap-3 border-b border-neutral-900 pb-4">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    KEY_DIFFERENCES
                  </h3>
                  <div className="space-y-3">
                    {result.key_differences.map((diff, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-4 p-4 border-l-2 border-amber-900/50 bg-amber-950/10"
                      >
                        <ArrowRight className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-[10px] font-mono text-neutral-400 leading-relaxed">
                          {diff}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Clause-by-Clause */}
            <div className="border border-neutral-900 bg-[#0a0a0a] mb-8">
              <div className="p-4 sm:p-6 border-b border-neutral-900 bg-[#050505]">
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-3">
                  <Scale className="h-3.5 w-3.5" />
                  CLAUSE_BY_CLAUSE_COMPARISON
                </h3>
              </div>
              <div className="p-4 sm:p-6 space-y-3">
                {result.clause_comparisons.map((comp, i) => (
                  <div
                    key={i}
                    className="border border-neutral-900 bg-[#0a0a0a]"
                  >
                    <button
                      className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-neutral-900/50 transition-colors"
                      onClick={() => toggleClause(i)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-300">
                          {comp.clause_type.replace(/_/g, " ").toUpperCase()}
                        </span>
                        <span
                          className={`text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 border ${
                            comp.winner === "A"
                              ? "border-cyan-900/50 text-cyan-400 bg-cyan-950/20"
                              : comp.winner === "B"
                                ? "border-purple-900/50 text-purple-400 bg-purple-950/20"
                                : "border-neutral-800 text-neutral-500 bg-neutral-900"
                          }`}
                        >
                          {comp.winner === "A"
                            ? "A WINS"
                            : comp.winner === "B"
                              ? "B WINS"
                              : "TIE"}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                        <div className="hidden sm:flex items-center gap-4">
                          <div className="flex items-center gap-2 px-2 py-1 border border-neutral-800 bg-[#050505]">
                            <span className="text-[8px] font-mono text-neutral-600">
                              A:
                            </span>
                            {getRiskIcon(comp.contract_a.risk_level)}
                          </div>
                          <div className="flex items-center gap-2 px-2 py-1 border border-neutral-800 bg-[#050505]">
                            <span className="text-[8px] font-mono text-neutral-600">
                              B:
                            </span>
                            {getRiskIcon(comp.contract_b.risk_level)}
                          </div>
                        </div>
                        {expandedClauses.has(i) ? (
                          <ChevronUp className="h-4 w-4 text-neutral-600" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-neutral-600" />
                        )}
                      </div>
                    </button>

                    {expandedClauses.has(i) && (
                      <div className="border-t border-neutral-900 p-4 sm:p-5 bg-[#050505]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="p-4 border border-neutral-800 bg-[#0a0a0a]">
                            <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 mb-3 border-b border-neutral-900 pb-2 flex items-center gap-2">
                              <span className="px-1 py-0.5 border border-cyan-900/50 text-cyan-400 bg-cyan-950/20 text-[7px]">
                                A
                              </span>
                              CONTRACT_A
                            </p>
                            <div className="flex items-center gap-3 mb-3">
                              {getRiskIcon(comp.contract_a.risk_level)}
                              <span
                                className={`text-[10px] font-mono uppercase tracking-widest ${getRiskColor(
                                  comp.contract_a.risk_level,
                                )}`}
                              >
                                {comp.contract_a.value}
                              </span>
                            </div>
                            <p className="text-[10px] font-mono text-neutral-500 leading-relaxed">
                              {comp.contract_a.summary}
                            </p>
                          </div>
                          <div className="p-4 border border-neutral-800 bg-[#0a0a0a]">
                            <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 mb-3 border-b border-neutral-900 pb-2 flex items-center gap-2">
                              <span className="px-1 py-0.5 border border-purple-900/50 text-purple-400 bg-purple-950/20 text-[7px]">
                                B
                              </span>
                              CONTRACT_B
                            </p>
                            <div className="flex items-center gap-3 mb-3">
                              {getRiskIcon(comp.contract_b.risk_level)}
                              <span
                                className={`text-[10px] font-mono uppercase tracking-widest ${getRiskColor(
                                  comp.contract_b.risk_level,
                                )}`}
                              >
                                {comp.contract_b.value}
                              </span>
                            </div>
                            <p className="text-[10px] font-mono text-neutral-500 leading-relaxed">
                              {comp.contract_b.summary}
                            </p>
                          </div>
                        </div>
                        <div className="border-l-2 border-amber-900/50 bg-amber-950/10 p-4">
                          <p className="text-[10px] font-mono text-amber-300/70 flex items-start gap-3 leading-relaxed">
                            <span className="text-amber-600 shrink-0">→</span>
                            {comp.explanation}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendation */}
            <div className="border border-emerald-900/50 bg-emerald-950/10 mb-8">
              <div className="p-6 sm:p-8">
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-3">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  FINAL_RECOMMENDATION
                </h3>
                <p className="text-sm font-mono text-emerald-300/80 border-l-2 border-emerald-900/50 pl-4 py-2 leading-relaxed">
                  {result.recommendation}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => {
                  setResult(null);
                  setFileA(null);
                  setFileB(null);
                  setTextA("");
                  setTextB("");
                  setExpandedClauses(new Set());
                }}
                className="flex items-center justify-center gap-3 h-10 px-8 border border-neutral-800 bg-[#050505] font-mono uppercase tracking-widest text-[9px] text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-colors"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                COMPARE AGAIN
              </button>
              <button
                onClick={() => setShowShareCard(true)}
                className="flex items-center justify-center gap-3 h-10 px-8 border border-cyan-900/50 bg-cyan-950/10 font-mono uppercase tracking-widest text-[9px] text-cyan-400 hover:text-cyan-300 hover:border-cyan-800 transition-colors"
              >
                <Share2 className="h-3.5 w-3.5" />
                SHARE COMPARISON
              </button>
            </div>

            {/* Comparison Card Modal */}
            <ComparisonCardModal
              isOpen={showShareCard}
              onClose={() => setShowShareCard(false)}
              data={result}
              documentType={documentType}
            />
          </>
        )}
      </div>
    </div>
  );
}
