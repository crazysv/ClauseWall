"use client";

import type { EscalationPath } from "@/types/authority";
import { DISPUTE_CATEGORY_LABELS } from "@/lib/authority/constants";
import EscalationStepCard from "./escalation-step-card";
import { ArrowUpCircle } from "lucide-react";

interface Props {
  path: EscalationPath;
  compact?: boolean;
}

export default function EscalationPathVisualizer({ path, compact = false }: Props) {
  const label = DISPUTE_CATEGORY_LABELS[path.dispute_category] || path.dispute_category;
  const stepsToShow = compact ? path.steps.slice(0, 3) : path.steps;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 border-b-4 border-black pb-4">
        <ArrowUpCircle className="h-8 w-8 text-amber-600 dark:text-amber-400 stroke-[3px]" />
        <div>
          <h3 className="font-black text-xl uppercase tracking-widest">Escalation Path</h3>
          <p className="text-sm font-bold text-muted-foreground">{label} — {path.total_steps} steps</p>
        </div>
      </div>

      <div className="space-y-0">
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
        <p className="text-xs text-muted-foreground text-center mt-2">
          +{path.steps.length - 3} more steps...
        </p>
      )}
    </div>
  );
}
