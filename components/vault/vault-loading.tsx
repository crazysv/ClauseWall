"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    color: "text-red-600 dark:text-red-500",
    bg: "bg-red-100 dark:bg-red-950/50",
    border: "border-red-500",
  },
  {
    id: "gaps",
    label: "ANALYZING COVERAGE GAPS",
    icon: ShieldOff,
    color: "text-orange-600 dark:text-orange-500",
    bg: "bg-orange-100 dark:bg-orange-950/50",
    border: "border-orange-500",
  },
  {
    id: "cascades",
    label: "TRACING CASCADING FAILURES",
    icon: GitBranch,
    color: "text-yellow-600 dark:text-yellow-500",
    bg: "bg-yellow-100 dark:bg-yellow-950/50",
    border: "border-yellow-500",
  },
  {
    id: "finances",
    label: "CALCULATING FINANCIAL EXPOSURE",
    icon: IndianRupee,
    color: "text-green-600 dark:text-green-500",
    bg: "bg-green-100 dark:bg-green-950/50",
    border: "border-green-500",
  },
  {
    id: "obligations",
    label: "UNIFYING OBLIGATIONS",
    icon: ListChecks,
    color: "text-blue-600 dark:text-blue-500",
    bg: "bg-blue-100 dark:bg-blue-950/50",
    border: "border-blue-500",
  },
  {
    id: "whatif",
    label: "RUNNING WHAT-IF SCENARIOS",
    icon: Zap,
    color: "text-indigo-600 dark:text-indigo-500",
    bg: "bg-indigo-100 dark:bg-indigo-950/50",
    border: "border-indigo-500",
  },
];

export default function VaultLoading({ isComplete = false }: VaultLoadingProps) {
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
      {/* Animated Shield */}
      <motion.div
        className="relative mb-8"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className={`relative w-28 h-28 flex items-center justify-center border-8 border-black bg-white dark:bg-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}>
          {isComplete ? (
             <div className="absolute inset-0 bg-green-400/20" />
          ) : (
            <>
              <div className="absolute inset-0 bg-indigo-500/10" />
            </>
          )}

          <div className="relative z-10 flex items-center justify-center w-full h-full">
            {isComplete ? (
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-500 stroke-[4px]" />
            ) : (
              // Use a spinning border rather than icon
              <div className="w-12 h-12 border-4 border-t-indigo-600 border-r-indigo-600 border-b-black border-l-black rounded-full animate-spin dark:border-t-indigo-500 dark:border-r-indigo-500 dark:border-b-white dark:border-l-white" />
            )}
          </div>
        </div>
      </motion.div>

      <h2 className="text-3xl font-black uppercase tracking-widest text-foreground mb-4 text-center">
        {isComplete ? "ANALYSIS COMPLETE!" : "ANALYZING YOUR CONTRACT VAULT"}
      </h2>
      <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-12 text-center max-w-md mx-auto leading-relaxed border-2 border-black bg-white dark:bg-zinc-900 px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        {isComplete
          ? "YOUR CROSS-CONTRACT ANALYSIS IS READY."
          : "RUNNING AI-POWERED ANALYSIS ACROSS ALL YOUR CONTRACTS. THIS MAY TAKE 30-90 SECONDS."}
      </p>

      {/* Step Progress */}
      <div className="w-full max-w-sm space-y-3">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isDone = index < activeStep;
          const isCurrent = index === activeStep && !isComplete;

          return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-4 px-4 py-3 border-4 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                  isDone
                    ? "bg-green-100 dark:bg-green-950/30 border-green-500"
                    : isCurrent
                    ? `${step.bg} ${step.border}`
                    : "bg-gray-50 dark:bg-zinc-900 border-black opacity-50"
                }`}
              >
                <div className={`flex-shrink-0 p-2 border-2 ${isDone ? 'border-green-600 dark:border-green-500 bg-white dark:bg-black' : isCurrent ? `${step.border} bg-white dark:bg-black` : 'border-gray-400 bg-gray-200 dark:bg-zinc-800'}`}>
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500 stroke-[3px]" />
                  ) : isCurrent ? (
                    <Loader2 className={`w-5 h-5 ${step.color} animate-spin stroke-[3px]`} />
                  ) : (
                    <Icon className="w-5 h-5 text-gray-500 stroke-[3px]" />
                  )}
                </div>
                <span
                  className={`text-sm font-black uppercase tracking-widest ${
                    isDone
                      ? "text-green-700 dark:text-green-400"
                      : isCurrent
                      ? `${step.color}`
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </motion.div>
          );
        })}
      </div>
    </div>
  );
}
