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
    color: "text-green-400",
    bg: "from-green-500/10 to-emerald-500/10",
    border: "border-green-500/20",
    gauge: "bg-green-500",
    label: "Your contracts are well-coordinated",
  },
  medium: {
    color: "text-yellow-400",
    bg: "from-yellow-500/10 to-amber-500/10",
    border: "border-yellow-500/20",
    gauge: "bg-yellow-500",
    label: "Some cross-contract issues found",
  },
  high: {
    color: "text-orange-400",
    bg: "from-orange-500/10 to-red-500/10",
    border: "border-orange-500/20",
    gauge: "bg-orange-500",
    label: "Significant cross-contract risks",
  },
  extreme: {
    color: "text-red-400",
    bg: "from-red-500/10 to-pink-500/10",
    border: "border-red-500/20",
    gauge: "bg-red-500",
    label: "Critical cross-contract dangers",
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
      label: "Contracts",
      value: stats.total_contracts,
      color: "text-blue-400",
    },
    {
      icon: AlertTriangle,
      label: "Critical Conflicts",
      value: stats.critical_conflicts,
      color: stats.critical_conflicts > 0 ? "text-red-400" : "text-green-400",
    },
    {
      icon: ShieldOff,
      label: "Coverage Gaps",
      value: stats.coverage_gaps,
      color: stats.essential_gaps > 0 ? "text-orange-400" : "text-blue-400",
    },
    {
      icon: IndianRupee,
      label: "Financial Exposure",
      value: stats.total_financial_exposure,
      isRupee: true,
      color: stats.total_financial_exposure > 500000 ? "text-red-400" : "text-yellow-400",
    },
    {
      icon: GitBranch,
      label: "Cascade Chains",
      value: stats.cascading_failure_chains,
      color: stats.cascading_failure_chains > 0 ? "text-orange-400" : "text-green-400",
    },
    {
      icon: Calendar,
      label: "Monthly Obligations",
      value: stats.total_monthly_obligations,
      isRupee: true,
      color: "text-indigo-400",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className={`bg-gradient-to-br ${config.bg} border ${config.border} overflow-hidden`}>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Risk Gauge */}
            <div className="flex flex-col items-center justify-center min-w-[200px]">
              <div className="relative w-32 h-32">
                {/* Background circle */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-white/5"
                  />
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={`${gaugeWidth * 2.64} ${264 - gaugeWidth * 2.64}`}
                    strokeLinecap="round"
                    className={`${config.gauge} transition-all duration-1000 ease-out`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold ${config.color}`}>
                    {stats.overall_vault_risk.toUpperCase()}
                  </span>
                </div>
              </div>
              <p className={`text-sm mt-3 text-center ${config.color}`}>
                {config.label}
              </p>
            </div>

            {/* Right: Metrics Grid */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {metrics.map((metric, i) => {
                const Icon = metric.icon;
                return (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className="rounded-lg bg-white/[0.03] border border-white/5 p-3"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className={`w-3.5 h-3.5 ${metric.color}`} />
                      <span className="text-[10px] text-white/40 uppercase tracking-wider">
                        {metric.label}
                      </span>
                    </div>
                    <p className={`text-xl font-bold ${metric.color}`}>
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
        </CardContent>
      </Card>
    </motion.div>
  );
}
