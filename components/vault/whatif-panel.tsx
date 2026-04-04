"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Loader2,
  ChevronDown,
  Briefcase,
  MapPin,
  Heart,
  Baby,
  Stethoscope,
  Building2,
  Home,
  CreditCard,
  Skull,
  GraduationCap,
  Scale,
  CloudRain,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { WhatIfResult, WhatIfScenario } from "@/types";
import { toast } from "sonner";

interface WhatIfPanelProps {
  existingResults: WhatIfResult[];
  documentIds: string[];
}

const SCENARIO_ICONS: Record<string, typeof Zap> = {
  job_loss: Briefcase,
  city_relocation: MapPin,
  marriage: Heart,
  divorce: Heart,
  child_birth: Baby,
  disability: Stethoscope,
  hospitalization: Stethoscope,
  business_start: Building2,
  property_purchase: Home,
  loan_default: CreditCard,
  death: Skull,
  retirement: GraduationCap,
  company_acquisition: Building2,
  lawsuit: Scale,
  natural_disaster: CloudRain,
  custom: Pencil,
};

const SEVERITY_CONFIG = {
  devastating: { color: "text-red-700 dark:text-red-500", bg: "bg-red-100 dark:bg-red-950", border: "border-red-500" },
  severe: { color: "text-orange-700 dark:text-orange-500", bg: "bg-orange-100 dark:bg-orange-950", border: "border-orange-500" },
  moderate: { color: "text-yellow-700 dark:text-yellow-500", bg: "bg-yellow-100 dark:bg-yellow-950", border: "border-yellow-500" },
  manageable: { color: "text-blue-700 dark:text-blue-500", bg: "bg-blue-100 dark:bg-blue-950", border: "border-blue-500" },
  minimal: { color: "text-green-700 dark:text-green-500", bg: "bg-green-100 dark:bg-green-950", border: "border-green-500" },
};

const AVAILABLE_SCENARIOS: { value: WhatIfScenario; label: string }[] = [
  { value: "job_loss", label: "Job Loss" },
  { value: "city_relocation", label: "City Relocation" },
  { value: "marriage", label: "Marriage" },
  { value: "divorce", label: "Divorce" },
  { value: "child_birth", label: "Child Birth" },
  { value: "disability", label: "Permanent Disability" },
  { value: "hospitalization", label: "Extended Hospitalization" },
  { value: "business_start", label: "Starting a Business" },
  { value: "property_purchase", label: "Property Purchase" },
  { value: "loan_default", label: "Loan Default" },
  { value: "death", label: "Death (Dependents)" },
  { value: "retirement", label: "Voluntary Retirement" },
  { value: "company_acquisition", label: "Company Acquisition" },
  { value: "lawsuit", label: "Getting Sued" },
  { value: "natural_disaster", label: "Natural Disaster" },
];

