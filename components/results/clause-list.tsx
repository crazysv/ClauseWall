"use client";

import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ClauseCard } from "@/components/results/clause-card";

export function ClauseList({ clauses, ...restProps }: { clauses: any[]; [key: string]: any }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("order");
  const [expandedClauseId, setExpandedClauseId] = useState<string | null>(null);

  // Filter and sort clauses based on logical states
  const filteredAndSorted = useMemo(() => {
    let result = [...clauses];

    // Filter by risk level
    if (activeFilter !== "all") {
      result = result.filter(
        (c) => c.risk_level?.toLowerCase() === activeFilter.toLowerCase() || c.riskLevel?.toLowerCase() === activeFilter.toLowerCase()
      );
    }

    // Filter by search query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.original_text?.toLowerCase().includes(q) ||
          c.text?.toLowerCase().includes(q) ||
          c.explanation?.toLowerCase().includes(q) ||
          c.clause_type?.toLowerCase().includes(q) ||
          c.type?.toLowerCase().includes(q)
      );
    }

    // Sort mechanics
    result.sort((a, b) => {
      if (sortBy === "risk-desc") {
        const scoreA = a.risk_score || a.riskScore || 0;
        const scoreB = b.risk_score || b.riskScore || 0;
        return scoreB - scoreA;
      }
      if (sortBy === "risk-asc") {
        const scoreA = a.risk_score || a.riskScore || 0;
        const scoreB = b.risk_score || b.riskScore || 0;
        return scoreA - scoreB;
      }
      // default "order" maintains document reading layout
      const orderA = a.clause_number || a.id || 0;
      const orderB = b.clause_number || b.id || 0;
      return orderA < orderB ? -1 : 1;
    });

    return result;
  }, [clauses, activeFilter, searchQuery, sortBy]);

  // Static token mapping to ensure Tailwind compiles properly
  const pillColors: Record<string, { active: string; inactive: string }> = {
    safe: {
      active: "bg-emerald-500 text-white border-emerald-500 shadow-sm hover:bg-emerald-600",
      inactive: "bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50",
    },
    warning: {
      active: "bg-amber-500 text-white border-amber-500 shadow-sm hover:bg-amber-600",
      inactive: "bg-white text-slate-500 border-slate-200 hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50",
    },
    dangerous: {
      active: "bg-rose-500 text-white border-rose-500 shadow-sm hover:bg-rose-600",
      inactive: "bg-white text-slate-500 border-slate-200 hover:border-rose-300 hover:text-rose-700 hover:bg-rose-50",
    },
    illegal: {
      active: "bg-purple-600 text-white border-purple-600 shadow-sm hover:bg-purple-700",
      inactive: "bg-white text-slate-500 border-slate-200 hover:border-purple-300 hover:text-purple-700 hover:bg-purple-50",
    },
  };

  const getPillStyle = (key: string) => {
    return activeFilter === key ? pillColors[key].active : pillColors[key].inactive;
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-2 px-1">
        <SlidersHorizontal className="w-6 h-6 text-indigo-600" />
        <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Contract Clauses</h3>
      </div>

      {/* ── Filter and Search Bar ── */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 flex flex-col xl:flex-row gap-4 xl:items-center justify-between shadow-sm dark:shadow-slate-900/20">
        
        {/* Risk Filter Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button onClick={() => setActiveFilter("all")}>
            <Badge
              variant="outline"
              className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-sm dark:shadow-slate-900/20 ${ activeFilter === "all" ? "bg-slate-800 text-white border-slate-800 hover:bg-slate-900" : "bg-white dark:bg-card text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:text-slate-200" }`}
            >
              All
            </Badge>
          </button>
          
          <button onClick={() => setActiveFilter("safe")}>
            <Badge variant="outline" className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${getPillStyle("safe")}`}>
              Safe
            </Badge>
          </button>
          
          <button onClick={() => setActiveFilter("warning")}>
            <Badge variant="outline" className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${getPillStyle("warning")}`}>
              Warning
            </Badge>
          </button>
          
          <button onClick={() => setActiveFilter("dangerous")}>
            <Badge variant="outline" className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${getPillStyle("dangerous")}`}>
              Dangerous
            </Badge>
          </button>
          
          <button onClick={() => setActiveFilter("illegal")}>
            <Badge variant="outline" className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${getPillStyle("illegal")}`}>
              Illegal
            </Badge>
          </button>
        </div>

        {/* Search & Sort Componentry */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          {/* Quick Find */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 font-bold" />
            <Input
              placeholder="Search clause text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full border-slate-200 dark:border-slate-700 bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 h-11 font-medium text-sm placeholder:text-slate-400 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-colors"
            />
          </div>

          {/* Sort Toggles */}
          <div className="w-full sm:w-[160px] shrink-0">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="rounded-full bg-white dark:bg-card border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 h-11 font-bold text-slate-600 dark:text-slate-400 text-xs px-4 focus:ring-indigo-500 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors pointer-events-auto">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-indigo-500" />
                  <SelectValue placeholder="Sort clauses" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-slate-700 shadow-xl bg-white dark:bg-card p-1">
                <SelectItem value="order" className="text-xs font-bold text-slate-600 dark:text-slate-400 rounded-lg focus:bg-slate-100 dark:bg-slate-800 cursor-pointer h-9 px-3">Document Order</SelectItem>
                <SelectItem value="risk-desc" className="text-xs font-bold text-rose-600 rounded-lg focus:bg-rose-50 cursor-pointer h-9 px-3">Highest Risk First</SelectItem>
                <SelectItem value="risk-asc" className="text-xs font-bold text-emerald-600 rounded-lg focus:bg-emerald-50 cursor-pointer h-9 px-3">Lowest Risk First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── Results Count Bar ── */}
      <div className="px-2 flex items-center justify-between border-b border-slate-100 pb-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Showing <span className="text-indigo-600 font-black">{filteredAndSorted.length}</span> of {clauses.length} parsed clauses
        </p>
      </div>

      {/* ── Clause Cards Assembly ── */}
      <div className="space-y-5 pt-3">
        {filteredAndSorted.length > 0 ? (
          filteredAndSorted.map((clause) => {
            // Defensively normalize the clause object bridging the generic prop layer to the target layer
            const normalizedClause = {
              id: clause.id || Math.random().toString(),
              document_id: clause.document_id || restProps.documentId || "",
              clause_number: clause.clause_number || clause.id || 0,
              original_text: clause.original_text || clause.text || "",
              clause_type: clause.clause_type || clause.type || "General",
              risk_level: clause.risk_level || clause.riskLevel || "warning",
              risk_score: clause.risk_score || clause.riskScore || 50,
              explanation: clause.explanation || "No explanation provided.",
              ...clause, // Pass through everything else untouched
            };

            return (
              <ClauseCard
                key={normalizedClause.id}
                clause={normalizedClause}
                isExpanded={expandedClauseId === normalizedClause.id}
                onToggle={() =>
                  setExpandedClauseId(
                    expandedClauseId === normalizedClause.id ? null : normalizedClause.id
                  )
                }
                jurisdiction={restProps.jurisdiction || "India"}
                documentType={restProps.documentType || "general"}
                documentId={normalizedClause.document_id}
                roastText={restProps.roasts?.[normalizedClause.id]}
                isRoastMode={restProps.isRoastMode}
                onAutopsy={restProps.onAutopsy ? () => restProps.onAutopsy(normalizedClause) : undefined}
                onRewrite={restProps.onRewrite ? () => restProps.onRewrite(normalizedClause) : undefined}
              />
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-card rounded-3xl border border-slate-100 shadow-sm dark:shadow-slate-900/20 text-center">
            <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-full mb-6 inline-flex border border-slate-100">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-lg font-black text-slate-800 dark:text-slate-200 mb-2">No Matching Clauses Found</p>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              We couldn't connect any records to your current filter map. Try clearing your search metrics or reverting risk filters.
            </p>
            <button
               onClick={() => {
                 setSearchQuery("");
                 setActiveFilter("all");
               }}
               className="mt-8 font-extrabold text-indigo-600 bg-indigo-50 px-4 md:px-6 py-2.5 rounded-full hover:bg-indigo-600 hover:text-white transition-colors shadow-sm dark:shadow-slate-900/20 text-sm"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
