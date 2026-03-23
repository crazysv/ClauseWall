"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Send, Loader2, X, ChevronUp } from "lucide-react";
import type { QuickLookupResult } from "@/types";

interface FloatingLookupBarProps {
  jurisdiction: string;
  documentType: string;
  onResult: (result: QuickLookupResult) => void;
}

export default function FloatingLookupBar({ jurisdiction, documentType, onResult }: FloatingLookupBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuickLookupResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!query.trim() || loading) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/negotiate/live/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), jurisdiction, document_type: documentType }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) throw new Error("Lookup failed");

      const data: QuickLookupResult = await response.json();
      setResult(data);
      onResult(data);
    } catch {
      console.error("Floating lookup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
    setResult(null);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-blue-600/90 hover:bg-blue-600 shadow-lg shadow-blue-500/20 text-white flex items-center justify-center transition-all active:scale-95"
        style={{ minWidth: "56px", minHeight: "56px" }}
      >
        <Search className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur-xl border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
      {/* Result */}
      {result && (
        <div className="px-4 pt-3 pb-2">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 max-h-40 overflow-y-auto">
            <p className="text-sm text-white/80 mb-1">{result.legal_answer}</p>
            {result.legal_limit && (
              <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded mr-1">
                📏 {result.legal_limit}
              </span>
            )}
            {result.what_to_say && (
              <p className="text-xs text-emerald-400/70 mt-1.5">
                💬 &ldquo;{result.what_to_say}&rdquo;
              </p>
            )}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="px-4 py-3 flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Quick legal question..."
          className="flex-1 px-4 py-3 text-sm bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/30"
          style={{ fontSize: "16px" }}
          disabled={loading}
        />
        <button
          onClick={handleSubmit}
          disabled={!query.trim() || loading}
          className="p-3 rounded-xl bg-blue-600 text-white disabled:opacity-30 transition-all"
          style={{ minWidth: "48px", minHeight: "48px" }}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
        <button
          onClick={handleClose}
          className="p-3 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
          style={{ minWidth: "48px", minHeight: "48px" }}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
