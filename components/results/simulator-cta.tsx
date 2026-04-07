"use client";

import Link from "next/link";
import { Gamepad2, ChevronRight } from "lucide-react";

interface SimulatorCTAProps {
  documentId: string;
  overallRiskScore: number;
}

export default function SimulatorCTA({
  documentId,
  overallRiskScore,
}: SimulatorCTAProps) {
  if (overallRiskScore < 30) return null;

  return (
    <Link href={`/simulate/${documentId}`}>
      <div className="card-results p-3 hover:bg-[#1f1f1f] transition-colors cursor-pointer group">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-[#dc2626] rounded-lg">
            <Gamepad2 className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[10px] font-bold uppercase text-red-100">
              Cost Simulator
            </h4>
            <p className="text-[9px] text-[#a3a3a3] mt-0.5">
              Project the financial impact over time
            </p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#a3a3a3] group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
        </div>
      </div>
    </Link>
  );
}
