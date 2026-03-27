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
      const res = await fetch(`/api/authority/search?q=${encodeURIComponent(query)}&limit=10`);
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
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search authorities by name, city, or type..."
            className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-white/10 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading} size="default" className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search
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
