"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Shield,
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
import type { ComparisonResult, ClauseComparison } from "@/lib/bot/compare-analyzer";

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
  const [expandedClauses, setExpandedClauses] = useState<Set<number>>(new Set());

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
      case "safe": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "dangerous": return <XCircle className="h-4 w-4 text-red-500" />;
      case "illegal": return <Scale className="h-4 w-4 text-purple-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "safe": return "text-green-500";
      case "warning": return "text-yellow-500";
      case "dangerous": return "text-red-500";
      case "illegal": return "text-purple-500";
      default: return "text-yellow-500";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-purple-500";
    if (score >= 60) return "text-red-500";
    if (score >= 30) return "text-yellow-500";
    return "text-green-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "from-purple-500/20 to-purple-500/5";
    if (score >= 60) return "from-red-500/20 to-red-500/5";
    if (score >= 30) return "from-yellow-500/20 to-yellow-500/5";
    return "from-green-500/20 to-green-500/5";
  };

  return (
    <div className="relative px-4 sm:px-6 lg:px-8 py-8">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ArrowLeftRight className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl sm:text-4xl font-bold">
              Compare <span className="text-blue-500">Contracts</span>
            </h1>
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Upload two contracts side-by-side. ClauseWall will compare them clause-by-clause and tell you which one is safer.
          </p>
        </div>

        {/* Upload Section */}
        {!result && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Contract A */}
              <Card className="glass border-white/5">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      🅰️ Contract A
                    </h3>
                    <div className="flex gap-1">
                      <Button
                        variant={inputModeA === "file" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setInputModeA("file")}
                      >
                        File
                      </Button>
                      <Button
                        variant={inputModeA === "text" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setInputModeA("text")}
                      >
                        Text
                      </Button>
                    </div>
                  </div>

                  {inputModeA === "file" ? (
                    <div
                      {...dropzoneA.getRootProps()}
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                        dropzoneA.isDragActive
                          ? "border-blue-500 bg-blue-500/10"
                          : fileA
                          ? "border-green-500/50 bg-green-500/5"
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <input {...dropzoneA.getInputProps()} />
                      {fileA ? (
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-8 w-8 text-green-500" />
                          <p className="text-sm font-medium">{fileA.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Click to change
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Drop PDF/TXT or click to upload
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Textarea
                      placeholder="Paste contract A text here..."
                      value={textA}
                      onChange={(e) => setTextA(e.target.value)}
                      className="min-h-[200px] bg-white/5 border-white/10"
                    />
                  )}
                </CardContent>
              </Card>

              {/* Contract B */}
              <Card className="glass border-white/5">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      🅱️ Contract B
                    </h3>
                    <div className="flex gap-1">
                      <Button
                        variant={inputModeB === "file" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setInputModeB("file")}
                      >
                        File
                      </Button>
                      <Button
                        variant={inputModeB === "text" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setInputModeB("text")}
                      >
                        Text
                      </Button>
                    </div>
                  </div>

                  {inputModeB === "file" ? (
                    <div
                      {...dropzoneB.getRootProps()}
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                        dropzoneB.isDragActive
                          ? "border-blue-500 bg-blue-500/10"
                          : fileB
                          ? "border-green-500/50 bg-green-500/5"
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <input {...dropzoneB.getInputProps()} />
                      {fileB ? (
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-8 w-8 text-green-500" />
                          <p className="text-sm font-medium">{fileB.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Click to change
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Drop PDF/TXT or click to upload
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Textarea
                      placeholder="Paste contract B text here..."
                      value={textB}
                      onChange={(e) => setTextB(e.target.value)}
                      className="min-h-[200px] bg-white/5 border-white/10"
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Document Type + Compare Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger className="w-48 bg-white/5 border-white/10">
                  <SelectValue placeholder="Document Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rental">Rental Agreement</SelectItem>
                  <SelectItem value="employment">Employment Contract</SelectItem>
                  <SelectItem value="loan">Loan Agreement</SelectItem>
                  <SelectItem value="freelance">Freelance Contract</SelectItem>
                  <SelectItem value="tos">Terms of Service</SelectItem>
                  <SelectItem value="nda">NDA</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Button
                size="lg"
                onClick={handleCompare}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 gap-2 px-8"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Comparing...
                  </>
                ) : (
                  <>
                    <ArrowLeftRight className="h-5 w-5" />
                    Compare Contracts
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
            <Card className="glass border-white/5 mb-6 overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 p-6 sm:p-8 text-center">
                  <Trophy className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
                  <h2 className="text-2xl font-bold mb-2">
                    {result.winner === "A"
                      ? "🅰️ Contract A is Better"
                      : result.winner === "B"
                      ? "🅱️ Contract B is Better"
                      : "🤝 Both Are Similar"}
                  </h2>
                  <p className="text-muted-foreground max-w-xl mx-auto">
                    {result.verdict}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Score Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card
                className={`glass border-white/5 ${
                  result.winner === "A" ? "ring-2 ring-green-500/30" : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">🅰️ Contract A</h3>
                    {result.winner === "A" && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <Trophy className="h-3 w-3 mr-1" />
                        Better Choice
                      </Badge>
                    )}
                  </div>
                  <div
                    className={`text-center p-6 rounded-xl bg-gradient-to-b ${getScoreBg(
                      result.score_a
                    )}`}
                  >
                    <p className={`text-5xl font-bold ${getScoreColor(result.score_a)}`}>
                      {result.score_a}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      /100 Risk Score
                    </p>
                    <p className={`text-sm font-medium mt-2 ${getScoreColor(result.score_a)}`}>
                      {result.label_a}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`glass border-white/5 ${
                  result.winner === "B" ? "ring-2 ring-green-500/30" : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">🅱️ Contract B</h3>
                    {result.winner === "B" && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <Trophy className="h-3 w-3 mr-1" />
                        Better Choice
                      </Badge>
                    )}
                  </div>
                  <div
                    className={`text-center p-6 rounded-xl bg-gradient-to-b ${getScoreBg(
                      result.score_b
                    )}`}
                  >
                    <p className={`text-5xl font-bold ${getScoreColor(result.score_b)}`}>
                      {result.score_b}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      /100 Risk Score
                    </p>
                    <p className={`text-sm font-medium mt-2 ${getScoreColor(result.score_b)}`}>
                      {result.label_b}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Key Differences */}
            {result.key_differences.length > 0 && (
              <Card className="glass border-white/5 mb-6">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    ⚡ Key Differences
                  </h3>
                  <div className="space-y-2">
                    {result.key_differences.map((diff, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-lg bg-white/5"
                      >
                        <ArrowRight className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-muted-foreground">{diff}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Clause-by-Clause */}
            <Card className="glass border-white/5 mb-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  📊 Clause-by-Clause Comparison
                </h3>
                <div className="space-y-3">
                  {result.clause_comparisons.map((comp, i) => (
                    <div
                      key={i}
                      className="border border-white/5 rounded-lg overflow-hidden"
                    >
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
                        onClick={() => toggleClause(i)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">
                            {comp.clause_type.replace(/_/g, " ").toUpperCase()}
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              comp.winner === "A"
                                ? "text-blue-400 border-blue-400/30"
                                : comp.winner === "B"
                                ? "text-purple-400 border-purple-400/30"
                                : "text-gray-400 border-gray-400/30"
                            }
                          >
                            {comp.winner === "A"
                              ? "A wins"
                              : comp.winner === "B"
                              ? "B wins"
                              : "Tie"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">A:</span>
                            {getRiskIcon(comp.contract_a.risk_level)}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">B:</span>
                            {getRiskIcon(comp.contract_b.risk_level)}
                          </div>
                          {expandedClauses.has(i) ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {expandedClauses.has(i) && (
                        <div className="border-t border-white/5 p-4 bg-white/[0.02]">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div className="p-3 rounded-lg bg-white/5">
                              <p className="text-xs text-muted-foreground mb-1">
                                🅰️ Contract A
                              </p>
                              <div className="flex items-center gap-2 mb-1">
                                {getRiskIcon(comp.contract_a.risk_level)}
                                <span className={`text-sm font-medium ${getRiskColor(comp.contract_a.risk_level)}`}>
                                  {comp.contract_a.value}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {comp.contract_a.summary}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-white/5">
                              <p className="text-xs text-muted-foreground mb-1">
                                🅱️ Contract B
                              </p>
                              <div className="flex items-center gap-2 mb-1">
                                {getRiskIcon(comp.contract_b.risk_level)}
                                <span className={`text-sm font-medium ${getRiskColor(comp.contract_b.risk_level)}`}>
                                  {comp.contract_b.value}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {comp.contract_b.summary}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground italic">
                            💡 {comp.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommendation */}
            <Card className="glass border-white/5 mb-8">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  💡 Recommendation
                </h3>
                <p className="text-muted-foreground">{result.recommendation}</p>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-center gap-4">
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
                className="gap-2"
              >
                <ArrowLeftRight className="h-5 w-5" />
                Compare Again
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}