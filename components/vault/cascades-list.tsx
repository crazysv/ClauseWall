"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { CascadingFailure } from "@/types";

interface CascadesListProps {
  cascades: CascadingFailure[];
}

const PROBABILITY_CONFIG = {
  likely: {
    color: "text-red-600 dark:text-red-500",
    bg: "bg-red-100 dark:bg-red-950",
    border: "border-red-500",
    label: "LIKELY",
  },
  possible: {
    color: "text-yellow-600 dark:text-yellow-500",
    bg: "bg-yellow-100 dark:bg-yellow-950",
    border: "border-yellow-500",
    label: "POSSIBLE",
  },
  unlikely: {
    color: "text-blue-600 dark:text-blue-500",
    bg: "bg-blue-100 dark:bg-blue-950",
    border: "border-blue-500",
    label: "UNLIKELY",
  },
};

export default function CascadesList({ cascades }: CascadesListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  if (cascades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border-4 border-black bg-green-50 dark:bg-green-950">
        <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-500 mb-6 stroke-[3px]" />
        <h3 className="text-2xl font-black uppercase tracking-widest text-green-700 dark:text-green-400 mb-4">
          NO CASCADE RISKS
        </h3>
        <p className="text-sm font-bold uppercase tracking-widest text-green-900/60 dark:text-green-200/60 max-w-md leading-relaxed">
          NO DOMINO-EFFECT FAILURE CHAINS WERE DETECTED. YOUR CONTRACTS ARE
          RELATIVELY INDEPENDENT OF EACH OTHER.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {cascades.map((cascade, index) => {
        const config =
          PROBABILITY_CONFIG[cascade.probability] ||
          PROBABILITY_CONFIG.possible;
        const isExpanded = expandedIds.has(cascade.id);

        return (
          <motion.div
            key={cascade.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <Card
              className={`border-4 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${config.bg} cursor-pointer hover:-translate-y-1 hover:shadow-none transition-all`}
              onClick={() => toggleExpand(cascade.id)}
            >
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 border-4 border-black bg-white dark:bg-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
                  >
                    <GitBranch
                      className={`w-5 h-5 ${config.color} stroke-[3px]`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge
                        className={`px-2 py-0.5 border-2 border-black rounded-none ${config.bg} ${config.color} shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] font-black uppercase tracking-widest text-[10px]`}
                      >
                        {config.label}
                      </Badge>
                      <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                        {cascade.chain.length} STEPS
                      </span>
                    </div>
                    <h4 className="text-base font-black uppercase tracking-widest text-foreground block">
                      ⚡ {cascade.trigger_event}
                    </h4>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2">
                      STARTING FROM: {cascade.trigger_document_title}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end">
                    {cascade.total_financial_impact > 0 && (
                      <p className="text-base font-black tracking-tighter text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950 px-2 py-1 border-2 border-red-500 mb-2">
                        ₹
                        {cascade.total_financial_impact.toLocaleString("en-IN")}
                      </p>
                    )}
                    <ChevronDown
                      className={`w-6 h-6 stroke-[3px] text-black dark:text-white transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded: Chain Steps */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-8 space-y-4 pl-6 border-l-4 border-black relative">
                        {cascade.chain.map((step, i) => (
                          <div key={i} className="relative pl-8 pb-4">
                            {/* Dot on the line */}
                            <div className="absolute -left-[18px] top-1 w-8 h-8 rounded-none border-4 border-black bg-white dark:bg-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                              <span className="text-xs font-black">
                                {step.step_number}
                              </span>
                            </div>

                            <div className="border-4 border-black bg-white dark:bg-zinc-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                                    {step.document_title}
                                  </p>
                                  <p className="text-sm font-bold uppercase tracking-widest text-foreground leading-relaxed">
                                    {step.what_happens}
                                  </p>
                                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mt-3 flex items-center gap-2">
                                    <span className="p-1 border-2 border-black bg-gray-100 dark:bg-zinc-800">
                                      ⏱
                                    </span>
                                    {step.time_delay}
                                  </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  {step.financial_impact != null &&
                                    step.financial_impact > 0 && (
                                      <p className="text-sm font-black tracking-tighter text-red-600 dark:text-red-400 mb-2">
                                        ₹
                                        {step.financial_impact.toLocaleString(
                                          "en-IN",
                                        )}
                                      </p>
                                    )}
                                  {step.can_be_prevented && (
                                    <p className="text-xs font-black uppercase tracking-widest text-green-600 dark:text-green-500 bg-green-100 dark:bg-green-950 px-2 py-1 border-2 border-green-500 inline-block">
                                      🛡️ PREVENTABLE
                                    </p>
                                  )}
                                </div>
                              </div>
                              {step.prevention_action && (
                                <p className="text-xs font-bold uppercase tracking-widest text-green-700 dark:text-green-400 mt-4 pt-3 border-t-2 border-dashed border-green-200 dark:border-green-900">
                                  ✅ {step.prevention_action}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Prevention Steps */}
                      {cascade.prevention_steps.length > 0 && (
                        <div className="mt-8 border-4 border-black bg-green-50 dark:bg-green-950 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                          <p className="text-xs font-black uppercase tracking-widest text-green-700 dark:text-green-500 mb-4 flex items-center gap-2 border-b-4 border-green-500 pb-2">
                            <ShieldCheck className="w-5 h-5 stroke-[3px]" /> HOW
                            TO BREAK THIS CHAIN
                          </p>
                          <ul className="space-y-3">
                            {cascade.prevention_steps.map((step, i) => (
                              <li
                                key={i}
                                className="text-sm font-bold uppercase tracking-widest text-green-900/80 dark:text-green-200 flex items-start gap-3 leading-relaxed"
                              >
                                <span className="text-green-500 font-black shrink-0 mt-0.5">
                                  •
                                </span>
                                {step}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
