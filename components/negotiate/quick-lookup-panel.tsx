"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Loader2, Database, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import type { QuickLookupResult } from "@/types";

const PLACEHOLDER_EXAMPLES = [
  "Can they ask for 6 months deposit?",
  "What is the maximum notice period?",
  "Is a non-compete clause legal?",
  "Can they increase rent mid-term?",
  "Is painting charges on tenant legal?",
  "What's the max brokerage in Mumbai?",
];

interface QuickLookupPanelProps {
  jurisdiction: string;
  documentType: string;
  onResult: (result: QuickLookupResult) => void;
}

export default function QuickLookupPanel({ jurisdiction, documentType, onResult }: QuickLookupPanelProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<QuickLookupResult | null>(null);
  const [history, setHistory] = useState<QuickLookupResult[]>([]);
  const [expandedHistoryIndex, setExpandedHistoryIndex] = useState<number | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cycle placeholder text
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_EXAMPLES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async () => {
    if (!query.trim() || loading) return;

    setLoading(true);
    setCurrentResult(null);

    try {
      const response = await fetch("/api/negotiate/live/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          jurisdiction,
          document_type: documentType,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) throw new Error("Lookup failed");

      const result: QuickLookupResult = await response.json();
      setCurrentResult(result);
      setHistory((prev) => [result, ...prev]);
      onResult(result);
      setQuery("");
    } catch (error) {
      console.error("Lookup error:", error);
      setCurrentResult({
        query: query.trim(),
        clause_type_detected: null,
        jurisdiction_detected: null,
        legal_answer: "Failed to process your query. Please try again.",
        legal_limit: null,
        statute: null,
        what_to_say: "",
        related_rules: [],
        source: "ai",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setQuery(text);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    setIsListening(true);
    recognition.start();
  };

  return (
    <div className="space-y-4">
      {/* Input Area */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder={PLACEHOLDER_EXAMPLES[placeholderIndex]}
          className="w-full px-4 py-4 pr-24 text-base bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
          style={{ fontSize: "16px" }} // Prevents iOS zoom
          disabled={loading}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            onClick={handleVoiceInput}
            className={`p-2.5 rounded-xl transition-all ${
              isListening
                ? "bg-red-500/20 text-red-400 animate-pulse"
                : "text-white/30 hover:text-white/60 hover:bg-white/5"
            }`}
            disabled={loading}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!query.trim() || loading}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Loading shimmer */}
      {loading && (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-3 animate-pulse">
          <div className="h-4 bg-white/5 rounded w-3/4" />
          <div className="h-4 bg-white/5 rounded w-1/2" />
          <div className="h-8 bg-white/5 rounded w-full" />
          <div className="h-3 bg-white/5 rounded w-2/3" />
        </div>
      )}

      {/* Current Result */}
      {currentResult && !loading && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Answer */}
          <div className="p-5">
            <p className="text-sm text-white/50 mb-1">Answer</p>
            <p className="text-base text-white leading-relaxed">{currentResult.legal_answer}</p>
          </div>

          {/* Legal Limit Badge */}
          {currentResult.legal_limit && (
            <div className="px-5 pb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400 font-medium">
                📏 Legal Limit: {currentResult.legal_limit}
              </span>
            </div>
          )}

          {/* Statute */}
          {currentResult.statute && (
            <div className="px-5 pb-3">
              <p className="text-xs text-white/30">📖 Law: {currentResult.statute}</p>
            </div>
          )}

          {/* What to Say */}
          {currentResult.what_to_say && (
            <div className="mx-5 mb-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <p className="text-xs text-emerald-400/70 mb-1 font-medium">💬 Say This:</p>
              <p className="text-sm text-emerald-300 leading-relaxed">
                &ldquo;{currentResult.what_to_say}&rdquo;
              </p>
            </div>
          )}

          {/* Source Badge */}
          <div className="px-5 pb-4">
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium ${
                currentResult.source === "database"
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : currentResult.source === "hybrid"
                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                  : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
              }`}
            >
              {currentResult.source === "database" ? (
                <><Database className="w-3 h-3" /> Verified from law database</>
              ) : (
                <><Sparkles className="w-3 h-3" /> AI analysis</>
              )}
            </span>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 1 && (
        <div className="space-y-2">
          <p className="text-xs text-white/20 font-medium px-1">Previous Lookups</p>
          {history.slice(1).map((item, idx) => (
            <button
              key={idx}
              onClick={() => setExpandedHistoryIndex(expandedHistoryIndex === idx ? null : idx)}
              className="w-full text-left rounded-xl border border-white/5 bg-white/[0.01] p-3 hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/60 truncate">{item.query}</p>
                  {expandedHistoryIndex !== idx && (
                    <p className="text-xs text-white/30 truncate mt-0.5">
                      {item.legal_answer.substring(0, 80)}...
                    </p>
                  )}
                </div>
                {expandedHistoryIndex === idx ? (
                  <ChevronUp className="w-4 h-4 text-white/20 flex-shrink-0 ml-2" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-white/20 flex-shrink-0 ml-2" />
                )}
              </div>
              {expandedHistoryIndex === idx && (
                <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                  <p className="text-sm text-white/80">{item.legal_answer}</p>
                  {item.legal_limit && (
                    <p className="text-xs text-blue-400">📏 {item.legal_limit}</p>
                  )}
                  {item.what_to_say && (
                    <p className="text-xs text-emerald-400/80">💬 &ldquo;{item.what_to_say}&rdquo;</p>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
