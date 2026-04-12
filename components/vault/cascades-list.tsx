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
import type { CascadingFailure } from "@/types";

interface CascadesListProps {
  cascades: CascadingFailure[];
}

const PROBABILITY_CONFIG = {
  likely: {
    color: "text-red-500",
    bg: "bg-red-950/20",
    border: "border-red-900/50",
    label: "LIKELY",
  },
  possible: {
    color: "text-amber-500",
    bg: "bg-amber-950/20",
    border: "border-amber-900/50",
    label: "POSSIBLE",
  },
  unlikely: {
    color: "text-cyan-500",
    bg: "bg-cyan-950/20",
    border: "border-cyan-900/50",
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
      <div className="flex flex-col items-center justify-center py-16 text-center border border-emerald-900/40 bg-emerald-950/10">
        <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-4" />
        <h3 className="text-[10px] font-mono uppercase tracking-widest text-emerald-500 mb-2">
          [ NO_CASCADE_RISKS ]
        </h3>
        <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-600 max-w-md leading-relaxed">
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
            <div
              className={`border ${config.border} ${config.bg} cursor-pointer hover:border-neutral-600 transition-colors`}
              onClick={() => toggleExpand(cascade.id)}
            >
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start gap-4">
                  <div
                    className="p-2 border border-neutral-800 bg-[#050505] flex-shrink-0"
                  >
                    <GitBranch
                      className={`w-4 h-4 ${config.color}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 border ${config.border} ${config.color}`}
                      >
                        {config.label}
                      </span>
                      <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-600">
                        {cascade.chain.length} STEPS
                      </span>
                    </div>
                    <h4 className="text-xs font-mono uppercase tracking-widest text-neutral-200">
                      {cascade.trigger_event}
                    </h4>
                    <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-600 mt-2">
                      TRIGGER_SOURCE: {cascade.trigger_document_title}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end">
                    {cascade.total_financial_impact > 0 && (
                      <span className="text-xs font-mono text-red-500 border border-red-900/50 bg-red-950/20 px-2 py-0.5 mb-2">
                        ₹
                        {cascade.total_financial_impact.toLocaleString("en-IN")}
                      </span>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 text-neutral-600 transition-transform ${
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
                      <div className="mt-6 space-y-3 pl-6 border-l border-neutral-800 relative">
                        {cascade.chain.map((step, i) => (
                          <div key={i} className="relative pl-8 pb-3">
                            {/* Step number node */}
                            <div className="absolute -left-[13px] top-1 w-6 h-6 border border-neutral-800 bg-[#0a0a0a] flex items-center justify-center">
                              <span className="text-[8px] font-mono text-neutral-500">
                                {step.step_number}
                              </span>
                            </div>

                            <div className="border border-neutral-900 bg-[#050505] p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 mb-2">
                                    {step.document_title}
                                  </p>
                                  <p className="text-[10px] font-mono text-neutral-400 leading-relaxed">
                                    {step.what_happens}
                                  </p>
                                  <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-700 mt-3 flex items-center gap-2">
                                    <span className="text-neutral-600">//</span>
                                    DELAY: {step.time_delay}
                                  </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  {step.financial_impact != null &&
                                    step.financial_impact > 0 && (
                                      <span className="text-[10px] font-mono text-red-500 block mb-2">
                                        ₹
                                        {step.financial_impact.toLocaleString(
                                          "en-IN",
                                        )}
                                      </span>
                                    )}
                                  {step.can_be_prevented && (
                                    <span className="text-[8px] font-mono uppercase tracking-widest text-emerald-500 border border-emerald-900/50 bg-emerald-950/20 px-1.5 py-0.5 inline-block">
                                      PREVENTABLE
                                    </span>
                                  )}
                                </div>
                              </div>
                              {step.prevention_action && (
                                <p className="text-[9px] font-mono text-emerald-500/80 mt-4 pt-3 border-t border-neutral-900">
                                  → {step.prevention_action}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Prevention Steps */}
                      {cascade.prevention_steps.length > 0 && (
                        <div className="mt-6 border-l-2 border-emerald-900/50 bg-emerald-950/10 p-5">
                          <p className="text-[9px] font-mono uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-2 border-b border-emerald-900/30 pb-2">
                            <ShieldCheck className="w-4 h-4" /> HOW
                            TO BREAK THIS CHAIN
                          </p>
                          <ul className="space-y-2">
                            {cascade.prevention_steps.map((step, i) => (
                              <li
                                key={i}
                                className="text-[10px] font-mono text-emerald-400/80 flex items-start gap-3 leading-relaxed"
                              >
                                <span className="text-emerald-700 shrink-0 mt-0.5">
                                  →
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
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
