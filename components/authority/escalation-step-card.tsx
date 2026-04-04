"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  ArrowDown,
  Building2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { EscalationStep } from "@/types/authority";

interface Props {
  step: EscalationStep;
  isActive: boolean;
  isLast: boolean;
}

const STATUS_CONFIG = {
  completed: {
    icon: CheckCircle2,
    color: "text-green-700 dark:text-green-400",
    bg: "bg-green-200 dark:bg-green-900",
    line: "bg-black dark:bg-white",
  },
  pending: {
    icon: Clock,
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-200 dark:bg-amber-900",
    line: "bg-black dark:bg-white border-dashed",
  },
  overdue: {
    icon: AlertTriangle,
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-200 dark:bg-red-900",
    line: "bg-black dark:bg-white",
  },
  upcoming: {
    icon: Circle,
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-200 dark:bg-zinc-800",
    line: "bg-gray-300 dark:bg-gray-700 border-dashed",
  },
  skipped: {
    icon: Circle,
    color: "text-gray-500",
    bg: "bg-gray-200 dark:bg-zinc-800",
    line: "bg-gray-300 dark:bg-gray-700",
  },
};

export default function EscalationStepCard({ step, isActive, isLast }: Props) {
  const config = STATUS_CONFIG[step.status] || STATUS_CONFIG.upcoming;
  const Icon = config.icon;

  return (
    <div className="relative flex gap-4">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <motion.div
          className={`w-10 h-10 border-4 border-black ${config.bg} flex items-center justify-center flex-shrink-0 z-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
          animate={
            isActive
              ? {
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    "2px 2px 0px 0px rgba(0,0,0,1)",
                    "4px 4px 0px 0px rgba(0,0,0,1)",
                    "2px 2px 0px 0px rgba(0,0,0,1)",
                  ],
                }
              : {}
          }
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Icon className={`h-5 w-5 stroke-[3px] ${config.color}`} />
        </motion.div>
        {!isLast && (
          <div
            className={`w-1 flex-1 min-h-[3rem] -mt-2 -mb-2 z-0 border-x-4 ${config.line.includes("border-dashed") ? "border-dashed border-gray-400 dark:border-gray-600 bg-transparent" : config.line}`}
          />
        )}
      </div>

      {/* Step Content */}
      <Card
        className={`flex-1 mb-6 rounded-none ${isActive ? "card-impact bg-blue-50 dark:bg-blue-900/20" : "border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-zinc-900 opacity-80 border-dashed"}`}
      >
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-base sm:text-lg font-black uppercase tracking-widest flex items-center gap-2">
              <span className="text-muted-foreground">
                Step {step.step_number}:
              </span>
              {step.action}
            </h4>
            {step.filing_fee !== undefined && (
              <span
                className={`text-xs font-bold px-3 py-1 border-2 border-black uppercase tracking-widest ${step.filing_fee === 0 ? "bg-green-200 text-green-800" : "bg-amber-200 text-amber-800"}`}
              >
                {step.filing_fee === 0
                  ? "FREE"
                  : `₹${step.filing_fee.toLocaleString("en-IN")}`}
              </span>
            )}
          </div>

          <p className="text-sm font-medium text-muted-foreground leading-relaxed mb-4">
            {step.description}
          </p>

          {/* Deadline */}
          <div className="flex items-center gap-2 text-sm font-bold bg-white dark:bg-black border-2 border-black inline-flex px-3 py-1 mb-3">
            <Clock className="h-4 w-4 stroke-[3px]" />
            <span>Deadline: {step.deadline_days} days</span>
            {step.deadline_date && (
              <span className="text-amber-400">
                (by{" "}
                {new Date(step.deadline_date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                )
              </span>
            )}
          </div>

          {/* Required Documents */}
          {step.required_documents.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                📋 Documents needed:
              </p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {step.required_documents.map((doc, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Authority Link */}
          {step.authority_name && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-400">
              <Building2 className="h-3 w-3" />
              <span>File at: {step.authority_name}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
