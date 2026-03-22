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
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    label: "Likely",
  },
  possible: {
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    label: "Possible",
  },
  unlikely: {
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    label: "Unlikely",
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
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-400/50 mb-4" />
        <h3 className="text-lg font-semibold text-green-400 mb-2">
          No Cascade Risks
        </h3>
        <p className="text-sm text-white/40 max-w-md">
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
              className={`${config.bg} ${config.border} cursor-pointer hover:brightness-110 transition-all`}
              onClick={() => toggleExpand(cascade.id)}
            >
              <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${config.bg}`}>
                    <GitBranch className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`${config.bg} ${config.color} text-[10px] border-0`}>
                        {config.label}
                      </Badge>
                      <span className="text-[10px] text-white/30">
                        {cascade.chain.length} steps
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white">
                      ⚡ {cascade.trigger_event}
                    </h4>
                    <p className="text-xs text-white/40 mt-1">
                      Starting from: {cascade.trigger_document_title}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {cascade.total_financial_impact > 0 && (
                      <p className="text-sm font-bold text-red-400">
                        ₹{cascade.total_financial_impact.toLocaleString("en-IN")}
                      </p>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 text-white/30 transition-transform mt-1 ml-auto ${
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
                      <div className="mt-4 space-y-2 pl-4 border-l-2 border-white/10">
                        {cascade.chain.map((step, i) => (
                          <div
                            key={i}
                            className="relative pl-6 pb-3"
                          >
                            {/* Dot on the line */}
                            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-gray-900 border-2 border-white/20 flex items-center justify-center">
                              <span className="text-[8px] text-white/50">{step.step_number}</span>
                            </div>

                            <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-xs text-white/40">{step.document_title}</p>
                                  <p className="text-sm text-white/80">{step.what_happens}</p>
                                  <p className="text-[10px] text-white/30 mt-1">
                                    ⏱ {step.time_delay}
                                  </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  {step.financial_impact != null && step.financial_impact > 0 && (
                                    <p className="text-xs font-semibold text-red-300">
                                      ₹{step.financial_impact.toLocaleString("en-IN")}
                                    </p>
                                  )}
                                  {step.can_be_prevented && (
                                    <p className="text-[10px] text-green-400 mt-1">🛡️ Preventable</p>
                                  )}
                                </div>
                              </div>
                              {step.prevention_action && (
                                <p className="text-[10px] text-green-300 mt-2">
                                  ✅ {step.prevention_action}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Prevention Steps */}
                      {cascade.prevention_steps.length > 0 && (
                        <div className="mt-4 rounded-lg bg-green-500/5 border border-green-500/10 p-3">
                          <p className="text-[10px] text-green-400 font-medium mb-2 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> How to Break This Chain
                          </p>
                          <ul className="space-y-1">
                            {cascade.prevention_steps.map((step, i) => (
                              <li key={i} className="text-xs text-white/60 flex items-start gap-2">
                                <span className="text-green-400 mt-0.5">•</span>
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
