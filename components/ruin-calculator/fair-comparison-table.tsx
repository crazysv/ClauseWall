"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { FairComparisonResult } from "@/lib/simulation/types";
import { formatINRCompact } from "@/lib/simulation/formatters";

interface Props {
  comparison: FairComparisonResult;
  documentId: string;
}

export default function FairComparisonTable({ comparison, documentId }: Props) {
  if (comparison.clauseBreakdown.length === 0) {
    return (
      <p className="text-sm text-white/30 text-center py-4">
        No significant predatory premium detected across clauses.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-white/40 font-medium uppercase tracking-wider">
        Top predatory clauses by cost impact
      </p>
      <div className="space-y-2">
        {comparison.clauseBreakdown.slice(0, 5).map((clause, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-sm font-bold text-white/30 w-6 text-center">
                {i + 1}.
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/80 truncate">
                  {clause.clauseType.replace(/_/g, " ")}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge
                    variant="outline"
                    className="text-[10px] border-white/10 text-white/30"
                  >
                    #{clause.clauseNumber}
                  </Badge>
                  <span className="text-[10px] text-white/20">
                    {clause.riskLevel}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-sm font-bold text-orange-400">
                +{formatINRCompact(clause.predatoryPremium)} excess
              </span>
              <Link
                href={`/negotiate/${documentId}`}
                className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap"
              >
                Negotiate →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