export default function WhatIfPanel({
  existingResults,
  documentIds,
}: WhatIfPanelProps) {
  const [results, setResults] = useState<WhatIfResult[]>(existingResults);
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runningScenario, setRunningScenario] = useState<string | null>(null);

  const runScenario = async (scenario: WhatIfScenario) => {
    // Don't run if already running
    if (isRunning) return;

    setIsRunning(true);
    setRunningScenario(scenario);

    try {
      const res = await fetch("/api/vault/whatif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario,
          document_ids: documentIds,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Scenario simulation failed");
      }

      // Replace existing result for this scenario or add new
      setResults((prev) => {
        const filtered = prev.filter((r) => r.scenario !== scenario);
        return [...filtered, data];
      });

      setExpandedScenario(scenario);
      toast.success(`"${data.scenario_title}" simulated!`);
    } catch (err) {
      console.error("[Vault] What-if failed:", err);
      toast.error("Scenario simulation failed. Please try again.");
    } finally {
      setIsRunning(false);
      setRunningScenario(null);
    }
  };

  const existingScenarios = new Set(results.map((r) => r.scenario));
  const unrunScenarios = AVAILABLE_SCENARIOS.filter(
    (s) => !existingScenarios.has(s.value)
  );

  return (
    <div className="space-y-6">
      {/* Run New Scenario */}
      <div className="border-4 border-black bg-white dark:bg-zinc-900 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h4 className="text-lg font-black uppercase tracking-widest text-foreground mb-6 flex items-center gap-3 border-b-4 border-black pb-4">
          <div className="p-2 border-4 border-black bg-white dark:bg-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Zap className="w-5 h-5 stroke-[3px]" />
          </div>
          SIMULATE A SCENARIO
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {unrunScenarios.map((s) => {
            const Icon = SCENARIO_ICONS[s.value] || Zap;
            const isThisRunning = runningScenario === s.value;

            return (
              <Button
                key={s.value}
                variant="outline"
                disabled={isRunning}
                onClick={() => runScenario(s.value)}
                className="justify-start gap-3 h-auto py-3 px-4 border-4 border-black bg-white dark:bg-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none transition-all font-black uppercase tracking-widest text-xs whitespace-normal text-left"
              >
                {isThisRunning ? (
                  <Loader2 className="w-4 h-4 animate-spin stroke-[3px] flex-shrink-0" />
                ) : (
                  <Icon className="w-4 h-4 stroke-[3px] flex-shrink-0" />
                )}
                <span className="line-clamp-2">{s.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Existing Results */}
      {results.length > 0 && (
        <div className="space-y-6 mt-12">
          <h4 className="text-xl font-black uppercase tracking-widest text-foreground mb-6 flex items-center gap-3">
            <span className="w-8 h-2 bg-black dark:bg-white" />
            SIMULATION RESULTS
          </h4>

          {results.map((result, index) => {
            const config = SEVERITY_CONFIG[result.overall_severity] || SEVERITY_CONFIG.moderate;
            const Icon = SCENARIO_ICONS[result.scenario] || Zap;
            const isExpanded = expandedScenario === result.scenario;

            return (
              <motion.div
                key={result.scenario}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`border-4 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${config.bg} cursor-pointer hover:-translate-y-1 hover:shadow-none transition-all`}
                  onClick={() =>
                    setExpandedScenario(isExpanded ? null : result.scenario)
                  }
                >
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start gap-6 flex-col sm:flex-row">
                      <div className={`p-4 border-4 border-black bg-white dark:bg-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex-shrink-0`}>
                        <Icon className={`w-6 h-6 ${config.color} stroke-[3px]`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xl font-black uppercase tracking-widest text-foreground block mb-3">
                          {result.scenario_title}
                        </h5>
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge className={`px-2 py-1 border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${config.bg} ${config.color} font-black uppercase tracking-widest text-[10px]`}>
                            {result.overall_severity}
                          </Badge>
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-white dark:bg-black px-2 py-1 border-2 border-black inline-flex items-center gap-2">
                            <ShieldCheck className="w-3 h-3" /> PROTECTION {result.protection_score}/100
                          </span>
                        </div>
                      </div>
                      <div className="text-left sm:text-right flex-shrink-0 flex sm:flex-col items-center sm:items-end w-full sm:w-auto mt-4 sm:mt-0 justify-between sm:justify-start">
                        {result.total_financial_impact > 0 && (
                          <p className="text-base font-black tracking-tighter text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950 px-3 py-2 border-4 border-red-500 shadow-[2px_2px_0px_0px_rgba(239,68,68,1)] sm:mb-4">
                            ₹{result.total_financial_impact.toLocaleString("en-IN")}
                          </p>
                        )}
                        <ChevronDown
                          className={`w-6 h-6 stroke-[3px] text-black dark:text-white transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>

                    {/* Expanded Detail */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-8 space-y-8 border-t-4 border-black pt-8">
                            {/* Affected Contracts */}
                            <div>
                              <p className="text-sm font-black uppercase tracking-widest text-foreground mb-4 flex items-center gap-2 border-l-4 border-black pl-3">
                                CONTRACT IMPACT
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {result.affected_contracts.map((c, i) => {
                                  const impactColors: Record<string, string> = {
                                    terminated: "text-red-600 dark:text-red-500 bg-red-100 dark:bg-red-950 border-red-500",
                                    breached: "text-orange-600 dark:text-orange-500 bg-orange-100 dark:bg-orange-950 border-orange-500",
                                    modified: "text-yellow-600 dark:text-yellow-500 bg-yellow-100 dark:bg-yellow-950 border-yellow-500",
                                    unaffected: "text-green-600 dark:text-green-500 bg-green-100 dark:bg-green-950 border-green-500",
                                  };
                                  const impactColor =
                                    impactColors[c.impact_level] || impactColors.modified;

                                  return (
                                    <div
                                      key={i}
                                      className="border-4 border-black bg-white dark:bg-zinc-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                    >
                                      <div className="flex items-start justify-between gap-4 mb-3 border-b-2 border-black pb-2">
                                        <span className="text-sm font-black uppercase tracking-widest text-foreground">
                                          {c.document_title}
                                        </span>
                                        <Badge className={`${impactColor} text-[10px] border-2 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black uppercase tracking-widest flex-shrink-0`}>
                                          {c.impact_level}
                                        </Badge>
                                      </div>
                                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground leading-relaxed">
                                        {c.impact_description}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Immediate Actions */}
                            {result.immediate_actions.length > 0 && (
                              <div className="border-4 border-black bg-indigo-50 dark:bg-indigo-950 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <p className="text-sm font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-400 mb-4 flex items-center gap-2 border-b-4 border-indigo-500 pb-2">
                                  <Zap className="w-5 h-5 stroke-[3px]" /> IMMEDIATE ACTIONS
                                </p>
                                <ul className="space-y-3">
                                  {result.immediate_actions.map((a, i) => (
                                    <li
                                      key={i}
                                      className="text-xs font-bold uppercase tracking-widest text-indigo-900/80 dark:text-indigo-200/80 flex items-start gap-3 leading-relaxed"
                                    >
                                      <span className="text-indigo-600 shrink-0 font-black mt-0.5">•</span>
                                      <span>{a}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Timeline */}
                            {result.timeline.length > 0 && (
                              <div>
                                <p className="text-sm font-black uppercase tracking-widest text-foreground mb-4 flex items-center gap-2 border-l-4 border-black pl-3">
                                  TIMELINE
                                </p>
                                <div className="space-y-6 pl-4 border-l-4 border-black relative">
                                  {result.timeline.map((step, i) => (
                                    <div key={i} className="relative pl-6">
                                      {/* Dot */}
                                      <div className="absolute -left-[26px] top-1 w-6 h-6 border-4 border-black bg-white dark:bg-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
                                      <div className="border-4 border-black bg-white dark:bg-zinc-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] inline-block">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                                          DAY {step.day}
                                        </p>
                                        <p className="text-sm font-bold uppercase tracking-widest text-foreground">
                                          {step.title}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
