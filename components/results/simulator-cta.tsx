"use client";

import Link from "next/link";
import { Gamepad2, ArrowRight } from "lucide-react";

interface SimulatorCTAProps {
  documentId: string;
  overallRiskScore: number;
}

export default function SimulatorCTA({ documentId, overallRiskScore }: SimulatorCTAProps) {
  if (overallRiskScore < 30) return null;

  return (
    <Link href={`/simulate/${documentId}`}>
      <div className="p-4 card-impact border-2 border-blue-600 bg-background hover:-translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(37,99,235,1)] transition-all cursor-pointer group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 border-2 border-blue-600 bg-muted transition-colors">
              <Gamepad2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="font-black uppercase tracking-wider text-blue-600">
                See What This Contract Really Costs You
              </p>
              <p className="text-sm font-bold text-muted-foreground mt-0.5">
                Interactive month-by-month cost simulator with penalty calculator and fair contract comparison.
              </p>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mt-0.5">Project the financial impact over time</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <span className="text-sm font-black uppercase tracking-wider text-blue-600 hidden sm:inline">Simulate</span>
            <ArrowRight className="h-5 w-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}