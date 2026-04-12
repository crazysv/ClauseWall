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
  devastating: {
    color: "text-red-500",
    bg: "bg-red-950/20",
    border: "border-red-900/50",
  },
  severe: {
    color: "text-orange-500",
    bg: "bg-orange-950/20",
    border: "border-orange-900/50",
  },
  moderate: {
    color: "text-amber-500",
    bg: "bg-amber-950/20",
    border: "border-amber-900/50",
  },
  manageable: {
    color: "text-cyan-500",
    bg: "bg-cyan-950/20",
    border: "border-cyan-900/50",
  },
  minimal: {
    color: "text-emerald-500",
    bg: "bg-emerald-950/20",
    border: "border-emerald-900/50",
  },
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
    (s) => !existingScenarios.has(s.value),
  );

  return (
    <div className="space-y-6">
      {/* Run New Scenario */}
      <div className="border border-neutral-900 bg-[#0a0a0a] p-6">
        <h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-6 flex items-center gap-3 border-b border-neutral-900 pb-4">
          <div className="p-1.5 border border-neutral-800 bg-[#050505]">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
          </div>
          SIMULATE_SCENARIO
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
          {unrunScenarios.map((s) => {
            const Icon = SCENARIO_ICONS[s.value] || Zap;
            const isThisRunning = runningScenario === s.value;

            return (
              <button
                key={s.value}
                disabled={isRunning}
                onClick={() => runScenario(s.value)}
                className="flex items-center gap-2 h-auto py-2.5 px-3 border border-neutral-800 bg-[#050505] transition-colors font-mono uppercase tracking-widest text-[9px] text-neutral-500 hover:text-neutral-200 hover:border-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed text-left"
              >
                {isThisRunning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0 text-cyan-500" />
                ) : (
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                )}
                <span className="line-clamp-2">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Existing Results */}
      {results.length > 0 && (
        <div className="space-y-6 mt-6">
          <h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-3">
            <span className="w-6 h-[1px] bg-neutral-700" />
            SIMULATION_RESULTS
          </h4>

          {results.map((result, index) => {
            const config =
              SEVERITY_CONFIG[result.overall_severity] ||
              SEVERITY_CONFIG.moderate;
            const Icon = SCENARIO_ICONS[result.scenario] || Zap;
            const isExpanded = expandedScenario === result.scenario;

            return (
              <motion.div
                key={result.scenario}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div
                  className={`border ${config.border} ${config.bg} cursor-pointer hover:border-neutral-600 transition-colors`}
                  onClick={() =>
                    setExpandedScenario(isExpanded ? null : result.scenario)
                  }
                >
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start gap-4 flex-col sm:flex-row">
                      <div
                        className="p-2 border border-neutral-800 bg-[#050505] flex-shrink-0"
                      >
                        <Icon
                          className={`w-5 h-5 ${config.color}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-mono uppercase tracking-widest text-neutral-200 mb-3">
                          {result.scenario_title}
                        </h5>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 border ${config.border} ${config.color}`}
                          >
                            {result.overall_severity}
                          </span>
                          <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 bg-neutral-900 px-1.5 py-0.5 border border-neutral-800 inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> PROTECTION{" "}
                            {result.protection_score}/100
                          </span>
                        </div>
                      </div>
                      <div className="text-left sm:text-right flex-shrink-0 flex sm:flex-col items-center sm:items-end w-full sm:w-auto mt-3 sm:mt-0 justify-between sm:justify-start">
                        {result.total_financial_impact > 0 && (
                          <span className="text-xs font-mono text-red-500 border border-red-900/50 bg-red-950/20 px-2 py-1 sm:mb-3">
                            ₹
                            {result.total_financial_impact.toLocaleString(
                              "en-IN",
                            )}
                          </span>
                        )}
                        <ChevronDown
                          className={`w-4 h-4 text-neutral-600 transition-transform ${
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
                          <div className="mt-6 space-y-6 border-t border-neutral-900 pt-6">
                            {/* Affected Contracts */}
                            <div>
                              <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2 border-l-2 border-neutral-700 pl-3">
                                CONTRACT_IMPACT
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {result.affected_contracts.map((c, i) => {
                                  const impactColors: Record<string, string> = {
                                    terminated:
                                      "text-red-500 bg-red-950/20 border-red-900/50",
                                    breached:
                                      "text-orange-500 bg-orange-950/20 border-orange-900/50",
                                    modified:
                                      "text-amber-500 bg-amber-950/20 border-amber-900/50",
                                    unaffected:
                                      "text-emerald-500 bg-emerald-950/20 border-emerald-900/50",
                                  };
                                  const impactColor =
                                    impactColors[c.impact_level] ||
                                    impactColors.modified;

                                  return (
                                    <div
                                      key={i}
                                      className="border border-neutral-900 bg-[#050505] p-4"
                                    >
                                      <div className="flex items-start justify-between gap-3 mb-3 border-b border-neutral-900 pb-2">
                                        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-300">
                                          {c.document_title}
                                        </span>
                                        <span
                                          className={`${impactColor} text-[8px] border font-mono uppercase tracking-widest flex-shrink-0 px-1.5 py-0.5`}
                                        >
                                          {c.impact_level}
                                        </span>
                                      </div>
                                      <p className="text-[9px] font-mono text-neutral-500 leading-relaxed">
                                        {c.impact_description}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Immediate Actions */}
                            {result.immediate_actions.length > 0 && (
                              <div className="border-l-2 border-indigo-900/50 bg-indigo-950/10 p-5">
                                <p className="text-[9px] font-mono uppercase tracking-widest text-indigo-400 mb-4 flex items-center gap-2 border-b border-indigo-900/30 pb-2">
                                  <Zap className="w-3.5 h-3.5" />{" "}
                                  IMMEDIATE_ACTIONS
                                </p>
                                <ul className="space-y-2">
                                  {result.immediate_actions.map((a, i) => (
                                    <li
                                      key={i}
                                      className="text-[9px] font-mono text-indigo-300/80 flex items-start gap-3 leading-relaxed"
                                    >
                                      <span className="text-indigo-600 shrink-0 mt-0.5">
                                        →
                                      </span>
                                      <span>{a}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Timeline */}
                            {result.timeline.length > 0 && (
                              <div>
                                <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2 border-l-2 border-neutral-700 pl-3">
                                  TIMELINE
                                </p>
                                <div className="space-y-3 pl-4 border-l border-neutral-800 relative">
                                  {result.timeline.map((step, i) => (
                                    <div key={i} className="relative pl-6">
                                      {/* Node */}
                                      <div className="absolute -left-[9px] top-2 w-4 h-4 border border-neutral-700 bg-[#0a0a0a]" />
                                      <div className="border border-neutral-900 bg-[#050505] p-4 inline-block">
                                        <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 mb-1">
                                          DAY_{step.day}
                                        </p>
                                        <p className="text-[10px] font-mono text-neutral-400">
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
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
