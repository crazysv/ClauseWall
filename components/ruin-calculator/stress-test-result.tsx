"use client";

import { motion } from "framer-motion";
import type { StressTestResult } from "@/lib/simulation/types";
import { formatINR } from "@/lib/simulation/formatters";
import { LIFE_EVENT_LABELS } from "@/lib/simulation/stress-test-engine";

interface Props {
  result: StressTestResult;
}

export default function StressTestResultView({ result }: Props) {
  if (result.triggeredClauses.length === 0) {
    return (
      <div className="p-6 border border-emerald-900/50 bg-emerald-950/10 text-center rounded-sm">
        <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-500">
          [NO CLAUSES TRIGGERED] // YOUR CONTRACT HANDLES THIS WELL
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-[#050505] border border-neutral-900 border-t-0 rounded-b-sm"
    >
      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-800">
          <span className="text-sm p-1.5 bg-[#0a0a0a] border border-neutral-800 rounded-sm opacity-80">{result.scenario.icon}</span>
          <h4 className="text-sm font-mono uppercase tracking-widest text-neutral-300">
            [{result.scenario.label}]
          </h4>
          <span className="ml-auto inline-block bg-red-950/20 text-red-500 font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 border border-red-900/50 rounded-sm">
            {formatINR(result.totalCurrentCost)}
          </span>
        </div>

        {/* Cost breakdown table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left py-3 text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
                  [CLAUSE TRIGGERED]
                </th>
                <th className="text-right py-3 text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
                  [THIS COST]
                </th>
                <th className="text-right py-3 text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
                  [FAIR COST]
                </th>
                <th className="text-right py-3 text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
                  [PREMIUM]
                </th>
              </tr>
            </thead>
            <tbody>
              {result.triggeredClauses.map((tc, i) => (
                <tr
                  key={i}
                  className="border-b border-neutral-900 hover:bg-[#0a0a0a] transition-colors group"
                >
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[9px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded-sm">
                        #{tc.clauseNumber}
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-300">
                        {tc.clauseType.replace(/_/g, " ")}
                      </span>
                      <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        //{LIFE_EVENT_LABELS[tc.triggerEvent] || tc.triggerEvent}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-right text-[10px] font-mono text-red-500">
                    {formatINR(tc.currentCost)}
                  </td>
                  <td className="py-4 text-right text-[10px] font-mono text-emerald-500">
                    {formatINR(tc.fairCost)}
                  </td>
                  <td className="py-4 text-right text-[10px] font-mono text-orange-500">
                    {formatINR(tc.predatoryPremium)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-neutral-800 bg-[#0a0a0a]">
                <td className="py-4 px-2 text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                  [TOTAL]
                </td>
                <td className="py-4 px-2 text-right text-[11px] font-mono text-red-500">
                  {formatINR(result.totalCurrentCost)}
                </td>
                <td className="py-4 px-2 text-right text-[11px] font-mono text-emerald-500">
                  {formatINR(result.totalFairCost)}
                </td>
                <td className="py-4 px-2 text-right text-[11px] font-mono text-orange-500">
                  {formatINR(result.totalPredatoryPremium)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Predatory premium callout */}
        {result.totalPredatoryPremium > 0 && (
          <div className="mt-6 p-4 bg-red-950/20 border border-red-900/50 rounded-sm">
            <p className="text-[10px] font-mono uppercase tracking-widest text-red-500">
              [WARNING] // PREDATORY CLAUSES ADD{" "}
              <strong className="text-red-400">
                {formatINR(result.totalPredatoryPremium)}
              </strong>{" "}
              OF UNNECESSARY RISK IN THIS SCENARIO
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
