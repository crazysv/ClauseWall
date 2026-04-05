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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "safe":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "dangerous":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "illegal":
        return <Scale className="h-4 w-4 text-purple-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "safe":
        return "text-green-500";
      case "warning":
        return "text-yellow-500";
      case "dangerous":
        return "text-red-500";
      case "illegal":
        return "text-purple-500";
      default:
        return "text-yellow-500";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-purple-700";
    if (score >= 60) return "text-red-700";
    if (score >= 30) return "text-yellow-700";
    return "text-green-700";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80)
      return "bg-purple-200 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
    if (score >= 60)
      return "bg-red-200 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
    if (score >= 30)
      return "bg-yellow-200 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
    return "bg-green-200 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
  };

  return (
    <div className="relative px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen">
      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-16 w-16 border-4 border-black bg-blue-400 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <ArrowLeftRight className="h-8 w-8 text-black" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter text-black">
              COMPARE CONTRACTS
            </h1>
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-foreground w-full max-w-xl mx-auto border-t-2 border-black/10 pt-4">
            UPLOAD TWO CONTRACTS SIDE-BY-SIDE. WE WILL COMPARE THEM
            CLAUSE-BY-CLAUSE AND TELL YOU WHICH ONE IS SAFER.
          </p>
        </div>

        {/* Upload Section */}
        {!result && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Contract A */}
              <Card className="border-4 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b-4 border-black">
                    <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                      <span className="bg-black text-white px-2 py-1 border-2 border-black">
                        A
                      </span>{" "}
                      CONTRACT A
                    </h3>
                    <div className="flex bg-gray-100 border-2 border-black p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <button
                        className={`px-4 py-1 text-xs font-black uppercase tracking-widest transition-colors ${
                          inputModeA === "file"
                            ? "bg-black text-white"
                            : "text-black hover:bg-gray-200"
                        }`}
                        onClick={() => setInputModeA("file")}
                      >
                        File
                      </button>
                      <button
                        className={`px-4 py-1 text-xs font-black uppercase tracking-widest transition-colors ${
                          inputModeA === "text"
                            ? "bg-black text-white"
                            : "text-black hover:bg-gray-200"
                        }`}
                        onClick={() => setInputModeA("text")}
                      >
                        Text
                      </button>
                    </div>
                  </div>

                  {inputModeA === "file" ? (
                    <div
                      {...dropzoneA.getRootProps()}
                      className={`border-4 border-dashed rounded-none p-8 sm:p-12 text-center cursor-pointer transition-all ${
                        dropzoneA.isDragActive
                          ? "border-blue-700 bg-blue-100"
                          : fileA
                            ? "border-green-700 bg-green-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-solid"
                            : "border-black hover:bg-gray-50 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                      }`}
                    >
                      <input {...dropzoneA.getInputProps()} />
                      {fileA ? (
                        <div className="flex flex-col items-center gap-3">
                          <FileText className="h-10 w-10 text-green-900 dark:text-green-100 font-bold" />
                          <p className="text-base font-black uppercase tracking-tight truncate max-w-[200px]">
                            {fileA.name}
                          </p>
                          <p className="text-xs font-bold text-foreground uppercase tracking-widest">
                            CLICK TO CHANGE
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <Upload className="h-10 w-10 text-black mb-2" />
                          <p className="text-sm font-black uppercase tracking-widest text-black">
                            DROP PDF/TXT OR CLICK TO UPLOAD
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Textarea
                      placeholder="PASTE CONTRACT A TEXT HERE..."
                      value={textA}
                      onChange={(e) => setTextA(e.target.value)}
                      className="min-h-[250px] bg-white border-4 border-black text-black font-medium placeholder:font-black placeholder:uppercase placeholder:text-foreground rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    />
                  )}
                </CardContent>
              </Card>

              {/* Contract B */}
              <Card className="border-4 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b-4 border-black">
                    <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                      <span className="bg-black text-white px-2 py-1 border-2 border-black">
                        B
                      </span>{" "}
                      CONTRACT B
                    </h3>
                    <div className="flex bg-gray-100 border-2 border-black p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <button
                        className={`px-4 py-1 text-xs font-black uppercase tracking-widest transition-colors ${
                          inputModeB === "file"
                            ? "bg-black text-white"
                            : "text-black hover:bg-gray-200"
                        }`}
                        onClick={() => setInputModeB("file")}
                      >
                        File
                      </button>
                      <button
                        className={`px-4 py-1 text-xs font-black uppercase tracking-widest transition-colors ${
                          inputModeB === "text"
                            ? "bg-black text-white"
                            : "text-black hover:bg-gray-200"
                        }`}
                        onClick={() => setInputModeB("text")}
                      >
                        Text
                      </button>
                    </div>
                  </div>

                  {inputModeB === "file" ? (
                    <div
                      {...dropzoneB.getRootProps()}
                      className={`border-4 border-dashed rounded-none p-8 sm:p-12 text-center cursor-pointer transition-all ${
                        dropzoneB.isDragActive
                          ? "border-blue-700 bg-blue-100"
                          : fileB
                            ? "border-green-700 bg-green-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-solid"
                            : "border-black hover:bg-gray-50 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                      }`}
                    >
                      <input {...dropzoneB.getInputProps()} />
                      {fileB ? (
                        <div className="flex flex-col items-center gap-3">
                          <FileText className="h-10 w-10 text-green-900 dark:text-green-100 font-bold" />
                          <p className="text-base font-black uppercase tracking-tight truncate max-w-[200px]">
                            {fileB.name}
                          </p>
                          <p className="text-xs font-bold text-foreground uppercase tracking-widest">
                            CLICK TO CHANGE
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <Upload className="h-10 w-10 text-black mb-2" />
                          <p className="text-sm font-black uppercase tracking-widest text-black">
                            DROP PDF/TXT OR CLICK TO UPLOAD
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Textarea
                      placeholder="PASTE CONTRACT B TEXT HERE..."
                      value={textB}
                      onChange={(e) => setTextB(e.target.value)}
                      className="min-h-[250px] bg-white border-4 border-black text-black font-medium placeholder:font-black placeholder:uppercase placeholder:text-foreground rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Document Type + Compare Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger className="w-56 bg-white border-4 border-black text-black font-black uppercase tracking-widest rounded-none h-14 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <SelectValue placeholder="DOCUMENT TYPE" />
                </SelectTrigger>
                <SelectContent className="border-4 border-black font-bold text-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
                  <SelectItem value="rental">RENTAL AGREEMENT</SelectItem>
                  <SelectItem value="employment">EMPLOYMENT</SelectItem>
                  <SelectItem value="loan">LOAN AGREEMENT</SelectItem>
                  <SelectItem value="freelance">FREELANCE</SelectItem>
                  <SelectItem value="tos">TERMS OF SERVICE</SelectItem>
                  <SelectItem value="nda">NDA</SelectItem>
                  <SelectItem value="other">OTHER</SelectItem>
                </SelectContent>
              </Select>

              <Button
                size="lg"
                onClick={handleCompare}
                disabled={loading}
                className="h-14 bg-[#FAEA5F] hover:bg-yellow-400 text-black border-4 border-black font-black uppercase tracking-widest rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all px-8 text-base group"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    COMPARING...
                  </>
                ) : (
                  <>
                    <ArrowLeftRight className="h-5 w-5 mr-3 group-hover:rotate-180 transition-transform duration-500" />
                    COMPARE CONTRACTS
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Verdict Banner */}
            <Card className="border-4 border-black rounded-none bg-blue-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-12 overflow-hidden">
              <CardContent className="p-0">
                <div className="p-8 sm:p-12 text-center bg-[url('/noise.png')]">
                  <div className="bg-white border-4 border-black h-20 w-20 mx-auto flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <Trophy className="h-10 w-10 text-yellow-500" />
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-black mb-4">
                    {result.winner === "A"
                      ? "CONTRACT A IS SAFER"
                      : result.winner === "B"
                        ? "CONTRACT B IS SAFER"
                        : "BOTH ARE EQUALLY RISKY"}
                  </h2>
                  <p className="text-base font-bold text-gray-800 leading-relaxed max-w-2xl mx-auto border-t-2 border-black/10 pt-4">
                    {result.verdict}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Score Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <Card
                className={`border-4 border-black rounded-none bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${
                  result.winner === "A"
                    ? "ring-4 ring-green-400 ring-offset-4"
                    : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6 border-b-4 border-black pb-4">
                    <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2 text-black">
                      <span className="bg-black text-white px-2 border-2 border-black">
                        A
                      </span>
                      CONTRACT A
                    </h3>
                    {result.winner === "A" && (
                      <Badge className="bg-green-400 text-black border-2 border-black font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-none py-1">
                        <Trophy className="h-4 w-4 mr-2" />
                        BETTER CHOICE
                      </Badge>
                    )}
                  </div>
                  <div
                    className={`text-center p-8 ${getScoreBg(result.score_a)}`}
                  >
                    <p
                      className={`text-6xl font-black ${getScoreColor(result.score_a)} uppercase tracking-tighter drop-shadow-md`}
                    >
                      {result.score_a}
                    </p>
                    <p className="text-xs font-black uppercase tracking-widest text-black mt-2">
                      /100 RISK SCORE
                    </p>
                    <p
                      className={`text-lg font-black uppercase tracking-widest mt-4 bg-white border-2 border-black inline-block px-4 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${getScoreColor(result.score_a)}`}
                    >
                      {result.label_a}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`border-4 border-black rounded-none bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${
                  result.winner === "B"
                    ? "ring-4 ring-green-400 ring-offset-4"
                    : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6 border-b-4 border-black pb-4">
                    <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2 text-black">
                      <span className="bg-black text-white px-2 border-2 border-black">
                        B
                      </span>
                      CONTRACT B
                    </h3>
                    {result.winner === "B" && (
                      <Badge className="bg-green-400 text-black border-2 border-black font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-none py-1">
                        <Trophy className="h-4 w-4 mr-2" />
                        BETTER CHOICE
                      </Badge>
                    )}
                  </div>
                  <div
                    className={`text-center p-8 ${getScoreBg(result.score_b)}`}
                  >
                    <p
                      className={`text-6xl font-black ${getScoreColor(result.score_b)} uppercase tracking-tighter drop-shadow-md`}
                    >
                      {result.score_b}
                    </p>
                    <p className="text-xs font-black uppercase tracking-widest text-black mt-2">
                      /100 RISK SCORE
                    </p>
                    <p
                      className={`text-lg font-black uppercase tracking-widest mt-4 bg-white border-2 border-black inline-block px-4 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${getScoreColor(result.score_b)}`}
                    >
                      {result.label_b}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Key Differences */}
            {result.key_differences.length > 0 && (
              <Card className="border-4 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white mb-12">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-black mb-6 flex items-center gap-3 border-b-4 border-black pb-4">
                    <AlertTriangle className="h-8 w-8 text-yellow-500" />
                    KEY DIFFERENCES
                  </h3>
                  <div className="space-y-4">
                    {result.key_differences.map((diff, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-4 p-4 bg-yellow-50 border-2 border-black"
                      >
                        <ArrowRight className="h-6 w-6 text-black mt-0.5 shrink-0" />
                        <p className="text-base font-bold text-black">{diff}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Clause-by-Clause */}
            <Card className="border-4 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white mb-12">
              <CardContent className="p-0">
                <div className="p-6 border-b-4 border-black bg-blue-100">
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-black flex items-center gap-3">
                    <Scale className="h-8 w-8 text-black" />
                    CLAUSE-BY-CLAUSE COMPARISON
                  </h3>
                </div>
                <div className="p-6 sm:p-8 space-y-6 bg-white">
                  {result.clause_comparisons.map((comp, i) => (
                    <div
                      key={i}
                      className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <button
                        className="w-full flex items-center justify-between p-4 sm:p-6 text-left hover:bg-gray-50 transition-colors"
                        onClick={() => toggleClause(i)}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <span className="text-xl font-black uppercase tracking-tight text-black">
                            {comp.clause_type.replace(/_/g, " ").toUpperCase()}
                          </span>
                          <Badge
                            variant="outline"
                            className={`rounded-none border-2 border-black font-black uppercase tracking-widest text-xs px-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                              comp.winner === "A"
                                ? "bg-blue-100 text-blue-900"
                                : comp.winner === "B"
                                  ? "bg-purple-100 text-purple-900"
                                  : "bg-gray-200 text-black"
                            }`}
                          >
                            {comp.winner === "A"
                              ? "A WINS"
                              : comp.winner === "B"
                                ? "B WINS"
                                : "TIE"}
                          </Badge>
                        </div>
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
                          <div className="hidden sm:flex items-center gap-6">
                            <div className="flex items-center gap-2 bg-gray-100 border-2 border-black px-3 py-1">
                              <span className="text-sm font-black text-black">
                                A:
                              </span>
                              {getRiskIcon(comp.contract_a.risk_level)}
                            </div>
                            <div className="flex items-center gap-2 bg-gray-100 border-2 border-black px-3 py-1">
                              <span className="text-sm font-black text-black">
                                B:
                              </span>
                              {getRiskIcon(comp.contract_b.risk_level)}
                            </div>
                          </div>
                          <div className="border-2 border-black bg-white p-1 ml-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {expandedClauses.has(i) ? (
                              <ChevronUp className="h-6 w-6 text-black" />
                            ) : (
                              <ChevronDown className="h-6 w-6 text-black" />
                            )}
                          </div>
                        </div>
                      </button>

                      {expandedClauses.has(i) && (
                        <div className="border-t-4 border-black p-4 sm:p-6 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                              <p className="text-sm font-black uppercase tracking-widest text-black mb-3 border-b-2 border-black/10 pb-2 flex items-center gap-2">
                                <span className="bg-black text-white px-1 border-2 border-black">
                                  A
                                </span>{" "}
                                CONTRACT A
                              </p>
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-1 border-2 border-black">
                                  {getRiskIcon(comp.contract_a.risk_level)}
                                </div>
                                <span
                                  className={`text-base font-black uppercase tracking-widest ${getRiskColor(
                                    comp.contract_a.risk_level,
                                  )}`}
                                >
                                  {comp.contract_a.value}
                                </span>
                              </div>
                              <p className="text-sm font-bold text-gray-700">
                                {comp.contract_a.summary}
                              </p>
                            </div>
                            <div className="p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                              <p className="text-sm font-black uppercase tracking-widest text-black mb-3 border-b-2 border-black/10 pb-2 flex items-center gap-2">
                                <span className="bg-black text-white px-1 border-2 border-black">
                                  B
                                </span>{" "}
                                CONTRACT B
                              </p>
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-1 border-2 border-black">
                                  {getRiskIcon(comp.contract_b.risk_level)}
                                </div>
                                <span
                                  className={`text-base font-black uppercase tracking-widest ${getRiskColor(
                                    comp.contract_b.risk_level,
                                  )}`}
                                >
                                  {comp.contract_b.value}
                                </span>
                              </div>
                              <p className="text-sm font-bold text-gray-700">
                                {comp.contract_b.summary}
                              </p>
                            </div>
                          </div>
                          <div className="bg-yellow-50 border-2 border-yellow-400 p-4 border-l-4 border-l-yellow-600">
                            <p className="text-base font-bold text-black flex items-start gap-3">
                              <span className="text-xl">💡</span>
                              {comp.explanation}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommendation */}
            <Card className="border-4 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-green-50 mb-12">
              <CardContent className="p-8">
                <h3 className="text-2xl font-black uppercase tracking-tighter text-black mb-4 flex items-center gap-3">
                  <span className="bg-yellow-400 border-2 border-black text-black px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    💡
                  </span>
                  FINAL RECOMMENDATION
                </h3>
                <p className="text-xl font-bold text-black border-l-4 border-black pl-4 py-2 leading-relaxed">
                  {result.recommendation}
                </p>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setResult(null);
                  setFileA(null);
                  setFileB(null);
                  setTextA("");
                  setTextB("");
                  setExpandedClauses(new Set());
                }}
                className="h-14 gap-3 bg-white border-4 border-black font-black uppercase tracking-widest rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none hover:bg-gray-100 text-black"
              >
                <ArrowLeftRight className="h-5 w-5" />
                COMPARE AGAIN
              </Button>
              <Button
                size="lg"
                onClick={() => setShowShareCard(true)}
                className="h-14 gap-3 bg-blue-400 hover:bg-blue-500 text-black border-4 border-black font-black uppercase tracking-widest rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
              >
                <Share2 className="h-5 w-5" />
                SHARE COMPARISON
              </Button>
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
