"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LegalAuthority } from "@/types/authority";
import AuthorityCard from "./authority-card";

interface Props {
  onSelect?: (authority: LegalAuthority) => void;
}

export default function AuthoritySearchBar({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LegalAuthority[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/authority/search?q=${encodeURIComponent(query)}&limit=10`,
      );
      const data = await res.json();
      if (data.success) setResults(data.authorities);
    } catch {
      console.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground stroke-[3px]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search authorities by name, city, or type..."
            className="w-full pl-12 pr-4 py-3 border-4 border-black bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all placeholder:font-medium"
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={loading}
          size="default"
          className="btn-impact btn-impact-primary h-auto py-3 px-8"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <Search className="h-5 w-5 mr-2 stroke-[3px]" />
          )}
          SEARCH
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
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
