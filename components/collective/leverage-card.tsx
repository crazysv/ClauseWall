"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Zap, Clock, Scale } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { LeverageCalculation } from "@/types";

interface Props {
  leverage: LeverageCalculation;
}

export default function LeverageCard({ leverage }: Props) {
  const { individual, collective, comparison_summary } = leverage;

  return (
    <Card className="border-foreground border-2 bg-white/[0.02]">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Scale className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-foreground">
            Individual vs Collective — Cost-Benefit
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Individual */}
          <div className="rounded-none bg-red-500/5 border border-red-500/10 p-4">
            <p className="text-[10px] text-red-400/70 uppercase tracking-wider mb-3">
              Going Alone
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-foreground/40">
                  Legal Fees
                </span>
                <span className="text-xs font-medium text-red-400">
                  ₹{individual.legal_fees_estimate.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-foreground/40">Recovery</span>
                <span className="text-xs font-medium text-foreground/60">
                  ₹{individual.recovery_potential.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-foreground/40">Time</span>
                <span className="text-xs text-foreground/60">
                  {individual.time_estimate_months} months
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-foreground/40">Success</span>
                <span className="text-xs text-foreground/60">
                  {Math.round(individual.success_probability * 100)}%
                </span>
              </div>
              <div className="pt-2 border-t border-foreground border-2">
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-red-400" />
                  <span className="text-xs font-medium text-red-400">
                    {individual.cost_benefit_ratio}x return
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Collective */}
          <div className="rounded-none bg-green-500/5 border border-green-500/10 p-4">
            <p className="text-[10px] text-green-400/70 uppercase tracking-wider mb-3">
              Together
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-foreground/40">
                  Your Share
                </span>
                <span className="text-xs font-medium text-green-400">
                  ₹{collective.per_person_fees.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-foreground/40">Recovery</span>
                <span className="text-xs font-medium text-foreground/60">
                  ₹{collective.per_person_recovery.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-foreground/40">Time</span>
                <span className="text-xs text-foreground/60">
                  {collective.time_estimate_months} months
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-foreground/40">Success</span>
                <span className="text-xs text-foreground/60">
                  {Math.round(collective.success_probability * 100)}%
                </span>
              </div>
              <div className="pt-2 border-t border-foreground border-2">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-400" />
                  <span className="text-xs font-medium text-green-400">
                    {collective.cost_benefit_ratio}x return
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Multiplier badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 rounded-lg bg-background /10 /10 border border-amber-500/20 p-3"
        >
          <Zap className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-bold text-amber-400">
            {collective.multiplier}x
          </span>
          <span className="text-xs text-foreground/50">
            better cost-benefit with collective action
          </span>
        </motion.div>

        {/* Summary */}
        <p className="text-[11px] text-foreground/30 mt-3 leading-relaxed">
          {comparison_summary}
        </p>
      </CardContent>
    </Card>
  );
}
