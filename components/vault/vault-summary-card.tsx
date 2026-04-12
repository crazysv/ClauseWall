"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FileStack,
  AlertTriangle,
  ShieldOff,
  IndianRupee,
  GitBranch,
  Calendar,
} from "lucide-react";
import type { VaultSummaryStats } from "@/types";

interface VaultSummaryCardProps {
  stats: VaultSummaryStats;
}

function AnimatedNumber({
  value,
  prefix = "",
}: {
  value: number;
  prefix?: string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current += increment;
      if (step >= steps) {
        current = value;
        clearInterval(timer);
      }
      setDisplay(Math.round(current));
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  if (prefix === "₹") {
    return (
      <>
        {prefix}
        {display.toLocaleString("en-IN")}
      </>
    );
  }
  return (
    <>
      {prefix}
      {display.toLocaleString("en-IN")}
    </>
  );
}

const RISK_CONFIG = {
  low: {
    color: "text-emerald-500",
    border: "border-emerald-900/50",
    bg: "bg-emerald-950/20",
    barColor: "bg-emerald-500",
    label: "CONTRACTS WELL-COORDINATED — LOW CROSS-NODE RISK",
  },
  medium: {
    color: "text-amber-500",
    border: "border-amber-900/50",
    bg: "bg-amber-950/20",
    barColor: "bg-amber-500",
    label: "MODERATE CROSS-CONTRACT ISSUES DETECTED",
  },
  high: {
    color: "text-orange-500",
    border: "border-orange-900/50",
    bg: "bg-orange-950/20",
    barColor: "bg-orange-500",
    label: "SIGNIFICANT CROSS-CONTRACT RISKS IDENTIFIED",
  },
  extreme: {
    color: "text-red-500",
    border: "border-red-900/50",
    bg: "bg-red-950/20",
    barColor: "bg-red-500",
    label: "CRITICAL CROSS-CONTRACT DANGERS — IMMEDIATE ACTION REQUIRED",
  },
};

export default function VaultSummaryCard({ stats }: VaultSummaryCardProps) {
  const config = RISK_CONFIG[stats.overall_vault_risk];
  const [gaugeWidth, setGaugeWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Map risk scores: low=25, medium=50, high=75, extreme=100
      const riskScoreMap = { low: 20, medium: 45, high: 70, extreme: 95 };
      setGaugeWidth(riskScoreMap[stats.overall_vault_risk]);
    }, 100);
    return () => clearTimeout(timer);
  }, [stats.overall_vault_risk]);

  const metrics = [
    {
      icon: FileStack,
      label: "CONTRACTS",
      value: stats.total_contracts,
      color: "text-cyan-500",
    },
    {
      icon: AlertTriangle,
      label: "CRITICAL_CONFLICTS",
      value: stats.critical_conflicts,
      color:
        stats.critical_conflicts > 0
          ? "text-red-500"
          : "text-emerald-500",
    },
    {
      icon: ShieldOff,
      label: "COVERAGE_GAPS",
      value: stats.coverage_gaps,
      color:
        stats.essential_gaps > 0
          ? "text-amber-500"
          : "text-cyan-500",
    },
    {
      icon: IndianRupee,
      label: "FINANCIAL_EXPOSURE",
      value: stats.total_financial_exposure,
      isRupee: true,
      color:
        stats.total_financial_exposure > 500000
          ? "text-red-500"
          : "text-amber-500",
    },
    {
      icon: GitBranch,
      label: "CASCADE_CHAINS",
      value: stats.cascading_failure_chains,
      color:
        stats.cascading_failure_chains > 0
          ? "text-orange-500"
          : "text-emerald-500",
    },
    {
      icon: Calendar,
      label: "MONTHLY_OBLIGATIONS",
      value: stats.total_monthly_obligations,
      isRupee: true,
      color: "text-indigo-400",
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="border border-neutral-900 bg-[#0a0a0a] p-6 sm:p-8">
        {/* Risk header */}
        <div className="flex flex-col lg:flex-row gap-8 items-stretch">
          {/* Left: Risk Gauge — rectilinear bar */}
          <div className="flex flex-col justify-center min-w-[220px] lg:border-r lg:border-neutral-900 lg:pr-8">
            <div className="text-[9px] font-mono uppercase tracking-widest text-neutral-600 mb-3">
              VAULT_RISK_ASSESSMENT
            </div>

            {/* Horizontal bar gauge */}
            <div className="w-full h-2 bg-neutral-900 mb-4 overflow-hidden">
              <motion.div
                className={`h-full ${config.barColor}`}
                initial={{ width: 0 }}
                animate={{ width: `${gaugeWidth}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>

            <div className="flex items-baseline gap-3 mb-4">
              <span
                className={`text-3xl font-mono uppercase tracking-widest ${config.color}`}
              >
                {stats.overall_vault_risk}
              </span>
              <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-600">
                SEVERITY_LEVEL
              </span>
            </div>

            <p
              className={`text-[9px] font-mono uppercase tracking-widest leading-relaxed ${config.color} border-l-2 ${config.border} pl-3 py-1`}
            >
              {config.label}
            </p>
          </div>

          {/* Right: Metrics Grid */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
            {metrics.map((metric, i) => {
              const Icon = metric.icon;
              return (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="border border-neutral-900 bg-[#050505] p-4 flex flex-col justify-between hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1 border border-neutral-800 bg-neutral-950">
                      <Icon
                        className={`w-3.5 h-3.5 ${metric.color}`}
                      />
                    </div>
                    <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-600">
                      {metric.label}
                    </span>
                  </div>
                  <p
                    className={`text-xl font-mono tabular-nums ${metric.color}`}
                  >
                    {metric.isRupee ? (
                      <AnimatedNumber value={metric.value} prefix="₹" />
                    ) : (
                      <AnimatedNumber value={metric.value} />
                    )}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
