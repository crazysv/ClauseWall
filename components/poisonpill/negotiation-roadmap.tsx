"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, ChevronDown, Check } from "lucide-react";
import type { NegotiationTarget, PoisonPillTrap } from "@/types";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  roadmap: NegotiationTarget[];
  traps: PoisonPillTrap[];
}

const DIFFICULTY_STYLES: Record<string, { bg: string; text: string }> = {
  easy: { bg: "bg-green-500/10", text: "text-green-400" },
  medium: { bg: "bg-yellow-500/10", text: "text-yellow-400" },
  hard: { bg: "bg-red-500/10", text: "text-red-400" },
};

export function NegotiationRoadmap({ roadmap, traps }: Props) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  if (roadmap.length === 0) {
    return (
      <Card className="bg-white/[0.02] border-foreground border-2">
        <CardContent className="p-8 text-center">
          <p className="text-xs text-foreground">
            No negotiation targets identified.
          </p>
        </CardContent>
      </Card>
    );
  }

  // How many unique traps can be broken by negotiating
  const uniqueTrapsBreakable = new Set(roadmap.flatMap((t) => t.traps_broken));
  const totalTraps = traps.length;
  const breakablePercent =
    totalTraps > 0
      ? Math.round((uniqueTrapsBreakable.size / totalTraps) * 100)
      : 0;

  return (
    <div className="space-y-3">
      {/* Top Banner */}
      <Card className="bg-background border-green-500/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-none bg-green-500/10">
              <Target className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                Negotiate {roadmap.length} clause
                {roadmap.length !== 1 ? "s" : ""} to neutralize{" "}
                {uniqueTrapsBreakable.size} of {totalTraps} trap
                {totalTraps !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${breakablePercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-background rounded-full"
            />
          </div>
          <p className="text-[10px] text-foreground mt-1">
            {breakablePercent}% of traps neutralizable
          </p>
        </CardContent>
      </Card>

      {/* Negotiation Targets */}
      {roadmap.map((target, idx) => {
        const diffStyle =
          DIFFICULTY_STYLES[target.difficulty] || DIFFICULTY_STYLES.medium;
        const isExpanded = expandedIdx === idx;
        const brokenTraps = traps.filter((t) =>
          target.traps_broken.includes(t.id),
        );

        return (
          <motion.div
            key={target.clause_number}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
          >
            <div className="bg-white/[0.02] border border-foreground border-2 rounded-none overflow-hidden">
              <button
                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                className="w-full text-left p-4 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
              >
                {/* Priority Number */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-green-400">
                    {target.priority}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">
                      Clause {target.clause_number}
                    </span>
                    <span className="text-[10px] text-foreground capitalize">
                      {target.clause_type.replace(/_/g, " ")}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full ${diffStyle.bg} ${diffStyle.text}`}
                    >
                      {target.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-foreground mt-0.5">
                    Breaks {target.traps_broken.length} trap
                    {target.traps_broken.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <ChevronDown
                  className={`w-4 h-4 text-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3 border-t border-foreground border-2 pt-3">
                      {/* Why */}
                      <div>
                        <p className="text-[10px] text-foreground uppercase tracking-wider mb-0.5">
                          Why This Clause
                        </p>
                        <p className="text-xs text-foreground">{target.why}</p>
                      </div>

                      {/* Suggested Change */}
                      <div>
                        <p className="text-[10px] text-foreground uppercase tracking-wider mb-0.5">
                          Suggested Change
                        </p>
                        <p className="text-xs text-foreground">
                          {target.suggested_change}
                        </p>
                      </div>

                      {/* Traps Neutralized */}
                      <div>
                        <p className="text-[10px] text-foreground uppercase tracking-wider mb-1">
                          Traps Neutralized
                        </p>
                        <div className="space-y-1">
                          {brokenTraps.map((trap) => (
                            <div
                              key={trap.id}
                              className="flex items-center gap-2 text-xs"
                            >
                              <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                              <span className="text-foreground">
                                {trap.trap_name}
                              </span>
                              <span className="text-[9px] text-foreground capitalize">
                                ({trap.severity})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
