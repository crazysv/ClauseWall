"use client";

import type { EscalationPath } from "@/types/authority";
import { DISPUTE_CATEGORY_LABELS } from "@/lib/authority/constants";
import { EscalationStepCard } from "./escalation-step-card";
import { ArrowUpCircle } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  path: EscalationPath;
  compact?: boolean;
}

export function EscalationPathVisualizer({ path, compact = false }: Props) {
  const label = DISPUTE_CATEGORY_LABELS[path.dispute_category] || path.dispute_category;
  const stepsToShow = compact ? path.steps.slice(0, 3) : path.steps;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-1"
    >
      <div className="flex items-center gap-3 mb-6 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
        <div className="w-10 h-10 rounded-full bg-white dark:bg-indigo-900/40 flex items-center justify-center shadow-sm text-indigo-600 dark:text-indigo-400">
           <ArrowUpCircle className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Escalation Path</h3>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label} — {path.total_steps} steps</p>
        </div>
      </div>

      <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
        {stepsToShow.map((step, i) => (
          <EscalationStepCard
            key={step.step_number}
            step={step}
            isActive={i === path.current_step}
            isLast={i === stepsToShow.length - 1}
          />
        ))}
      </div>

      {compact && path.steps.length > 3 && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs font-bold text-slate-500 dark:text-slate-400 text-center mt-6 bg-slate-50 dark:bg-slate-800 py-2 rounded-lg border border-slate-100 dark:border-slate-800 backdrop-blur-sm"
        >
          +{path.steps.length - 3} more steps...
        </motion.p>
      )}
    </motion.div>
  );
}
