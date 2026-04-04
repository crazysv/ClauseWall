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
      <p className="text-sm font-bold uppercase tracking-widest text-black/50 text-center py-6 border-2 border-black mt-4">
        No significant predatory premium detected across clauses.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-black uppercase tracking-widest text-black bg-black text-white px-2 py-1 inline-block">
        Top predatory clauses by cost impact
      </p>
      <div className="space-y-3">
        {comparison.clauseBreakdown.slice(0, 5).map((clause, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <span className="text-xl font-black text-black w-6 text-center">
                {i + 1}.
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black uppercase tracking-widest text-black truncate">
                  {clause.clauseType.replace(/_/g, " ")}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs font-black bg-black text-white px-2 py-0.5">
                    #{clause.clauseNumber}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-black/50 bg-gray-200 px-2 py-0.5">
                    {clause.riskLevel}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <span className="text-sm font-black text-orange-600 bg-orange-100 px-3 py-1 border-2 border-orange-600">
                +{formatINRCompact(clause.predatoryPremium)} excess
              </span>
              <Link
                href={`/negotiate/${documentId}`}
                className="text-xs font-black uppercase tracking-widest text-blue-600 border-b-2 border-blue-600 hover:text-white hover:bg-blue-600 transition-colors whitespace-nowrap p-1"
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
