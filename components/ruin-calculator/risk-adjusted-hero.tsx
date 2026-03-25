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
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900/80 via-gray-900/60 to-gray-900/80 backdrop-blur-xl p-6 sm:p-8"
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-1">
            📊 Financial Risk Analysis
          </h2>
          <p className="text-sm text-white/40">
            {documentName} • {documentType} • {jurisdiction}
          </p>
        </div>

        {/* Cost comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] gap-4 sm:gap-6 items-center">
          {/* Advertised cost */}
          <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2 font-medium">
              Advertised Cost
            </p>
            <motion.p
              className="text-3xl sm:text-4xl font-bold text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {formatINR(riskAdjusted.baseMonthlyCost)}
            </motion.p>
            <p className="text-sm text-white/30 mt-1">/month</p>
            <p className="text-xs text-white/20 mt-2">
              (what they tell you)
            </p>
          </div>

          {/* Arrow */}
          <div className="hidden sm:flex items-center justify-center">
            <motion.div
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <ArrowRight className="w-8 h-8 text-red-400" />
            </motion.div>
          </div>

          {/* Real cost */}
          <div className="p-5 rounded-xl bg-red-500/5 border border-red-500/20">
            <p className="text-xs text-red-400/70 uppercase tracking-wider mb-2 font-medium">
              Real Cost (Risk-Adjusted)
            </p>
            <motion.p
              className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {formatINR(riskAdjusted.adjustedMonthlyCost)}
            </motion.p>
            <p className="text-sm text-red-400/60 mt-1">/month</p>
            <motion.p
              className="text-sm text-red-400 font-semibold mt-2"
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
          className="text-xs text-white/25 mt-6 text-center"
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
