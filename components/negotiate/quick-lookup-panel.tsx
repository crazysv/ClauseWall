"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Mic,
  MicOff,
  Loader2,
  Database,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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

export default function QuickLookupPanel({
  jurisdiction,
  documentType,
  onResult,
}: QuickLookupPanelProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<QuickLookupResult | null>(
    null,
  );
  const [history, setHistory] = useState<QuickLookupResult[]>([]);
  const [expandedHistoryIndex, setExpandedHistoryIndex] = useState<
    number | null
  >(null);
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
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window))
      return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
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
          className="w-full px-4 py-4 pr-32 text-base font-bold text-black bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] placeholder:text-muted-foreground placeholder:uppercase placeholder:font-black placeholder:tracking-widest focus:outline-none focus:bg-blue-50 focus:translate-x-1 focus:translate-y-1 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          style={{ fontSize: "16px" }} // Prevents iOS zoom
          disabled={loading}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 pr-1">
          <button
            onClick={handleVoiceInput}
            className={`p-2 transition-all border-2 ${isListening ? "bg-red-100 text-red-600 border-red-600 shadow-[2px_2px_0px_0px_rgba(220,38,38,1)] animate-pulse" : "text-muted-foreground hover:text-black border-transparent hover:bg-gray-100"}`}
            disabled={loading}
          >
            {isListening ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!query.trim() || loading}
            className="p-2.5 bg-blue-500 hover:bg-blue-600 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all active:translate-y-1 active:shadow-none"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 text-foreground animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Loading shimmer */}
      {loading && (
        <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 space-y-4 animate-pulse">
          <div className="h-4 bg-gray-200 w-3/4" />
          <div className="h-4 bg-gray-200 w-1/2" />
          <div className="h-8 bg-gray-200 w-full" />
          <div className="h-3 bg-gray-200 w-2/3" />
        </div>
      )}

      {/* Current Result */}
      {currentResult && !loading && (
        <div className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden animate-in fade-in slide-in- duration-300">
          {/* Answer */}
          <div className="p-5 lg:p-6 pb-2">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">
              Answer
            </p>
            <p className="text-lg font-bold text-black leading-relaxed">
              {currentResult.legal_answer}
            </p>
          </div>

          {/* Legal Limit Badge */}
          {currentResult.legal_limit && (
            <div className="px-5 lg:px-6 pb-4 pt-2">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 border-2 border-blue-900 text-xs font-black uppercase tracking-wider text-blue-900 shadow-[2px_2px_0px_0px_rgba(30,58,138,1)]">
                📏 Legal Limit: {currentResult.legal_limit}
              </span>
            </div>
          )}

          {/* Statute */}
          {currentResult.statute && (
            <div className="px-5 lg:px-6 pb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                📖 Law: {currentResult.statute}
              </p>
            </div>
          )}

          {/* What to Say */}
          {currentResult.what_to_say && (
            <div className="mx-5 lg:mx-6 mb-5 p-5 bg-green-100 border-2 border-green-900 shadow-[2px_2px_0px_0px_rgba(20,83,45,1)] border-dashed">
              <p className="text-xs font-black uppercase tracking-wider text-green-900 mb-2">
                💬 Say This:
              </p>
              <p className="text-base font-bold text-green-950 leading-relaxed">
                &ldquo;{currentResult.what_to_say}&rdquo;
              </p>
            </div>
          )}

          {/* Source Badge */}
          <div className="px-5 lg:px-6 pb-5 pt-2 border-t-2 border-black bg-gray-50 flex items-center pt-4">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase font-black tracking-wider border-2 ${currentResult.source === "database" ? "bg-green-100 text-green-900 border-green-900 shadow-[2px_2px_0px_0px_rgba(20,83,45,1)]" : currentResult.source === "hybrid" ? "bg-purple-100 text-purple-900 border-purple-900 shadow-[2px_2px_0px_0px_rgba(88,28,135,1)]" : "bg-blue-100 text-blue-900 border-blue-900 shadow-[2px_2px_0px_0px_rgba(30,58,138,1)]"}`}
            >
              {currentResult.source === "database" ? (
                <>
                  <Database className="w-3 h-3" /> Verified from law database
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" /> AI analysis
                </>
              )}
            </span>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 1 && (
        <div className="space-y-4">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1 mt-8 mb-4">
            Previous Lookups
          </p>
          {history.slice(1).map((item, idx) => (
            <button
              key={idx}
              onClick={() =>
                setExpandedHistoryIndex(
                  expandedHistoryIndex === idx ? null : idx,
                )
              }
              className="w-full text-left border-2 border-black bg-white p-4 hover:bg-gray-50 transition-all hover:translate-x-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-sm font-bold text-black truncate">
                    {item.query}
                  </p>
                  {expandedHistoryIndex !== idx && (
                    <p className="text-xs font-medium text-muted-foreground truncate mt-1">
                      {item.legal_answer.substring(0, 80)}...
                    </p>
                  )}
                </div>
                {expandedHistoryIndex === idx ? (
                  <ChevronUp className="w-5 h-5 text-black flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-black flex-shrink-0" />
                )}
              </div>
              {expandedHistoryIndex === idx && (
                <div className="mt-4 pt-4 border-t-2 border-black space-y-3">
                  <p className="text-sm font-semibold text-black leading-relaxed">
                    {item.legal_answer}
                  </p>
                  {item.legal_limit && (
                    <p className="text-xs font-black uppercase tracking-wider text-blue-800">
                      📏 {item.legal_limit}
                    </p>
                  )}
                  {item.what_to_say && (
                    <p className="text-xs font-bold uppercase tracking-wider text-green-800">
                      💬 &ldquo;{item.what_to_say}&rdquo;
                    </p>
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
