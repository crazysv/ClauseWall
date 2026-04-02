"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LegalAuthority } from "@/types/authority";
import { AuthorityCard } from "./authority-card";

interface Props {
  onSelect?: (authority: LegalAuthority) => void;
}

export function AuthoritySearchBar({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LegalAuthority[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/authority/search?q=${encodeURIComponent(query)}&limit=10`);
      const data = await res.json();
      if (data.success) setResults(data.authorities);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search authorities by name, city, or type..."
            className="w-full pl-10 pr-4 py-3 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm md:text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium focus:outline-none shadow-sm"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading} size="lg" className="h-12 px-6 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm transition-transform hover:-translate-y-0.5">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          <span className="hidden sm:inline">Search</span>
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-3 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">Search Results</h3>
          {results.map((authority) => (
            <AuthorityCard
              key={authority.id}
              authority={authority}
              compact
              onClick={onSelect ? () => onSelect(authority) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
