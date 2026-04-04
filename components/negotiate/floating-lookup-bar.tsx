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
        className="fixed bottom-4 right-4 z-50 w-14 h-14 bg-blue-500 hover:bg-blue-600 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-white flex items-center justify-center transition-all active:translate-y-1 active:shadow-none"
        style={{ minWidth: "56px", minHeight: "56px" }}
      >
        <Search className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t-2 border-black shadow-[0_-4px_0px_0px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-4 duration-200">
      {/* Result */}
      {result && (
        <div className="px-4 pt-4 pb-2">
          <div className="border-2 border-black bg-blue-50 p-4 max-h-40 overflow-y-auto">
            <p className="text-sm font-bold text-black mb-3 leading-relaxed">{result.legal_answer}</p>
            <div className="flex flex-wrap gap-2 items-center">
              {result.legal_limit && (
                <span className="text-[10px] font-black uppercase tracking-wider text-black bg-white border-2 border-black px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  📏 {result.legal_limit}
                </span>
              )}
            </div>
            {result.what_to_say && (
              <div className="mt-3 p-3 bg-green-100 border-2 border-green-900 border-dashed">
                <p className="text-xs font-bold text-green-950 uppercase tracking-tight">
                  💬 &ldquo;{result.what_to_say}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="px-4 py-4 flex items-center gap-3">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="QUICK LEGAL QUESTION..."
          className="flex-1 px-4 py-3 text-sm font-bold text-black bg-white border-2 border-black shadow-[inner_2px_2px_0px_0px_rgba(0,0,0,0.1)] placeholder:text-muted-foreground placeholder:uppercase placeholder:font-black placeholder:tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ fontSize: "16px" }}
          disabled={loading}
        />
        <button
          onClick={handleSubmit}
          disabled={!query.trim() || loading}
          className="p-3 bg-blue-500 hover:bg-blue-600 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-white disabled:opacity-50 transition-all active:translate-y-1 active:shadow-none"
          style={{ minWidth: "48px", minHeight: "48px" }}
        >
          {loading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Send className="w-5 h-5 text-white" />}
        </button>
        <button
          onClick={handleClose}
          className="p-3 bg-gray-200 hover:bg-red-400 hover:text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black transition-all active:translate-y-1 active:shadow-none"
          style={{ minWidth: "48px", minHeight: "48px" }}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
