"use client";

import { useState, useRef } from "react";
import {
  Send,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  XCircle,
} from "lucide-react";
import type { BluffAnalysis, BluffCheckResult } from "@/types";

interface BluffDetectorPanelProps {
  jurisdiction: string;
  documentType: string;
}

const RESULT_STYLES: Record<
  BluffCheckResult,
  {
    bg: string;
    border: string;
    text: string;
    icon: React.ReactNode;
    label: string;
  }
> = {
  false_claim: {
    bg: "bg-red-500/5",
    border: "border-red-500/20",
    text: "text-red-400",
    icon: <XCircle className="w-5 h-5 text-red-400" />,
    label: "FALSE CLAIM",
  },
  true_claim: {
    bg: "bg-green-500/5",
    border: "border-green-500/20",
    text: "text-green-400",
    icon: <CheckCircle2 className="w-5 h-5 text-green-400" />,
    label: "VERIFIED TRUE",
  },
  partially_true: {
    bg: "bg-yellow-500/5",
    border: "border-yellow-500/20",
    text: "text-yellow-400",
    icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
    label: "PARTIALLY TRUE",
  },
  misleading: {
    bg: "bg-orange-500/5",
    border: "border-orange-500/20",
    text: "text-orange-400",
    icon: <AlertTriangle className="w-5 h-5 text-orange-400" />,
    label: "MISLEADING",
  },
  unverifiable: {
    bg: "bg-gray-500/5",
    border: "border-gray-500/20",
    text: "text-gray-400",
    icon: <HelpCircle className="w-5 h-5 text-gray-400" />,
    label: "UNVERIFIABLE",
  },
};

const EXAMPLE_CLAIMS = [
  "They said 6 months deposit is required by law",
  "They claim 3% annual rent hike is mandatory",
  "Landlord says painting charges on tenant is the law",
  "They say non-compete for 3 years is standard",
  "Broker says 2 months brokerage is the rule",
];

export default function BluffDetectorPanel({
  jurisdiction,
  documentType,
}: BluffDetectorPanelProps) {
  const [claim, setClaim] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BluffAnalysis[]>([]);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Cycle placeholder
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
    } catch (error) {
      console.error("Bluff check error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center py-2">
        <p className="text-sm text-white/40">
          Type what they&apos;re claiming and we&apos;ll check it against the
          law
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
          className="w-full px-4 py-4 pr-14 text-base bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all resize-none"
          style={{ fontSize: "16px" }}
          disabled={loading}
        />
        <button
          onClick={handleCheck}
          disabled={!claim.trim() || loading}
          className="absolute right-3 bottom-3 p-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-3 animate-pulse">
          <div className="h-5 bg-white/5 rounded w-1/3" />
          <div className="h-4 bg-white/5 rounded w-full" />
          <div className="h-4 bg-white/5 rounded w-2/3" />
          <div className="h-10 bg-white/5 rounded w-full" />
        </div>
      )}

      {/* Results */}
      {results.map((result, idx) => {
        const style =
          RESULT_STYLES[result.result] || RESULT_STYLES.unverifiable;

        return (
          <div
            key={result.id || idx}
            className={`rounded-2xl border ${style.border} ${style.bg} overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            {/* Header badge */}
            <div className={`flex items-center gap-2 px-5 pt-4 pb-2`}>
              {style.icon}
              <span className={`text-sm font-bold ${style.text}`}>
                {style.label}
              </span>
              <span className="ml-auto text-[10px] text-white/20">
                {result.confidence} confidence
              </span>
            </div>

            {/* Their claim */}
            <div className="px-5 pb-3">
              <p className="text-xs text-white/30 mb-0.5">They claimed:</p>
              <p className="text-sm text-white/60 italic">
                &ldquo;{result.claim_text}&rdquo;
              </p>
            </div>

            {/* Actual position */}
            <div className="px-5 pb-3">
              <p className="text-xs text-white/30 mb-0.5">
                Actual legal position:
              </p>
              <p className="text-sm text-white/80 leading-relaxed">
                {result.actual_legal_position}
              </p>
            </div>

            {/* Legal limit & their value comparison */}
            {(result.legal_limit || result.their_claim_value) && (
              <div className="mx-5 mb-3 grid grid-cols-2 gap-2">
                {result.legal_limit && (
                  <div className="rounded-lg bg-white/[0.03] p-2.5 text-center">
                    <p className="text-[10px] text-white/30">Legal Limit</p>
                    <p className="text-sm font-medium text-green-400">
                      {result.legal_limit}
                    </p>
                  </div>
                )}
                {result.their_claim_value && (
                  <div className="rounded-lg bg-white/[0.03] p-2.5 text-center">
                    <p className="text-[10px] text-white/30">
                      They&apos;re Asking
                    </p>
                    <p
                      className={`text-sm font-medium ${result.result === "false_claim" ? "text-red-400" : "text-white/60"}`}
                    >
                      {result.their_claim_value}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Difference */}
            {result.difference && (
              <div className="px-5 pb-3">
                <p className={`text-xs ${style.text} font-medium`}>
                  📊 {result.difference}
                </p>
              </div>
            )}

            {/* Statute */}
            {result.statute_name && (
              <div className="px-5 pb-3">
                <p className="text-[10px] text-white/20">
                  📖 {result.statute_name}{" "}
                  {result.statute_code ? `(${result.statute_code})` : ""}
                </p>
              </div>
            )}

            {/* What to say */}
            {result.what_to_say && (
              <div className="mx-5 mb-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <p className="text-xs text-emerald-400/70 mb-1 font-medium">
                  💬 Say This:
                </p>
                <p className="text-sm text-emerald-300 leading-relaxed">
                  &ldquo;{result.what_to_say}&rdquo;
                </p>
              </div>
            )}

            {/* Source */}
            <div className="px-5 pb-4">
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] ${
                  result.source === "database"
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                }`}
              >
                {result.source === "database"
                  ? "Verified from law database"
                  : "AI analysis"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
