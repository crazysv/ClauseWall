"use client";

import Link from "next/link";
import type { FairComparisonResult } from "@/lib/simulation/types";
import { formatINRCompact } from "@/lib/simulation/formatters";

interface Props {
  comparison: FairComparisonResult;
  documentId: string;
}

export default function FairComparisonTable({ comparison, documentId }: Props) {
  if (comparison.clauseBreakdown.length === 0) {
    return (
      <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 text-center py-6 border border-neutral-900 mt-4 rounded-sm">
        [NO SIGNIFICANT PREDATORY PREMIUM DETECTED]
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 bg-neutral-900 px-2 py-1 inline-block rounded-sm">
        [TOP PREDATORY CLAUSES BY COST IMPACT]
      </p>
      <div className="space-y-3">
        {comparison.clauseBreakdown.slice(0, 5).map((clause, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 bg-[#050505] border border-neutral-900 transition-colors hover:border-neutral-700 rounded-sm"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <span className="text-sm font-mono text-neutral-600 w-6 text-center">
                {i + 1}.
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-300 truncate">
                  {clause.clauseType.replace(/_/g, " ")}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[9px] font-mono bg-neutral-900 text-neutral-400 px-2 py-0.5 rounded-sm">
                    #{clause.clauseNumber}
                  </span>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 border border-neutral-800 px-2 py-0.5 rounded-sm">
                    {clause.riskLevel}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <span className="text-[10px] font-mono text-orange-500 bg-orange-950/20 px-3 py-1 border border-orange-900/50 rounded-sm">
                +{formatINRCompact(clause.predatoryPremium)} EXCESS
              </span>
              <Link
                href={`/negotiate/${documentId}`}
                className="text-[10px] font-mono uppercase tracking-widest text-cyan-500 hover:bg-cyan-950/20 border border-transparent hover:border-cyan-900/50 transition-colors whitespace-nowrap p-1.5 rounded-sm"
              >
                [NEGOTIATE]
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
