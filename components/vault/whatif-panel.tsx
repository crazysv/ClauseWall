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
  devastating: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  severe: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  moderate: { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  manageable: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  minimal: { color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
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
      <div>
        <h4 className="text-sm font-semibold text-white/50 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Simulate a Scenario
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
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
                className="justify-start gap-2 text-xs h-auto py-2 bg-white/[0.02] border-white/10 hover:bg-white/[0.06] text-white/60 hover:text-white"
              >
                {isThisRunning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
                <span className="truncate">{s.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Existing Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white/50">
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
                  className={`${config.bg} ${config.border} cursor-pointer hover:brightness-110 transition-all`}
                  onClick={() =>
                    setExpandedScenario(isExpanded ? null : result.scenario)
                  }
                >
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${config.bg}`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-semibold text-white">
                          {result.scenario_title}
                        </h5>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge className={`${config.bg} ${config.color} text-[10px] border-0`}>
                            {result.overall_severity}
                          </Badge>
                          <span className="text-[10px] text-white/30">
                            Protection: {result.protection_score}/100
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {result.total_financial_impact > 0 && (
                          <p className="text-sm font-bold text-red-400">
                            ₹{result.total_financial_impact.toLocaleString("en-IN")}
                          </p>
                        )}
                        <ChevronDown
                          className={`w-4 h-4 text-white/30 transition-transform mt-1 ml-auto ${
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
                          <div className="mt-4 space-y-4">
                            {/* Affected Contracts */}
                            <div>
                              <p className="text-[10px] text-white/40 mb-2 uppercase tracking-wider">
                                Contract Impact
                              </p>
                              <div className="space-y-2">
                                {result.affected_contracts.map((c, i) => {
                                  const impactColors: Record<string, string> = {
                                    terminated: "text-red-400 bg-red-500/10",
                                    breached: "text-orange-400 bg-orange-500/10",
                                    modified: "text-yellow-400 bg-yellow-500/10",
                                    unaffected: "text-green-400 bg-green-500/10",
                                  };
                                  const impactColor =
                                    impactColors[c.impact_level] || impactColors.modified;

                                  return (
                                    <div
                                      key={i}
                                      className="rounded-lg bg-white/[0.03] border border-white/5 p-3"
                                    >
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs text-white/60">
                                          {c.document_title}
                                        </span>
                                        <Badge className={`${impactColor} text-[9px] border-0`}>
                                          {c.impact_level}
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-white/50">
                                        {c.impact_description}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Immediate Actions */}
                            {result.immediate_actions.length > 0 && (
                              <div className="rounded-lg bg-indigo-500/5 border border-indigo-500/10 p-3">
                                <p className="text-[10px] text-indigo-400 font-medium mb-2">
                                  ⚡ Immediate Actions
                                </p>
                                <ul className="space-y-1">
                                  {result.immediate_actions.map((a, i) => (
                                    <li
                                      key={i}
                                      className="text-xs text-white/60 flex items-start gap-2"
                                    >
                                      <span className="text-indigo-400 mt-0.5">•</span>
                                      {a}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Timeline */}
                            {result.timeline.length > 0 && (
                              <div>
                                <p className="text-[10px] text-white/40 mb-2 uppercase tracking-wider">
                                  Timeline
                                </p>
                                <div className="space-y-1 pl-3 border-l-2 border-white/10">
                                  {result.timeline.map((step, i) => (
                                    <div key={i} className="relative pl-4 py-1.5">
                                      <div className="absolute -left-[5px] top-3 w-2 h-2 rounded-full bg-white/20" />
                                      <p className="text-[10px] text-white/30">
                                        Day {step.day}
                                      </p>
                                      <p className="text-xs text-white/70">
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
