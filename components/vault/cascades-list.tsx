"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, ChevronDown, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { CascadingFailure } from "@/types";

interface CascadesListProps {
  cascades: CascadingFailure[];
}

const PROBABILITY_CONFIG = {
  likely: {
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    label: "Likely",
  },
  possible: {
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    label: "Possible",
  },
  unlikely: {
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    label: "Unlikely",
  },
};

export function CascadesList({ cascades }: CascadesListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  if (cascades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 md:py-6 md:py-8 lg:py-12 lg:py-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 border-dashed rounded-3xl">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-4" />
        <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 mb-2 tracking-tight">
          No Cascade Risks
        </h3>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-md">
          No domino-effect failure chains were detected. Your contracts are
          relatively independent of each other.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {cascades.map((cascade, index) => {
        const config = PROBABILITY_CONFIG[cascade.probability] || PROBABILITY_CONFIG.possible;
        const isExpanded = expandedIds.has(cascade.id);

        return (
          <motion.div
            key={cascade.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <Card
              className={`bg-white dark:bg-card border-slate-200 dark:border-slate-700 hover:border-indigo-300 shadow-sm dark:shadow-slate-900/20 rounded-2xl cursor-pointer transition-all`}
              onClick={() => toggleExpand(cascade.id)}
            >
              <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-xl ${config.bg}`}>
                    <GitBranch className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`${config.bg} ${config.color} text-[10px] font-black uppercase tracking-widest border-0 px-2 rounded-full`}>
                        {config.label}
                      </Badge>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {cascade.chain.length} steps
                      </span>
                    </div>
                    <h4 className="text-base font-black text-slate-900 dark:text-slate-100 leading-tight">
                      ⚡ {cascade.trigger_event}
                    </h4>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                      Starting from: {cascade.trigger_document_title}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end">
                    {cascade.total_financial_impact > 0 && (
                      <p className="text-base font-black text-red-700 tracking-tight">
                        ₹{cascade.total_financial_impact.toLocaleString("en-IN")}
                      </p>
                    )}
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform mt-2 ${
                        isExpanded ? "rotate-180 text-indigo-500" : ""
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
                      <div className="mt-6 pl-4 border-l-2 border-slate-200 dark:border-slate-700 space-y-4">
                        {cascade.chain.map((step, i) => (
                          <div
                            key={i}
                            className="relative pl-6 pb-2"
                          >
                            {/* Dot on the line */}
                            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center font-black">
                              <span className="text-[8px] text-slate-500 dark:text-slate-400">{step.step_number}</span>
                            </div>

                            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{step.document_title}</p>
                                  <p className="text-sm font-black text-slate-900 dark:text-slate-100 leading-relaxed mt-1">{step.what_happens}</p>
                                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-2 bg-slate-200/50 inline-block px-2 py-0.5 rounded uppercase tracking-widest">
                                    ⏱ {step.time_delay}
                                  </p>
                                </div>
                                <div className="text-right flex-shrink-0 flex flex-col items-end">
                                  {step.financial_impact != null && step.financial_impact > 0 && (
                                    <p className="text-sm font-black text-red-700 tracking-tight">
                                      ₹{step.financial_impact.toLocaleString("en-IN")}
                                    </p>
                                  )}
                                  {step.can_be_prevented && (
                                    <Badge className="text-[10px] bg-emerald-100 border-none text-emerald-800 font-bold uppercase tracking-widest mt-2 hover:bg-emerald-200">🛡️ Preventable</Badge>
                                  )}
                                </div>
                              </div>
                              {step.prevention_action && (
                                <p className="text-sm font-bold text-emerald-700 mt-4 bg-emerald-50 px-3 py-2 border border-emerald-100 rounded-lg">
                                  ✅ {step.prevention_action}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Prevention Steps */}
                      {cascade.prevention_steps.length > 0 && (
                        <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-200 p-5">
                          <p className="text-xs text-emerald-800 font-black uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4" /> How to Break This Chain
                          </p>
                          <ul className="space-y-2">
                            {cascade.prevention_steps.map((step, i) => (
                              <li key={i} className="text-sm font-medium text-emerald-950/80 flex items-start gap-2">
                                <span className="text-emerald-500 font-black mt-0.5">•</span>
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
