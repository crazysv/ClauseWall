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
      className="relative card-impact-emphasis bg-[#ffff00] p-6 sm:p-10 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
    >
      <div className="relative">
        {/* Header */}
        <div className="mb-8 border-b-4 border-black pb-4">
          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-black mb-2 flex items-center gap-3">
            <span className="bg-black text-white p-2 text-xl inline-block">📊</span> Financial Risk Analysis
          </h2>
          <p className="text-sm font-bold uppercase tracking-widest text-black/70">
            {documentName} • {documentType} • {jurisdiction}
          </p>
        </div>

        {/* Cost comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] gap-4 sm:gap-8 items-center">
          {/* Advertised cost */}
          <div className="p-6 border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-sm font-black text-black uppercase tracking-widest mb-4">
              Advertised Cost
            </p>
            <motion.p
              className="text-4xl sm:text-5xl font-black text-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {formatINR(riskAdjusted.baseMonthlyCost)}
            </motion.p>
            <p className="text-sm font-bold uppercase tracking-widest text-black/50 mt-2">/month</p>
            <p className="text-xs font-bold uppercase tracking-widest text-black/40 mt-3 bg-gray-200 inline-block px-2 py-1">
              (What they tell you)
            </p>
          </div>

          {/* Arrow */}
          <div className="hidden sm:flex items-center justify-center">
            <motion.div
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-black p-3 rounded-full"
            >
              <ArrowRight className="w-8 h-8 text-white" />
            </motion.div>
          </div>

          {/* Real cost */}
          <div className="p-6 border-4 border-black bg-red-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-white">
            <p className="text-sm font-black uppercase tracking-widest mb-4 text-white">
              Real Cost (Risk-Adjusted)
            </p>
            <motion.p
              className="text-4xl sm:text-6xl font-black text-white tracking-tighter"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              style={{ WebkitTextStroke: "2px black" }}
            >
              {formatINR(riskAdjusted.adjustedMonthlyCost)}
            </motion.p>
            <p className="text-sm font-bold uppercase tracking-widest text-white/80 mt-2">/month</p>
            <motion.p
              className="text-sm font-black uppercase tracking-widest text-black bg-white inline-block px-3 py-1 border-2 border-black mt-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              +{premiumPercent}% hidden risk premium
            </motion.p>
          </div>
        </div>

        {/* Footer */}
        <motion.p
          className="text-xs font-bold uppercase tracking-widest text-black/50 mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Based on {totalIterations.toLocaleString()} simulated scenarios over{" "}
          {contractMonths} months
        </motion.p>
      </div>
    </motion.div>
  );
}
