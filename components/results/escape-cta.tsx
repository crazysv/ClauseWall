"use client";

import Link from "next/link";
import { DoorOpen, ChevronRight } from "lucide-react";

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
      <div className="card-results p-3 hover:bg-[#1f1f1f] transition-colors cursor-pointer group">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-orange-600 rounded-lg">
            <DoorOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[10px] font-bold uppercase text-orange-100">
              Escape Plan
            </h4>
            <p className="text-[9px] text-[#a3a3a3] mt-0.5">
              {totalRisky} clause{totalRisky !== 1 ? "s" : ""} may be void
            </p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#a3a3a3] group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
        </div>
      </div>
    </Link>
  );
}
