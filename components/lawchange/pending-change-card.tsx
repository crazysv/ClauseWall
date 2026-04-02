"use client";

import { Calendar, AlertCircle, Clock, Bookmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PendingLawChange } from "@/types";

interface Props {
  pending: PendingLawChange;
}

const PROBABILITY_CONFIG: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  likely: {
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-200",
    label: "Likely",
  },
  possible: {
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    label: "Possible",
  },
  unlikely: {
    color: "text-slate-500",
    bg: "bg-slate-50 border-slate-200",
    label: "Unlikely",
  },
};

export function PendingChangeCard({ pending }: Props) {
  const config = PROBABILITY_CONFIG[pending.probability] || PROBABILITY_CONFIG.possible;

  const dateStr = pending.expected_date
    ? new Date(pending.expected_date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <Card className={`overflow-hidden border ${config.bg} shadow-sm dark:shadow-slate-900/20 rounded-xl mb-4`}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-white dark:bg-card rounded-lg shadow-sm dark:shadow-slate-900/20 shrink-0 border border-current/10">
            <Clock className={`h-5 w-5 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-start justify-between gap-4 mb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 leading-tight">
                {pending.title}
              </h3>
              <Badge className={`text-[10px] font-bold uppercase tracking-widest flex-shrink-0 ${config.color} bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 border border-current/20 px-2 py-0.5 rounded-md`}>
                {config.label}
              </Badge>
            </div>

            {pending.description && (
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                {pending.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 mb-4">
              {dateStr && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Expected: <span className="text-slate-500 dark:text-slate-400">{dateStr}</span>
                </span>
              )}
              {pending.source && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Bookmark className="h-3.5 w-3.5" />
                  Source: <span className="text-slate-500 dark:text-slate-400">{pending.source.replace(/_/g, " ")}</span>
                </span>
              )}
            </div>

            {/* Affected clause types */}
            {pending.affected_clause_types?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center mr-1">
                  Affects:
                </span>
                {pending.affected_clause_types.map((ct) => (
                  <span
                    key={ct}
                    className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-white dark:bg-card border border-current/20 shadow-sm dark:shadow-slate-900/20 text-slate-500 dark:text-slate-400"
                  >
                    {ct.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            )}

            {/* Preparation advice */}
            {pending.what_to_prepare && (
              <div className="p-3.5 rounded-xl bg-white dark:bg-card border border-current/20 shadow-sm dark:shadow-slate-900/20 text-current">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-70 flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3" /> How to Prepare
                </p>
                <p className="text-sm font-medium text-slate-700 leading-relaxed">{pending.what_to_prepare}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
