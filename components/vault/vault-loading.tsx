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
    label: "Detecting cross-contract conflicts",
    icon: AlertTriangle,
    color: "text-red-400",
  },
  {
    id: "gaps",
    label: "Analyzing coverage gaps",
    icon: ShieldOff,
    color: "text-orange-400",
  },
  {
    id: "cascades",
    label: "Tracing cascading failures",
    icon: GitBranch,
    color: "text-yellow-400",
  },
  {
    id: "finances",
    label: "Calculating financial exposure",
    icon: IndianRupee,
    color: "text-green-400",
  },
  {
    id: "obligations",
    label: "Unifying obligations",
    icon: ListChecks,
    color: "text-blue-400",
  },
  {
    id: "whatif",
    label: "Running what-if scenarios",
    icon: Zap,
    color: "text-indigo-400",
  },
];

export function VaultLoading({ isComplete = false }: VaultLoadingProps) {
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
    <div className="flex flex-col items-center justify-center py-8 md:py-6 md:py-8 lg:py-12 lg:py-16 px-4">
      {/* Animated Shield */}
      <motion.div
        className="relative mb-8"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="relative w-20 h-20 flex items-center justify-center">
          <Loader2 className="w-20 h-20 text-indigo-500/30 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            {isComplete ? (
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            ) : (
              <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse" />
            )}
          </div>
        </div>
      </motion.div>

      <h2 className="text-lg md:text-xl lg:text-2xl font-black text-slate-900 dark:text-slate-100 mb-2 tracking-tight">
        {isComplete ? "Analysis Complete!" : "Analyzing Your Contract Vault"}
      </h2>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 text-center max-w-md">
        {isComplete
          ? "Your cross-contract analysis is ready."
          : "Running AI-powered analysis across all your contracts. This may take 30-90 seconds."}
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${ isDone ? "bg-emerald-50 border border-emerald-100" : isCurrent ? "bg-white dark:bg-card border border-indigo-200 shadow-sm dark:shadow-slate-900/20" : "bg-slate-50 border border-transparent opacity-80" }`}
            >
              <div className="flex-shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : isCurrent ? (
                  <Loader2 className={`w-5 h-5 ${step.color} animate-spin`} />
                ) : (
                  <Icon className="w-5 h-5 text-slate-300" />
                )}
              </div>
              <span
                className={`text-sm ${
                  isDone
                    ? "text-emerald-700 font-bold"
                    : isCurrent
                    ? `${step.color} font-black`
                    : "text-slate-500 font-medium"
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
