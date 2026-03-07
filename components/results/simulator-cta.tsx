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
      <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-cyan-500/10 border border-cyan-500/20 hover:border-cyan-500/40 hover:from-cyan-500/15 hover:to-cyan-500/15 transition-all cursor-pointer group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/15 group-hover:bg-cyan-500/25 transition-colors">
              <Gamepad2 className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <p className="font-semibold text-cyan-300">
                See What This Contract Really Costs You
              </p>
              <p className="text-sm text-gray-400 mt-0.5">
                Interactive month-by-month cost simulator with penalty calculator and fair contract comparison.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <span className="text-sm font-medium text-cyan-400 hidden sm:inline">Simulate</span>
            <ArrowRight className="h-5 w-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}