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

      <h2 className="text-xl font-bold text-white mb-2">
        {isComplete ? "Analysis Complete!" : "Analyzing Your Contract Vault"}
      </h2>
      <p className="text-sm text-white/40 mb-8 text-center max-w-md">
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
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                isDone
                  ? "bg-green-500/5"
                  : isCurrent
                  ? "bg-indigo-500/5 border border-indigo-500/20"
                  : "bg-white/[0.02]"
              }`}
            >
              <div className="flex-shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : isCurrent ? (
                  <Loader2 className={`w-5 h-5 ${step.color} animate-spin`} />
                ) : (
                  <Icon className="w-5 h-5 text-white/20" />
                )}
              </div>
              <span
                className={`text-sm ${
                  isDone
                    ? "text-green-400"
                    : isCurrent
                    ? `${step.color} font-medium`
                    : "text-white/30"
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
