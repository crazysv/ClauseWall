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

export function QuickLookupPanel({ jurisdiction, documentType, onResult }: QuickLookupPanelProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<QuickLookupResult | null>(null);
  const [history, setHistory] = useState<QuickLookupResult[]>([]);
  const [expandedHistoryIndex, setExpandedHistoryIndex] = useState<number | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
          className="w-full px-5 py-5 pr-28 text-base bg-white dark:bg-card border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all font-medium"
          style={{ fontSize: "16px" }}
          disabled={loading}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <button
            onClick={handleVoiceInput}
            className={`p-2.5 rounded-lg transition-all ${ isListening ? "bg-red-50 text-red-600 animate-pulse border border-red-200" : "text-slate-400 hover:text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 border border-transparent" }`}
            disabled={loading}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!query.trim() || loading}
            className="p-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm dark:shadow-slate-900/20"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Loading shimmer */}
      {loading && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-6 space-y-4 animate-pulse shadow-sm dark:shadow-slate-900/20">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-4 bg-slate-200 rounded w-1/2" />
          <div className="h-8 bg-slate-200 rounded w-full" />
          <div className="h-3 bg-slate-200 rounded w-2/3" />
        </div>
      )}

      {/* Current Result */}
      {currentResult && !loading && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Answer */}
          <div className="p-6">
             <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Answer</p>
             <p className="text-base text-slate-900 dark:text-slate-100 leading-relaxed font-medium">{currentResult.legal_answer}</p>
          </div>

          {/* Legal Limit Badge */}
          {currentResult.legal_limit && (
            <div className="px-4 md:px-6 pb-4">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-sm text-indigo-700 font-bold">
                📏 Legal Limit: {currentResult.legal_limit}
              </span>
            </div>
          )}

          {/* Statute */}
          {currentResult.statute && (
            <div className="px-4 md:px-6 pb-4">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">📖 Law: {currentResult.statute}</p>
            </div>
          )}

          {/* What to Say */}
          {currentResult.what_to_say && (
            <div className="mx-6 mb-5 p-4 rounded-xl bg-teal-50 border border-teal-100">
              <p className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-2">💬 Say This</p>
              <p className="text-sm text-teal-900 leading-relaxed font-medium">
                &ldquo;{currentResult.what_to_say}&rdquo;
              </p>
            </div>
          )}

          {/* Source Badge */}
          <div className="px-4 md:px-6 pb-5">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                currentResult.source === "database"
                  ? "bg-green-100 text-green-700 border-green-200 border"
                  : currentResult.source === "hybrid"
                  ? "bg-purple-100 text-purple-700 border-purple-200 border"
                  : "bg-indigo-100 text-indigo-700 border-indigo-200 border"
              }`}
            >
              {currentResult.source === "database" ? (
                <><Database className="w-3.5 h-3.5" /> Verified Database</>
              ) : (
                <><Sparkles className="w-3.5 h-3.5" /> AI Analysis</>
              )}
            </span>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 1 && (
        <div className="space-y-3 mt-6">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">Previous Lookups</p>
          {history.slice(1).map((item, idx) => (
            <button
              key={idx}
              onClick={() => setExpandedHistoryIndex(expandedHistoryIndex === idx ? null : idx)}
              className="w-full text-left rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-card p-4 shadow-sm dark:shadow-slate-900/20 hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 transition-colors">{item.query}</p>
                  {expandedHistoryIndex !== idx && (
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate mt-1">
                      {item.legal_answer.substring(0, 80)}...
                    </p>
                  )}
                </div>
                {expandedHistoryIndex === idx ? (
                  <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0 ml-3" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0 ml-3" />
                )}
              </div>
              {expandedHistoryIndex === idx && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                  <p className="text-sm font-medium text-slate-700 leading-relaxed">{item.legal_answer}</p>
                  {item.legal_limit && (
                    <div className="inline-block mt-1">
                      <p className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-md">📏 {item.legal_limit}</p>
                    </div>
                  )}
                  {item.what_to_say && (
                    <div className="mt-2 p-3 bg-teal-50 border border-teal-100 rounded-lg">
                       <p className="text-xs font-bold text-teal-800 leading-relaxed">💬 &ldquo;{item.what_to_say}&rdquo;</p>
                    </div>
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
