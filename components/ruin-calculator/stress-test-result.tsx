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

export default function StressTestResultView({ result }: Props) {
  if (result.triggeredClauses.length === 0) {
    return (
      <div className="card-impact p-6 bg-green-50 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
        <p className="text-sm font-black uppercase tracking-widest text-green-700">
          ✅ No clauses triggered by this scenario. Your contract handles this well!
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-impact p-6 bg-white border-4 border-black border-t-0 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
    >
      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b-4 border-black">
          <span className="text-2xl p-2 bg-black">{result.scenario.icon}</span>
          <h4 className="text-xl font-black uppercase tracking-tight text-black">{result.scenario.label}</h4>
          <span className="ml-auto inline-block bg-red-600 text-white font-black uppercase tracking-widest px-4 py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shadow-black">
            {formatINR(result.totalCurrentCost)}
          </span>
        </div>

        {/* Cost breakdown table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-4 border-black">
                <th className="text-left py-3 text-xs font-black text-black uppercase tracking-widest">
                  Clause Triggered
                </th>
                <th className="text-right py-3 text-xs font-black text-black uppercase tracking-widest">
                  This Cost
                </th>
                <th className="text-right py-3 text-xs font-black text-black uppercase tracking-widest">
                  Fair Cost
                </th>
                <th className="text-right py-3 text-xs font-black text-black uppercase tracking-widest">
                  Premium
                </th>
              </tr>
            </thead>
            <tbody>
              {result.triggeredClauses.map((tc, i) => (
                <tr
                  key={i}
                  className="border-b-2 border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <span className="font-black font-mono text-sm bg-black text-white px-2 py-1">
                        #{tc.clauseNumber}
                      </span>
                      <span className="text-sm font-bold uppercase tracking-widest text-black">
                        {tc.clauseType.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-black/50 bg-gray-200 px-2 py-1">
                        ({LIFE_EVENT_LABELS[tc.triggerEvent] || tc.triggerEvent})
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-right text-sm font-black text-red-600">
                    {formatINR(tc.currentCost)}
                  </td>
                  <td className="py-4 text-right text-sm font-bold text-green-600">
                    {formatINR(tc.fairCost)}
                  </td>
                  <td className="py-4 text-right text-sm font-black text-orange-600">
                    {formatINR(tc.predatoryPremium)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-4 border-black bg-gray-50">
                <td className="py-4 px-2 text-sm font-black uppercase tracking-widest text-black">
                  TOTAL
                </td>
                <td className="py-4 px-2 text-right text-lg font-black text-red-600">
                  {formatINR(result.totalCurrentCost)}
                </td>
                <td className="py-4 px-2 text-right text-lg font-black text-green-600">
                  {formatINR(result.totalFairCost)}
                </td>
                <td className="py-4 px-2 text-right text-lg font-black text-orange-600">
                  {formatINR(result.totalPredatoryPremium)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Predatory premium callout */}
        {result.totalPredatoryPremium > 0 && (
          <div className="mt-6 p-4 bg-red-100 border-4 border-red-600 shadow-[4px_4px_0px_0px_var(--tw-shadow-color)] shadow-red-600">
            <p className="text-sm font-black uppercase tracking-widest text-red-900">
              🔴 Predatory clauses add{" "}
              <strong className="text-red-700">{formatINR(result.totalPredatoryPremium)}</strong> of
              unnecessary risk in this scenario
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
