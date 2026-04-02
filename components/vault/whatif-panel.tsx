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
  devastating: { color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
  severe: { color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  moderate: { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  manageable: { color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  minimal: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
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

export function WhatIfPanel({
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
      <div>
        <h4 className="text-base font-black text-slate-900 dark:text-slate-100 mb-4 tracking-tight flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-500" />
          Simulate a Scenario
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {unrunScenarios.map((s) => {
            const Icon = SCENARIO_ICONS[s.value] || Zap;
            const isThisRunning = runningScenario === s.value;

            return (
              <Button
                key={s.value}
                variant="outline"
                size="sm"
                disabled={isRunning}
                onClick={() => runScenario(s.value)}
                className="justify-start gap-2 text-xs font-bold h-auto py-2.5 bg-white dark:bg-card border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 text-slate-600 hover:text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all rounded-xl"
              >
                {isThisRunning ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
                <span className="truncate">{s.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Existing Results */}
      {results.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h4 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Simulation Results
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
                  className={`bg-white dark:bg-card border-slate-200 dark:border-slate-700 hover:border-indigo-300 shadow-sm dark:shadow-slate-900/20 rounded-2xl cursor-pointer transition-all`}
                  onClick={() =>
                    setExpandedScenario(isExpanded ? null : result.scenario)
                  }
                >
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-start md:items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${config.bg}`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-base font-black text-slate-900 dark:text-slate-100 leading-tight">
                          {result.scenario_title}
                        </h5>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <Badge className={`${config.bg} ${config.color} text-[10px] uppercase font-black tracking-widest border-0 px-2 rounded-full`}>
                            {result.overall_severity}
                          </Badge>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline-block">
                            Protection: {result.protection_score}/100
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 flex flex-col items-end">
                        {result.total_financial_impact > 0 && (
                          <p className="text-base font-black text-red-700 tracking-tight">
                            ₹{result.total_financial_impact.toLocaleString("en-IN")}
                          </p>
                        )}
                        <ChevronDown
                          className={`w-5 h-5 text-slate-400 transition-transform mt-1 ${
                            isExpanded ? "rotate-180 text-indigo-500" : ""
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
                          <div className="mt-6 space-y-6">
                            {/* Affected Contracts */}
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold mb-3 uppercase tracking-widest pl-1">
                                Contract Impact
                              </p>
                              <div className="space-y-3">
                                {result.affected_contracts.map((c, i) => {
                                  const impactColors: Record<string, string> = {
                                    terminated: "text-red-700 bg-red-50",
                                    breached: "text-orange-700 bg-orange-50",
                                    modified: "text-yellow-700 bg-yellow-50",
                                    unaffected: "text-emerald-700 bg-emerald-50",
                                  };
                                  const impactColor =
                                    impactColors[c.impact_level] || impactColors.modified;

                                  return (
                                    <div
                                      key={i}
                                      className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4"
                                    >
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                          {c.document_title}
                                        </span>
                                        <Badge className={`${impactColor} text-[9px] uppercase font-black border-0 px-2 rounded-full`}>
                                          {c.impact_level}
                                        </Badge>
                                      </div>
                                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                                        {c.impact_description}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Immediate Actions */}
                            {result.immediate_actions.length > 0 && (
                              <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-4">
                                <p className="text-[10px] text-indigo-700 font-black uppercase tracking-widest mb-3">
                                  ⚡ Immediate Actions
                                </p>
                                <ul className="space-y-2">
                                  {result.immediate_actions.map((a, i) => (
                                    <li
                                      key={i}
                                      className="text-sm font-medium text-indigo-950/80 flex items-start gap-2"
                                    >
                                      <span className="text-indigo-600 font-black mt-0.5">•</span>
                                      {a}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Timeline */}
                            {result.timeline.length > 0 && (
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-1">
                                  Timeline Roadmap
                                </p>
                                <div className="space-y-3 pl-4 border-l-2 border-slate-200 dark:border-slate-700 ml-1">
                                  {result.timeline.map((step, i) => (
                                    <div key={i} className="relative pl-6 py-1">
                                      <div className="absolute -left-[7px] top-2 w-3 h-3 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600" />
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                                        Day {step.day}
                                      </p>
                                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                                        {step.title}
                                      </p>
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
