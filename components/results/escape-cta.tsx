"use client";

import Link from "next/link";
import { DoorOpen, ArrowRight, IndianRupee } from "lucide-react";

interface EscapeCTAProps {
  documentId: string;
  dangerousCount: number;
  illegalCount: number;
}

export default function EscapeCTA({
  documentId,
  dangerousCount,
  illegalCount,
}: EscapeCTAProps) {
  const totalRisky = dangerousCount + illegalCount;

  // Only show if there are dangerous/illegal clauses
  if (totalRisky === 0) return null;

  return (
    <Link href={`/escape/${documentId}`}>
      <div className="p-4 card-impact border-2 border-orange-600 bg-background hover:-translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(234,88,12,1)] transition-all cursor-pointer group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 border-2 border-orange-600 bg-muted transition-colors">
              <DoorOpen className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="font-black uppercase tracking-wider text-orange-600 flex items-center gap-2">
                Already Signed This Contract?
              </p>
              <p className="text-sm font-bold text-muted-foreground mt-0.5">
                {totalRisky} clause{totalRisky !== 1 ? "s" : ""} may be void
                under Indian law. Get your personalized escape plan with
                recovery amounts.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <span className="text-sm font-black uppercase tracking-wider text-orange-600 hidden sm:inline">
              Get Escape Plan
            </span>
            <ArrowRight className="h-5 w-5 text-orange-600 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}
