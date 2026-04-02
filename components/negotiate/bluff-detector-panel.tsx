"use client";

import { useState, useRef } from "react";
import { Send, Loader2, AlertTriangle, CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import type { BluffAnalysis, BluffCheckResult } from "@/types";

interface BluffDetectorPanelProps {
  jurisdiction: string;
  documentType: string;
}

const RESULT_STYLES: Record<BluffCheckResult, {
  bg: string; border: string; text: string; icon: React.ReactNode; label: string;
}> = {
  false_claim: {
    bg: "bg-white", border: "border-slate-200 border-l-4 border-l-red-500", text: "text-red-600",
    icon: <XCircle className="w-5 h-5 text-red-600" />, label: "FALSE CLAIM",
  },
  true_claim: {
    bg: "bg-white", border: "border-slate-200 border-l-4 border-l-green-500", text: "text-green-600",
    icon: <CheckCircle2 className="w-5 h-5 text-green-600" />, label: "VERIFIED TRUE",
  },
  partially_true: {
    bg: "bg-white", border: "border-slate-200 border-l-4 border-l-yellow-500", text: "text-yellow-600",
    icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />, label: "PARTIALLY TRUE",
  },
  misleading: {
    bg: "bg-white", border: "border-slate-200 border-l-4 border-l-orange-500", text: "text-orange-600",
    icon: <AlertTriangle className="w-5 h-5 text-orange-600" />, label: "MISLEADING",
  },
  unverifiable: {
    bg: "bg-white", border: "border-slate-200 border-l-4 border-l-slate-400", text: "text-slate-600",
    icon: <HelpCircle className="w-5 h-5 text-slate-500 dark:text-slate-400" />, label: "UNVERIFIABLE",
  },
};

const EXAMPLE_CLAIMS = [
  "They said 6 months deposit is required by law",
  "They claim 3% annual rent hike is mandatory",
  "Landlord says painting charges on tenant is the law",
  "They say non-compete for 3 years is standard",
  "Broker says 2 months brokerage is the rule",
];

export function BluffDetectorPanel({ jurisdiction, documentType }: BluffDetectorPanelProps) {
  const [claim, setClaim] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BluffAnalysis[]>([]);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useState(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % EXAMPLE_CLAIMS.length);
    }, 4000);
    return () => clearInterval(interval);
  });

  const handleCheck = async () => {
    if (!claim.trim() || loading) return;

    setLoading(true);

    try {
      const response = await fetch("/api/negotiate/live/bluff-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim_text: claim.trim(),
          jurisdiction,
          document_type: documentType,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) throw new Error("Bluff check failed");

      const result: BluffAnalysis = await response.json();
      setResults((prev) => [result, ...prev]);
      setClaim("");
    } catch {
        // Silently handled
      } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center py-2">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Type what they&apos;re claiming and we&apos;ll check it against the law
        </p>
      </div>

      {/* Input */}
      <div className="relative">
        <textarea
          ref={inputRef}
          value={claim}
          onChange={(e) => setClaim(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleCheck();
            }
          }}
          placeholder={EXAMPLE_CLAIMS[placeholderIdx]}
          rows={2}
          className="w-full px-4 py-4 pr-14 text-base bg-white dark:bg-card border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none"
          style={{ fontSize: "16px" }}
          disabled={loading}
        />
        <button
          onClick={handleCheck}
          disabled={!claim.trim() || loading}
          className="absolute right-3 bottom-3 p-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm dark:shadow-slate-900/20"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-5 space-y-3 animate-pulse shadow-sm dark:shadow-slate-900/20">
          <div className="h-5 bg-slate-200 rounded w-1/3" />
          <div className="h-4 bg-slate-200 rounded w-full" />
          <div className="h-4 bg-slate-200 rounded w-2/3" />
          <div className="h-10 bg-slate-200 rounded w-full" />
        </div>
      )}

      {/* Results */}
      {results.map((result, idx) => {
        const style = RESULT_STYLES[result.result] || RESULT_STYLES.unverifiable;

        return (
          <div
            key={result.id || idx}
            className={`rounded-xl border ${style.border} ${style.bg} overflow-hidden shadow-sm dark:shadow-slate-900/20 animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            {/* Header badge */}
            <div className={`flex items-center gap-2 px-5 pt-4 pb-2`}>
              {style.icon}
              <span className={`text-sm font-bold ${style.text}`}>{style.label}</span>
              <span className="ml-auto text-xs text-slate-400">
                {result.confidence} confidence
              </span>
            </div>

            {/* Their claim */}
            <div className="px-5 pb-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">They claimed:</p>
              <p className="text-sm text-slate-700 italic">&ldquo;{result.claim_text}&rdquo;</p>
            </div>

            {/* Actual position */}
            <div className="px-5 pb-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Actual legal position:</p>
              <p className="text-sm text-slate-900 dark:text-slate-100 leading-relaxed font-medium">{result.actual_legal_position}</p>
            </div>

            {/* Legal limit & their value comparison */}
            {(result.legal_limit || result.their_claim_value) && (
               <div className="mx-5 mb-3 grid grid-cols-2 gap-3">
                {result.legal_limit && (
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 p-3 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Legal Limit</p>
                    <p className="text-sm font-semibold text-green-600">{result.legal_limit}</p>
                  </div>
                )}
                {result.their_claim_value && (
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 p-3 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">They&apos;re Asking</p>
                    <p className={`text-sm font-semibold ${result.result === "false_claim" ? "text-red-600" : "text-slate-700"}`}>
                      {result.their_claim_value}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Difference */}
            {result.difference && (
              <div className="px-5 pb-3">
                <p className={`text-xs ${style.text} font-medium`}>📊 {result.difference}</p>
              </div>
            )}

            {/* Statute */}
            {result.statute_name && (
              <div className="px-5 pb-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  📖 {result.statute_name} {result.statute_code ? `(${result.statute_code})` : ""}
                </p>
              </div>
            )}

            {/* What to say */}
            {result.what_to_say && (
              <div className="mx-5 mb-4 p-4 rounded-xl bg-teal-50 border border-teal-100">
                <p className="text-xs text-teal-700 mb-1 font-semibold">💬 Say This:</p>
                <p className="text-sm text-teal-900 leading-relaxed font-medium">
                  &ldquo;{result.what_to_say}&rdquo;
                </p>
              </div>
            )}

            {/* Source */}
            <div className="px-5 pb-4">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                  result.source === "database"
                    ? "bg-green-100 text-green-700"
                    : "bg-indigo-100 text-indigo-700"
                }`}
              >
                {result.source === "database" ? "Verified from law database" : "AI analysis"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
