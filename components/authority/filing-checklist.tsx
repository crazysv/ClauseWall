"use client";

import { useState } from "react";
import { CheckCircle2, Circle, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { FilingStep } from "@/types/authority";

interface Props {
  steps: FilingStep[];
  documents: string[];
}

export default function FilingChecklist({ steps, documents }: Props) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (step: number) => {
    const next = new Set(checked);
    if (next.has(step)) next.delete(step);
    else next.add(step);
    setChecked(next);
  };

  const progress =
    steps.length > 0 ? Math.round((checked.size / steps.length) * 100) : 0;

  return (
    <Card className="border-foreground border-2 bg-white/[0.02]">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-semibold">Filing Checklist</h3>
          </div>
          <span className="text-xs text-foreground">
            {progress}% complete
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-muted rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Steps */}
        {steps.length > 0 && (
          <div className="space-y-1.5 mb-4">
            <p className="text-xs font-medium text-foreground mb-2">
              Steps:
            </p>
            {steps.map((step) => (
              <button
                key={step.step}
                onClick={() => toggle(step.step)}
                className="flex items-start gap-2 w-full text-left p-2 rounded-none hover:bg-white/[0.03] transition-colors"
              >
                {checked.has(step.step) ? (
                  <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-foreground mt-0.5 flex-shrink-0" />
                )}
                <span
                  className={`text-xs ${checked.has(step.step) ? "line-through text-foreground" : ""}`}
                >
                  {step.description}
                  {step.required && (
                    <span className="text-red-400 ml-1">*</span>
                  )}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Required Documents */}
        {documents.length > 0 && (
          <div>
            <p className="text-xs font-medium text-foreground mb-2">
              Required Documents:
            </p>
            <ul className="space-y-1">
              {documents.map((doc, i) => (
                <li
                  key={i}
                  className="text-xs text-foreground flex items-start gap-1.5"
                >
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
