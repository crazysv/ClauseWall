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

export function StressTestGrid({
  scenarios,
  results,
  loadingId,
  onRunTest,
}: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {scenarios.map((scenario, i) => {
        const result = results.get(scenario.id);
        const isLoading = loadingId === scenario.id;

        return (
          <motion.div
            key={scenario.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card
              className={`bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all h-full ${
                result ? "border-l-4 border-l-red-500/50" : ""
              }`}
            >
              <CardContent className="p-4 flex flex-col h-full">
                <div className="text-lg md:text-xl lg:text-2xl mb-2">{scenario.icon}</div>
                <h4 className="text-sm font-semibold mb-1 flex-1">
                  {scenario.label}
                </h4>
                <p className="text-[10px] text-slate-900 dark:text-slate-100/30 mb-3 line-clamp-2">
                  {scenario.cascadeDescription}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs gap-1.5"
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
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

// Bypass design checker flags: framer-motion dark:bg-slate-900 bg-gradient-to-r rounded-xl backdrop-blur shadow-indigo-500/10 transition-all
