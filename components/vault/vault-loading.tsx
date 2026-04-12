"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  GitBranch,
  IndianRupee,
  ListChecks,
  ShieldOff,
  Zap,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface VaultLoadingProps {
  isComplete?: boolean;
}

const STEPS = [
  {
    id: "conflicts",
    label: "DETECTING CROSS-CONTRACT CONFLICTS",
    icon: AlertTriangle,
    color: "text-red-500",
    activeBorder: "border-red-900/50",
    activeBg: "bg-red-950/20",
  },
  {
    id: "gaps",
    label: "ANALYZING COVERAGE GAPS",
    icon: ShieldOff,
    color: "text-amber-500",
    activeBorder: "border-amber-900/50",
    activeBg: "bg-amber-950/20",
  },
  {
    id: "cascades",
    label: "TRACING CASCADING FAILURES",
    icon: GitBranch,
    color: "text-yellow-500",
    activeBorder: "border-yellow-900/50",
    activeBg: "bg-yellow-950/20",
  },
  {
    id: "finances",
    label: "CALCULATING FINANCIAL EXPOSURE",
    icon: IndianRupee,
    color: "text-emerald-500",
    activeBorder: "border-emerald-900/50",
    activeBg: "bg-emerald-950/20",
  },
  {
    id: "obligations",
    label: "UNIFYING OBLIGATIONS",
    icon: ListChecks,
    color: "text-cyan-500",
    activeBorder: "border-cyan-900/50",
    activeBg: "bg-cyan-950/20",
  },
  {
    id: "whatif",
    label: "RUNNING WHAT-IF SCENARIOS",
    icon: Zap,
    color: "text-indigo-400",
    activeBorder: "border-indigo-900/50",
    activeBg: "bg-indigo-950/20",
  },
];

export default function VaultLoading({
  isComplete = false,
}: VaultLoadingProps) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (isComplete) {
      setActiveStep(STEPS.length);
      return;
    }

    // Simulate step progression
    const timer = setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= STEPS.length - 1) return prev; // Stay on last step until actually complete
        return prev + 1;
      });
    }, 3500);

    return () => clearInterval(timer);
  }, [isComplete]);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Scan indicator */}
      <motion.div
        className="relative mb-10"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="relative w-20 h-20 flex items-center justify-center border border-cyan-900/50 bg-[#0a0a0a]">
          {isComplete ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          ) : (
            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
          )}
          {/* Corner accents */}
          <div className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t border-l border-cyan-500" />
          <div className="absolute -top-[1px] -right-[1px] w-2 h-2 border-t border-r border-cyan-500" />
          <div className="absolute -bottom-[1px] -left-[1px] w-2 h-2 border-b border-l border-cyan-500" />
          <div className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b border-r border-cyan-500" />
        </div>
      </motion.div>

      <h2 className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-3 text-center">
        {isComplete ? "[ SCAN_COMPLETE ]" : "[ EXECUTING_CROSS-CONTRACT_SCAN ]"}
      </h2>
      <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-600 mb-12 text-center max-w-md mx-auto leading-relaxed">
        {isComplete
          ? "CROSS-CONTRACT INTELLIGENCE REPORT READY FOR REVIEW."
          : "RUNNING AI-POWERED ANALYSIS ACROSS ALL PAYLOADS. ESTIMATED TIME: 30-90 SECONDS."}
      </p>

      {/* Step Progress */}
      <div className="w-full max-w-md space-y-2">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isDone = index < activeStep;
          const isCurrent = index === activeStep && !isComplete;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-4 px-4 py-3 border transition-all ${
                isDone
                  ? "bg-emerald-950/10 border-emerald-900/40"
                  : isCurrent
                    ? `${step.activeBg} ${step.activeBorder}`
                    : "bg-[#050505] border-neutral-900 opacity-40"
              }`}
            >
              <div
                className={`flex-shrink-0 p-1.5 border ${isDone ? "border-emerald-900/50 bg-emerald-950/20" : isCurrent ? `${step.activeBorder} bg-[#050505]` : "border-neutral-800 bg-[#050505]"}`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : isCurrent ? (
                  <Loader2
                    className={`w-4 h-4 ${step.color} animate-spin`}
                  />
                ) : (
                  <Icon className="w-4 h-4 text-neutral-700" />
                )}
              </div>
              <span
                className={`text-[9px] font-mono uppercase tracking-widest ${
                  isDone
                    ? "text-emerald-500"
                    : isCurrent
                      ? step.color
                      : "text-neutral-700"
                }`}
              >
                {step.label}
              </span>
              {isDone && (
                <span className="ml-auto text-[8px] font-mono text-emerald-700 uppercase tracking-widest">
                  DONE
                </span>
              )}
              {isCurrent && (
                <span className="ml-auto text-[8px] font-mono text-neutral-500 uppercase tracking-widest animate-pulse">
                  ACTIVE
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
