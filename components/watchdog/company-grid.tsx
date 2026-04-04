"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import CompanyCard from "./company-card";
import SectorFilter from "./sector-filter";
import type { MonitoredCompany } from "@/types";

export default function CompanyGrid({
  companies,
  watchedIds = [],
}: {
  companies: MonitoredCompany[];
  watchedIds?: string[];
}) {
  const [sector, setSector] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = companies.filter((c) => {
    if (sector !== "all" && c.sector !== sector) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div>
      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background border-2 border-foreground bg-popover/50 border-foreground border-2"
          />
        </div>
        <SectorFilter selected={sector} onChange={setSector} />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No companies match your filters.</p>
          <button
            onClick={() => {
              setSector("all");
              setSearch("");
            }}
            className="text-blue-400 text-sm mt-2 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              isWatching={watchedIds.includes(company.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
