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
import { Card, CardContent } from "@/components/ui/card";
import type { VaultSummaryStats } from "@/types";

interface VaultSummaryCardProps {
  stats: VaultSummaryStats;
}

function AnimatedNumber({ value, prefix = "" }: { value: number; prefix?: string }) {
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
    return <>{prefix}{display.toLocaleString("en-IN")}</>;
  }
  return <>{prefix}{display.toLocaleString("en-IN")}</>;
}

const RISK_CONFIG = {
  low: {
    color: "text-green-600 dark:text-green-500",
    bg: "bg-green-100 dark:bg-green-950",
    border: "border-green-500",
    gauge: "text-green-500",
    label: "YOUR CONTRACTS ARE WELL-COORDINATED",
  },
  medium: {
    color: "text-yellow-600 dark:text-yellow-500",
    bg: "bg-yellow-100 dark:bg-yellow-950",
    border: "border-yellow-500",
    gauge: "text-yellow-500",
    label: "SOME CROSS-CONTRACT ISSUES FOUND",
  },
  high: {
    color: "text-orange-600 dark:text-orange-500",
    bg: "bg-orange-100 dark:bg-orange-950",
    border: "border-orange-500",
    gauge: "text-orange-500",
    label: "SIGNIFICANT CROSS-CONTRACT RISKS",
  },
  extreme: {
    color: "text-red-700 dark:text-red-500",
    bg: "bg-red-100 dark:bg-red-950",
    border: "border-red-500",
    gauge: "text-red-500",
    label: "CRITICAL CROSS-CONTRACT DANGERS",
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
      color: "text-blue-600 dark:text-blue-500",
    },
    {
      icon: AlertTriangle,
      label: "CRITICAL CONFLICTS",
      value: stats.critical_conflicts,
      color: stats.critical_conflicts > 0 ? "text-red-600 dark:text-red-500" : "text-green-600 dark:text-green-500",
    },
    {
      icon: ShieldOff,
      label: "COVERAGE GAPS",
      value: stats.coverage_gaps,
      color: stats.essential_gaps > 0 ? "text-orange-600 dark:text-orange-500" : "text-blue-600 dark:text-blue-500",
    },
    {
      icon: IndianRupee,
      label: "FINANCIAL EXPOSURE",
      value: stats.total_financial_exposure,
      isRupee: true,
      color: stats.total_financial_exposure > 500000 ? "text-red-600 dark:text-red-500" : "text-yellow-600 dark:text-yellow-500",
    },
    {
      icon: GitBranch,
      label: "CASCADE CHAINS",
      value: stats.cascading_failure_chains,
      color: stats.cascading_failure_chains > 0 ? "text-orange-600 dark:text-orange-500" : "text-green-600 dark:text-green-500",
    },
    {
      icon: Calendar,
      label: "MONTHLY OBLIGATIONS",
      value: stats.total_monthly_obligations,
      isRupee: true,
      color: "text-indigo-600 dark:text-indigo-500",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={`border-8 border-black ${config.bg} p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}>
          <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start border-b-4 lg:border-b-0 lg:border-r-4 border-black pb-8 lg:pb-0 lg:pr-8">
            {/* Left: Risk Gauge */}
            <div className="flex flex-col items-center justify-center min-w-[240px]">
              <div className="relative w-40 h-40">
                {/* Background circle */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    className="text-black/10 dark:text-white/10"
                  />
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeDasharray={`${gaugeWidth * 2.64} ${264 - gaugeWidth * 2.64}`}
                    strokeLinecap="butt"
                    className={`${config.gauge} transition-all duration-1000 ease-out drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-black rounded-full m-5 border-4 border-black shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <span className={`text-2xl font-black uppercase tracking-widest ${config.color}`}>
                    {stats.overall_vault_risk}
                  </span>
                </div>
              </div>
              <p className={`text-sm font-bold uppercase tracking-widest mt-6 text-center ${config.color} px-4 py-2 border-4 border-black bg-white dark:bg-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
                {config.label}
              </p>
            </div>

            {/* Right: Metrics Grid */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
              {metrics.map((metric, i) => {
                const Icon = metric.icon;
                return (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className="border-4 border-black bg-white dark:bg-zinc-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                      <div className="p-1.5 border-2 border-black bg-gray-100 dark:bg-black w-fit">
                        <Icon className={`w-4 h-4 ${metric.color} stroke-[3px]`} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground w-full sm:w-auto">
                        {metric.label}
                      </span>
                    </div>
                    <p className={`text-2xl font-black tabular-nums tracking-tighter ${metric.color}`}>
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
