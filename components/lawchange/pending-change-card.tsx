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
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
    label: "Likely",
  },
  possible: {
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
    label: "Possible",
  },
  unlikely: {
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    label: "Unlikely",
  },
};

export default function PendingChangeCard({ pending }: Props) {
  const config = PROBABILITY_CONFIG[pending.probability] || PROBABILITY_CONFIG.possible;

  const dateStr = pending.expected_date
    ? new Date(pending.expected_date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <Card className={`overflow-hidden border ${config.bg}`}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Clock className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.color}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-sm font-medium text-white/90">
                {pending.title}
              </h3>
              <Badge className={`text-[10px] flex-shrink-0 ${config.color} bg-transparent border border-current/20`}>
                {config.label}
              </Badge>
            </div>

            {pending.description && (
              <p className="text-xs text-white/40 leading-relaxed mb-3">
                {pending.description}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mb-3">
              {dateStr && (
                <span className="text-[10px] text-white/25 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Expected: {dateStr}
                </span>
              )}
              {pending.source && (
                <span className="text-[10px] text-white/20">
                  Source: {pending.source}
                </span>
              )}
            </div>

            {/* Affected clause types */}
            {pending.affected_clause_types?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {pending.affected_clause_types.map((ct) => (
                  <span
                    key={ct}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/25"
                  >
                    {ct.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            )}

            {/* Preparation advice */}
            {pending.what_to_prepare && (
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">
                  📋 How to Prepare
                </p>
                <p className="text-xs text-white/40">{pending.what_to_prepare}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
