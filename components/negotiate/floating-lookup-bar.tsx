"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Send, Loader2, X, ChevronUp } from "lucide-react";
import type { QuickLookupResult } from "@/types";

interface FloatingLookupBarProps {
  jurisdiction: string;
  documentType: string;
  onResult: (result: QuickLookupResult) => void;
}

export function FloatingLookupBar({ jurisdiction, documentType, onResult }: FloatingLookupBarProps) {
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
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/30 text-white flex items-center justify-center transition-transform active:scale-95"
      >
        <Search className="w-7 h-7" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-card/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-700 shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
      {/* Result */}
      {result && (
        <div className="px-5 pt-4 pb-2">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 max-h-48 overflow-y-auto shadow-inner">
             <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Quick Answer</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3 leading-relaxed">{result.legal_answer}</p>
            {result.legal_limit && (
              <span className="inline-block text-[10px] font-bold text-indigo-700 bg-indigo-100 border border-indigo-200 px-2 py-1 rounded-md mr-2 mb-2">
                📏 {result.legal_limit}
              </span>
            )}
            {result.what_to_say && (
               <div className="mt-2 p-3 bg-teal-50 border border-teal-100 rounded-lg">
                 <p className="text-xs font-bold text-teal-800">
                   💬 &ldquo;{result.what_to_say}&rdquo;
                 </p>
               </div>
            )}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="px-5 py-4 flex items-center gap-3">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Quick legal question..."
          className="flex-1 px-5 py-3.5 text-sm font-medium bg-white dark:bg-card border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
          style={{ fontSize: "16px" }}
          disabled={loading}
        />
        <button
          onClick={handleSubmit}
          disabled={!query.trim() || loading}
          className="p-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold disabled:opacity-50 transition-all shadow-sm dark:shadow-slate-900/20 flex items-center justify-center"
          style={{ minWidth: "52px", minHeight: "52px" }}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
        <button
          onClick={handleClose}
          className="p-3.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors flex items-center justify-center"
          style={{ minWidth: "52px", minHeight: "52px" }}
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
