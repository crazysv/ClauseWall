"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Copy,
  Printer,
  Download,
  MessageSquare,
  Shield,
  Scale,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
  Lightbulb,
  ArrowRight,
  FileText,
  Flag,
  Swords,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { getStateName, getDocumentTypeLabel } from "@/lib/utils/constants";
import type { NegotiationPlaybook, NegotiationScript } from "@/types";
import { toast } from "sonner";

export default function NegotiatePage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;

  const [playbook, setPlaybook] = useState<NegotiationPlaybook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedScripts, setExpandedScripts] = useState<Set<number>>(new Set());
  const [expandedCounters, setExpandedCounters] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const supabase = createClient();

  // Document info
  const [docInfo, setDocInfo] = useState<{
    filename: string;
    document_type: string;
    jurisdiction: string;
    entity_name: string | null;
    overall_risk_score: number;
  } | null>(null);

  useEffect(() => {
    async function loadAndGenerate() {
      try {
        // Fetch document info
        const { data: doc, error: docErr } = await supabase
          .from("documents")
          .select("original_filename, document_type, jurisdiction, entity_name, overall_risk_score, analysis_status")
          .eq("id", documentId)
          .single();

        if (docErr || !doc) {
          setError("Document not found");
          setLoading(false);
          return;
        }

        if (doc.analysis_status !== "completed") {
          setError("Analysis is not complete yet. Please wait for it to finish.");
          setLoading(false);
          return;
        }

        setDocInfo({
          filename: doc.original_filename || "Untitled",
          document_type: doc.document_type,
          jurisdiction: doc.jurisdiction,
          entity_name: doc.entity_name,
          overall_risk_score: doc.overall_risk_score,
        });

        // Generate playbook
        const response = await fetch("/api/negotiate/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to generate playbook");
        }

        setPlaybook(data.playbook);

        // Auto-expand first script
        if (data.playbook.scripts.length > 0) {
          setExpandedScripts(new Set([0]));
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    loadAndGenerate();
  }, [documentId]);

  const toggleScript = (index: number) => {
    setExpandedScripts((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleCounter = (key: string) => {
    setExpandedCounters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAllScripts = () => {
    if (!playbook) return;
    setExpandedScripts(new Set(playbook.scripts.map((_, i) => i)));
  };

  const collapseAllScripts = () => {
    setExpandedScripts(new Set());
  };

  const handleCopyAll = async () => {
    if (!playbook) return;
    const text = formatPlaybookAsText(playbook);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Playbook copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handlePrint = () => window.print();

  const handleDownload = () => {
    if (!playbook) return;
    const text = formatPlaybookAsText(playbook);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Negotiation_Playbook_${docInfo?.filename || "contract"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "illegal": return <Scale className="h-4 w-4 text-purple-500" />;
      case "dangerous": return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getRiskBadgeClass = (level: string) => {
    switch (level) {
      case "illegal": return "bg-purple-500/15 text-purple-400 border-purple-500/30";
      case "dangerous": return "bg-red-500/15 text-red-400 border-red-500/30";
      case "warning": return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
      default: return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
    }
  };

  const getStrengthBadge = (strength: string) => {
    switch (strength) {
      case "strong":
        return (
          <Badge className="bg-green-500/15 text-green-400 border-green-500/30 text-[10px]">
            💪 Strong Position
          </Badge>
        );
      case "moderate":
        return (
          <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/30 text-[10px]">
            ⚖️ Moderate Position
          </Badge>
        );
      case "weak":
        return (
          <Badge className="bg-gray-500/15 text-gray-400 border-gray-500/30 text-[10px]">
            🤝 Diplomatic Approach
          </Badge>
        );
      default:
        return null;
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <Swords className="h-12 w-12 text-blue-400 animate-pulse" />
          <div className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">
            Building Your Negotiation Playbook
          </h2>
          <p className="text-gray-400 text-sm max-w-md">
            Crafting personalized scripts with counter-responses and escalation paths...
          </p>
        </div>
        <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4 px-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <h2 className="text-xl font-semibold text-white">{error}</h2>
        <Button onClick={() => router.back()} variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  if (!playbook || !docInfo) return null;

  const jurisdictionName = getStateName(docInfo.jurisdiction);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Back */}
        <button
          onClick={() => router.push(`/results/${documentId}`)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors print:hidden"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to results
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-blue-500/10 rounded-xl">
              <Swords className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Negotiation Playbook
              </h1>
              <p className="text-sm text-gray-400">
                {docInfo.filename} · {getDocumentTypeLabel(docInfo.document_type)} · {jurisdictionName}
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="px-3 py-1.5 rounded-lg bg-gray-900/50 border border-gray-800 text-sm">
              <span className="text-gray-400">Issues: </span>
              <span className="font-semibold text-white">{playbook.total_issues}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-gray-900/50 border border-gray-800 text-sm">
              <span className="text-gray-400">Priority: </span>
              <span className="font-semibold text-white">{playbook.priority_order}</span>
            </div>
            {docInfo.entity_name && (
              <div className="px-3 py-1.5 rounded-lg bg-gray-900/50 border border-gray-800 text-sm">
                <span className="text-gray-400">Negotiating with: </span>
                <span className="font-semibold text-white">{docInfo.entity_name}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Action Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-8 print:hidden"
        >
          <Button variant="outline" size="sm" onClick={handleCopyAll} className="gap-2">
            {copied ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy All"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <div className="flex-1" />
          <button onClick={expandAllScripts} className="text-xs text-gray-500 hover:text-gray-300">
            Expand All
          </button>
          <button onClick={collapseAllScripts} className="text-xs text-gray-500 hover:text-gray-300">
            Collapse All
          </button>
        </motion.div>

        {/* Opening Approach */}
        {playbook.opening_approach && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6 p-5 rounded-xl bg-blue-500/5 border border-blue-500/20"
          >
            <p className="text-xs font-medium text-blue-400 mb-2 flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" />
              HOW TO START THE CONVERSATION
            </p>
            <p className="text-sm text-gray-300 leading-relaxed italic">
              &quot;{playbook.opening_approach}&quot;
            </p>
          </motion.div>
        )}

        {/* No Issues */}
        {playbook.scripts.length === 0 && (
          <Card className="bg-green-500/5 border-green-500/20">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-400 mb-2">
                No Negotiation Needed!
              </h3>
              <p className="text-gray-400 text-sm">
                This contract appears fair. No risky clauses found to negotiate.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Script Cards */}
        <div className="space-y-4 mb-8">
          {playbook.scripts.map((script, index) => {
            const isExpanded = expandedScripts.has(index);

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.08 }}
              >
                <Card className="bg-gray-900/50 border-gray-800 overflow-hidden">
                  {/* Script Header */}
                  <button
                    onClick={() => toggleScript(index)}
                    className="w-full p-5 flex items-start justify-between text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-sm font-bold text-gray-400 flex-shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {getRiskIcon(script.risk_level)}
                          <Badge className={getRiskBadgeClass(script.risk_level)}>
                            {script.risk_level.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] border-white/10 text-gray-500">
                            {script.clause_type}
                          </Badge>
                          {getStrengthBadge(script.strength)}
                        </div>
                        <p className="text-sm text-gray-300">{script.clause_summary}</p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    )}
                  </button>

                  {/* Script Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 space-y-5">
                          <div className="border-t border-white/5" />

                          {/* Opening Statement */}
                          <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/15">
                            <p className="text-xs font-medium text-blue-400 mb-2 flex items-center gap-1.5">
                              <MessageSquare className="h-3.5 w-3.5" />
                              YOUR OPENING
                            </p>
                            <p className="text-sm text-gray-200 leading-relaxed">
                              &quot;{script.opening_statement}&quot;
                            </p>
                          </div>

                          {/* Counter Responses */}
                          {script.counter_responses && script.counter_responses.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-400 mb-3 flex items-center gap-1.5">
                                <Swords className="h-3.5 w-3.5" />
                                IF THEY PUSH BACK...
                              </p>
                              <div className="space-y-2.5">
                                {script.counter_responses.map((cr, crIndex) => {
                                  const counterKey = `${index}-${crIndex}`;
                                  const isCounterExpanded = expandedCounters.has(counterKey);

                                  return (
                                    <div
                                      key={crIndex}
                                      className="rounded-lg border border-white/5 overflow-hidden"
                                    >
                                      <button
                                        onClick={() => toggleCounter(counterKey)}
                                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/[0.02] transition-colors"
                                      >
                                        <span className="text-red-400 text-xs flex-shrink-0">
                                          They say:
                                        </span>
                                        <span className="text-sm text-gray-300 flex-1 italic">
                                          &quot;{cr.they_say}&quot;
                                        </span>
                                        {isCounterExpanded ? (
                                          <ChevronUp className="h-4 w-4 text-gray-600 flex-shrink-0" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4 text-gray-600 flex-shrink-0" />
                                        )}
                                      </button>

                                      <AnimatePresence>
                                        {isCounterExpanded && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className="overflow-hidden"
                                          >
                                            <div className="px-3 pb-3 pt-0">
                                              <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/15">
                                                <span className="text-green-400 text-xs block mb-1.5">
                                                  You say:
                                                </span>
                                                <p className="text-sm text-green-300 leading-relaxed">
                                                  &quot;{cr.you_say}&quot;
                                                </p>
                                              </div>
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Escalation */}
                          {script.escalation && (
                            <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/15">
                              <p className="text-xs font-medium text-red-400 mb-2 flex items-center gap-1.5">
                                <Flag className="h-3.5 w-3.5" />
                                IF THEY COMPLETELY REFUSE
                              </p>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-start gap-2">
                                  <span className="text-gray-500 text-xs mt-0.5">Action:</span>
                                  <span className="text-gray-300">{script.escalation.action}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="text-gray-500 text-xs mt-0.5">Authority:</span>
                                  <span className="text-gray-300">{script.escalation.authority}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="text-gray-500 text-xs mt-0.5">Law:</span>
                                  <span className="text-blue-300">{script.escalation.law_reference}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Closing Statement */}
        {playbook.closing_statement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-8 p-5 rounded-xl bg-green-500/5 border border-green-500/20"
          >
            <p className="text-xs font-medium text-green-400 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              HOW TO END THE CONVERSATION
            </p>
            <p className="text-sm text-gray-300 leading-relaxed italic">
              &quot;{playbook.closing_statement}&quot;
            </p>
          </motion.div>
        )}

        {/* General Tips */}
        {playbook.general_tips.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-8 p-5 rounded-xl bg-gray-900/50 border border-gray-800"
          >
            <p className="text-xs font-medium text-amber-400 mb-3 flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5" />
              GENERAL NEGOTIATION TIPS
            </p>
            <ul className="space-y-2">
              {playbook.general_tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-amber-500 mt-1 text-xs">💡</span>
                  {tip}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Bottom Actions */}
        <div className="flex flex-wrap gap-3 justify-center print:hidden">
          <Link href={`/results/${documentId}`}>
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Analysis
            </Button>
          </Link>
          <Link href={`/letter/${documentId}`}>
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <FileText className="h-4 w-4" />
              Generate Legal Notice
            </Button>
          </Link>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-600 text-center mt-8 print:hidden">
          These scripts are AI-generated guidance, not legal advice. Adapt them to your situation.
          ClauseWall is not a substitute for professional legal counsel.
        </p>
      </div>
    </div>
  );
}

// ============================================
// Helper: Format playbook as plain text for copy/download
// ============================================

function formatPlaybookAsText(playbook: NegotiationPlaybook): string {
  const lines: string[] = [];

  lines.push("═".repeat(50));
  lines.push("NEGOTIATION PLAYBOOK — Generated by ClauseWall");
  lines.push("═".repeat(50));
  lines.push("");
  lines.push(`Contract Type: ${playbook.document_type}`);
  lines.push(`Jurisdiction: ${playbook.jurisdiction}`);
  if (playbook.entity_name) lines.push(`Negotiating with: ${playbook.entity_name}`);
  lines.push(`Total Issues: ${playbook.total_issues}`);
  lines.push(`Priority: ${playbook.priority_order}`);
  lines.push("");

  if (playbook.opening_approach) {
    lines.push("── HOW TO START ──");
    lines.push(`"${playbook.opening_approach}"`);
    lines.push("");
  }

  for (const script of playbook.scripts) {
    lines.push("─".repeat(50));
    lines.push(`ISSUE: ${script.clause_type.toUpperCase()} (${script.risk_level.toUpperCase()})`);
    lines.push(`Position: ${script.strength}`);
    lines.push(`Summary: ${script.clause_summary}`);
    lines.push("");
    lines.push("YOUR OPENING:");
    lines.push(`"${script.opening_statement}"`);
    lines.push("");

    if (script.counter_responses) {
      for (const cr of script.counter_responses) {
        lines.push(`  If they say: "${cr.they_say}"`);
        lines.push(`  You say: "${cr.you_say}"`);
        lines.push("");
      }
    }

    if (script.escalation) {
      lines.push("IF THEY REFUSE:");
      lines.push(`  Action: ${script.escalation.action}`);
      lines.push(`  Authority: ${script.escalation.authority}`);
      lines.push(`  Law: ${script.escalation.law_reference}`);
    }
    lines.push("");
  }

  if (playbook.closing_statement) {
    lines.push("── HOW TO END ──");
    lines.push(`"${playbook.closing_statement}"`);
    lines.push("");
  }

  if (playbook.general_tips.length > 0) {
    lines.push("── GENERAL TIPS ──");
    for (const tip of playbook.general_tips) {
      lines.push(`💡 ${tip}`);
    }
    lines.push("");
  }

  lines.push("═".repeat(50));
  lines.push("Generated by ClauseWall — Not legal advice");
  lines.push("═".repeat(50));

  return lines.join("\n");
}