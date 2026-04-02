"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StressTestResult } from "@/lib/simulation/types";
import { formatINR } from "@/lib/simulation/formatters";
import { LIFE_EVENT_LABELS } from "@/lib/simulation/stress-test-engine";

interface Props {
  result: StressTestResult;
}

export function StressTestResultView({ result }: Props) {
  if (result.triggeredClauses.length === 0) {
    return (
      <Card className="bg-green-500/5 border-green-500/20">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-green-400">
            ✅ No clauses triggered by this scenario. Your contract handles this well!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">{result.scenario.icon}</span>
            <h4 className="text-sm font-semibold">{result.scenario.label}</h4>
            <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-xs ml-auto rounded-full">
              {formatINR(result.totalCurrentCost)}
            </Badge>
          </div>

          {/* Cost breakdown table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-2 text-xs text-slate-900 dark:text-slate-100/40 font-medium">
                    Clause Triggered
                  </th>
                  <th className="text-right py-2 text-xs text-slate-900 dark:text-slate-100/40 font-medium">
                    This Cost
                  </th>
                  <th className="text-right py-2 text-xs text-slate-900 dark:text-slate-100/40 font-medium">
                    Fair Cost
                  </th>
                  <th className="text-right py-2 text-xs text-slate-900 dark:text-slate-100/40 font-medium">
                    Premium
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.triggeredClauses.map((tc, i) => (
                  <tr
                    key={i}
                    className="border-b border-white/[0.03] hover:bg-white dark:bg-slate-900/[0.02] transition-colors"
                  >
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] border-white/10 text-slate-900 dark:text-slate-100/40"
                        >
                          #{tc.clauseNumber}
                        </Badge>
                        <span className="text-xs text-slate-900 dark:text-slate-100/70">
                          {tc.clauseType.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-slate-900 dark:text-slate-100/20">
                          ({LIFE_EVENT_LABELS[tc.triggerEvent] || tc.triggerEvent})
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right text-xs text-red-400 font-medium">
                      {formatINR(tc.currentCost)}
                    </td>
                    <td className="py-2.5 text-right text-xs text-green-400/70">
                      {formatINR(tc.fairCost)}
                    </td>
                    <td className="py-2.5 text-right text-xs text-orange-400 font-medium">
                      {formatINR(tc.predatoryPremium)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/10">
                  <td className="py-3 text-xs font-bold text-slate-900 dark:text-slate-100/80">
                    TOTAL
                  </td>
                  <td className="py-3 text-right text-sm font-bold text-red-400">
                    {formatINR(result.totalCurrentCost)}
                  </td>
                  <td className="py-3 text-right text-sm font-bold text-green-400/70">
                    {formatINR(result.totalFairCost)}
                  </td>
                  <td className="py-3 text-right text-sm font-bold text-orange-400">
                    {formatINR(result.totalPredatoryPremium)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Predatory premium callout */}
          {result.totalPredatoryPremium > 0 && (
            <div className="mt-3 p-3 rounded-xl bg-red-500/5 border border-red-500/15">
              <p className="text-xs text-red-400">
                🔴 Predatory clauses add{" "}
                <strong>{formatINR(result.totalPredatoryPremium)}</strong> of
                unnecessary risk in this scenario
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
