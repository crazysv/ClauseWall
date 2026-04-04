"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
              className={`flex-1 flex flex-col p-5 bg-white border-4 border-black transition-all ${
                result
                  ? "border-l-8 border-l-red-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              }`}
            >
              <div className="text-3xl mb-3">{scenario.icon}</div>
              <h4 className="text-sm font-black uppercase tracking-widest text-black mb-2">
                {scenario.label}
              </h4>
              <p className="text-xs font-bold text-black/60 mb-5 flex-1 leading-snug">
                {scenario.cascadeDescription}
              </p>
              <Button
                variant="outline"
                className="w-full h-[40px] rounded-none border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all font-black uppercase tracking-wider text-[10px] gap-2"
                onClick={() => onRunTest(scenario.id)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Running...
                  </>
                ) : result ? (
                  "Re-run ▶"
                ) : (
                  <>
                    <Play className="h-3 w-3" />
                    Run
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
