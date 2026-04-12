"use client";

import { motion } from "framer-motion";
import { Loader2, Play } from "lucide-react";
import type { StressScenario, StressTestResult } from "@/lib/simulation/types";

interface Props {
  scenarios: StressScenario[];
  results: Map<string, StressTestResult>;
  loadingId: string | null;
  onRunTest: (scenarioId: string) => void;
}

export default function StressTestGrid({
  scenarios,
  results,
  loadingId,
  onRunTest,
}: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {scenarios.map((scenario, i) => {
        const result = results.get(scenario.id);
        const isLoading = loadingId === scenario.id;

        return (
          <motion.div
            key={scenario.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex flex-col h-full"
          >
            <div
              className={`flex-1 flex flex-col p-5 bg-[#050505] border transition-all ${
                result
                  ? "border-l-4 border-l-red-500 border-neutral-900"
                  : "border-neutral-900 hover:border-neutral-700"
              }`}
            >
              <div className="text-3xl mb-3 opacity-80">{scenario.icon}</div>
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-300 mb-2">
                [{scenario.label}]
              </h4>
              <p className="text-[9px] font-mono text-neutral-500 mb-5 flex-1 leading-snug">
                {scenario.cascadeDescription}
              </p>
              <button
                className={`w-full h-[40px] border flex items-center justify-center gap-2 font-mono uppercase tracking-widest text-[9px] transition-colors rounded-sm ${
                  isLoading
                    ? "bg-neutral-900 border-neutral-800 text-neutral-500"
                    : result
                    ? "bg-red-950/20 border-red-900/50 text-red-500 hover:bg-red-900/40"
                    : "bg-[#0a0a0a] border-neutral-800 text-neutral-400 hover:text-white"
                }`}
                onClick={() => onRunTest(scenario.id)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 text-cyan-500 animate-spin" />
                    [EXECUTING]
                  </>
                ) : result ? (
                  "[RE-RUN SEQUENCE] ▶"
                ) : (
                  <>
                    <Play className="h-3 w-3" />
                    [RUN SEQUENCE]
                  </>
                )}
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
