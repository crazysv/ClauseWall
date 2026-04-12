"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { RiskAdjustedCost } from "@/lib/simulation/types";
import { formatINR } from "@/lib/simulation/formatters";

interface Props {
  riskAdjusted: RiskAdjustedCost;
  documentName: string;
  documentType: string;
  jurisdiction: string;
  totalIterations: number;
  contractMonths: number;
}

export default function RiskAdjustedHero({
  riskAdjusted,
  documentName,
  documentType,
  jurisdiction,
  totalIterations,
  contractMonths,
}: Props) {
  const premiumPercent = Math.round(riskAdjusted.premiumPercent);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative p-6 sm:p-10 border border-neutral-900 bg-[#050505] rounded-sm"
    >
      <div className="relative">
        {/* Header */}
        <div className="mb-8 border-b border-neutral-900 pb-4">
          <h2 className="text-lg sm:text-xl font-mono uppercase tracking-widest text-white mb-2 flex items-center gap-3">
            <span className="bg-[#0a0a0a] text-cyan-500 border border-neutral-800 p-1.5 text-sm inline-block rounded-sm">
              📊
            </span>{" "}
            [FINANCIAL RISK ANALYSIS]
          </h2>
          <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
            {documentName} // {documentType} // {jurisdiction}
          </p>
        </div>

        {/* Cost comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] gap-4 sm:gap-8 items-center">
          {/* Advertised cost */}
          <div className="p-6 border border-neutral-800 bg-[#0a0a0a] rounded-sm">
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-4">
              [ADVERTISED COST]
            </p>
            <motion.p
              className="text-4xl sm:text-5xl font-mono text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {formatINR(riskAdjusted.baseMonthlyCost)}
            </motion.p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-600 mt-2">
              / MONTH
            </p>
            <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 mt-3 bg-neutral-900 border border-neutral-800 inline-block px-2 py-1 rounded-sm">
              [WHAT THEY TELL YOU]
            </p>
          </div>

          {/* Arrow */}
          <div className="hidden sm:flex items-center justify-center">
            <motion.div
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="p-3 bg-neutral-900 border border-neutral-800 rounded-sm"
            >
              <ArrowRight className="w-5 h-5 text-neutral-400" />
            </motion.div>
          </div>

          {/* Real cost */}
          <div className="p-6 border border-red-900/50 bg-red-950/20 text-white rounded-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px] rounded-full pointer-events-none" />
            <p className="text-[10px] font-mono uppercase tracking-widest mb-4 text-red-500 relative z-10">
              [REAL COST // RISK-ADJUSTED]
            </p>
            <motion.p
              className="text-4xl sm:text-6xl font-mono text-red-400 relative z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {formatINR(riskAdjusted.adjustedMonthlyCost)}
            </motion.p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-red-500/80 mt-2 relative z-10">
              / MONTH
            </p>
            <motion.p
              className="text-[9px] font-mono uppercase tracking-widest text-red-400 bg-red-900/20 inline-block px-3 py-1 border border-red-900/50 mt-4 rounded-sm relative z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              +{premiumPercent}% HIDDEN RISK PREMIUM
            </motion.p>
          </div>
        </div>

        {/* Footer */}
        <motion.p
          className="text-[9px] font-mono uppercase tracking-widest text-neutral-600 mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          [BASED ON {totalIterations.toLocaleString()} SIMULATED SCENARIOS OVER{" "}
          {contractMonths} MONTHS]
        </motion.p>
      </div>
    </motion.div>
  );
}
