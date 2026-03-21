"use client";

import Link from "next/link";
import { DoorOpen, ArrowRight, IndianRupee } from "lucide-react";

interface EscapeCTAProps {
  documentId: string;
  dangerousCount: number;
  illegalCount: number;
}

export default function EscapeCTA({ documentId, dangerousCount, illegalCount }: EscapeCTAProps) {
  const totalRisky = dangerousCount + illegalCount;

  // Only show if there are dangerous/illegal clauses
  if (totalRisky === 0) return null;

  return (
    <Link href={`/escape/${documentId}`}>
      <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10 border border-orange-500/20 hover:border-orange-500/40 hover:from-orange-500/15 hover:to-orange-500/15 transition-all cursor-pointer group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/15 group-hover:bg-orange-500/25 transition-colors">
              <DoorOpen className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <p className="font-semibold text-orange-300 flex items-center gap-2">
                Already Signed This Contract?
              </p>
              <p className="text-sm text-gray-400 mt-0.5">
                {totalRisky} clause{totalRisky !== 1 ? "s" : ""} may be void under Indian law.
                Get your personalized escape plan with recovery amounts.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <span className="text-sm font-medium text-orange-400 hidden sm:inline">
              Get Escape Plan
            </span>
            <ArrowRight className="h-5 w-5 text-orange-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}