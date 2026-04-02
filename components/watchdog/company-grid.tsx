"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CompanyCard } from "./company-card";
import { SectorFilter } from "./sector-filter";
import type { MonitoredCompany } from "@/types";

export function CompanyGrid({
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
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="space-y-4 mb-8">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            aria-label="Search companies"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 bg-white dark:bg-card border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 focus-visible:ring-indigo-500 h-12 text-base rounded-xl font-medium"
          />
        </div>
        <SectorFilter selected={sector} onChange={setSector} />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 md:py-6 md:py-8 lg:py-12 lg:py-16 bg-slate-50 dark:bg-slate-800 border border-slate-100 rounded-2xl shadow-inner text-slate-500 dark:text-slate-400">
          <p className="font-medium">No companies match your filters.</p>
          <button onClick={() => { setSector("all"); setSearch(""); }} className="text-indigo-600 font-bold mt-2 hover:underline transition-all">
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
