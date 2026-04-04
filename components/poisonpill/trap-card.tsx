"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCcw,
  TrendingUp,
  Link2Off,
  Maximize2,
  FileEdit,
  Wallet,
  Scale,
  ShieldOff,
  MapPin,
  Lock,
  Puzzle,
  ChevronDown,
  AlertTriangle,
  Target,
  Gavel,
} from "lucide-react";
import type { PoisonPillTrap, TrapPatternType, TrapSeverity } from "@/types";
import { TrapMechanismFlow } from "./trap-mechanism-flow";

interface Props {
  trap: PoisonPillTrap;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const PATTERN_ICONS: Record<TrapPatternType, React.ReactNode> = {
  infinite_loop: <RefreshCcw className="w-5 h-5" />,
  escalation_trap: <TrendingUp className="w-5 h-5" />,
  waiver_chain: <Link2Off className="w-5 h-5" />,
  scope_creep: <Maximize2 className="w-5 h-5" />,
  silent_amendment: <FileEdit className="w-5 h-5" />,
  deposit_trap: <Wallet className="w-5 h-5" />,
  termination_asymmetry: <Scale className="w-5 h-5" />,
  insurance_void: <ShieldOff className="w-5 h-5" />,
  jurisdiction_trap: <MapPin className="w-5 h-5" />,
  data_hostage: <Lock className="w-5 h-5" />,
  custom: <Puzzle className="w-5 h-5" />,
};

const SEVERITY_STYLES: Record<
  TrapSeverity,
  { bar: string; badge: string; glow: string }
> = {
  devastating: {
    bar: "bg-purple-500",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/20",
    glow: "shadow-purple-500/10",
  },
  severe: {
    bar: "bg-red-500",
    badge: "bg-red-500/15 text-red-300 border-red-500/20",
    glow: "shadow-red-500/10",
  },
  moderate: {
    bar: "bg-orange-500",
    badge: "bg-orange-500/15 text-orange-300 border-orange-500/20",
    glow: "",
  },
  minor: {
    bar: "bg-yellow-500",
    badge: "bg-yellow-500/15 text-yellow-300 border-yellow-500/20",
    glow: "",
  },
};

const ESCAPE_COLORS: Record<string, string> = {
  impossible: "text-purple-400 bg-purple-500/10",
  very_hard: "text-red-400 bg-red-500/10",
  hard: "text-orange-400 bg-orange-500/10",
  moderate: "text-yellow-400 bg-yellow-500/10",
  easy: "text-green-400 bg-green-500/10",
};

export function TrapCard({ trap, isExpanded, onToggle }: Props) {
  const style = SEVERITY_STYLES[trap.severity];
  const icon = PATTERN_ICONS[trap.pattern_type] || PATTERN_ICONS.custom;

  return (
    <div
      className={`relative overflow-hidden rounded-none border-2 border-foreground bg-background transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none ${
        style.glow ? style.glow : ""
      }`}
    >
      {/* Severity bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.bar}`} />

      {/* Collapsed Header */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4 pl-5 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
      >
        <div
          className={`p-2 rounded-lg ${style.badge.split(" ").slice(0, 1).join(" ")}`}
        >
          <span className={style.badge.split(" ").slice(1, 2).join(" ")}>
            {icon}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-white truncate">
              {trap.trap_name}
            </h3>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-full border capitalize ${style.badge}`}
            >
              {trap.severity}
            </span>
          </div>
          <p className="text-xs text-white/40 mt-0.5 line-clamp-1">
            {trap.title}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Risk amplification */}
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-orange-400">
              {trap.risk_multiplier}x
            </p>
            <p className="text-[9px] text-white/25">amplification</p>
          </div>

          {/* Financial worst case */}
          {trap.financial_worst_case && (
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-red-400">
                ₹{trap.financial_worst_case.toLocaleString("en-IN")}
              </p>
              <p className="text-[9px] text-white/25">at risk</p>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-white/20">
            <span className="text-[10px]">
              {trap.mechanisms.length} clauses
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-5 border-t border-white/5 pt-4">
              {/* Risk Comparison */}
              <div className="flex items-center gap-4 p-3 bg-white/[0.02] rounded-lg">
                <div className="text-center flex-1">
                  <p className="text-[10px] text-white/30 mb-0.5">
                    Individual Risk
                  </p>
                  <p className="text-lg font-bold text-yellow-400">
                    {trap.individual_risk_average}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-orange-400 font-semibold">
                    {trap.risk_multiplier}x →
                  </p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-[10px] text-white/30 mb-0.5">
                    Combined Risk
                  </p>
                  <p className="text-lg font-bold text-red-400">
                    {trap.combined_risk_score}
                  </p>
                </div>
              </div>

              {/* How This Trap Works */}
              <div>
                <h4 className="text-xs font-semibold text-white/60 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                  How This Trap Works
                </h4>
                <p className="text-xs text-white/40 mb-3">
                  {trap.how_it_works}
                </p>
                <TrapMechanismFlow
                  mechanisms={trap.mechanisms}
                  connections={trap.connections}
                />
              </div>

              {/* Real World Impact */}
              <div>
                <h4 className="text-xs font-semibold text-white/60 mb-1.5">
                  Real World Impact
                </h4>
                <p className="text-xs text-white/40">
                  {trap.real_world_impact}
                </p>
                {trap.financial_explanation && (
                  <p className="text-xs text-red-400/60 mt-1 italic">
                    💰 {trap.financial_explanation}
                  </p>
                )}
                {trap.trigger_event && (
                  <p className="text-xs text-orange-400/60 mt-1">
                    ⚡ Trigger: {trap.trigger_event}
                  </p>
                )}
              </div>

              {/* Escape Options */}
              <div>
                <h4 className="text-xs font-semibold text-white/60 mb-1.5 flex items-center gap-2">
                  How to Escape
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                      ESCAPE_COLORS[trap.escape_difficulty] ||
                      "text-white/30 bg-white/5"
                    }`}
                  >
                    {trap.escape_difficulty.replace(/_/g, " ")}
                  </span>
                </h4>
                {trap.escape_options.length > 0 ? (
                  <ul className="space-y-1">
                    {trap.escape_options.map((opt, i) => (
                      <li key={i} className="text-xs text-white/40 flex gap-2">
                        <span className="text-green-400 flex-shrink-0">→</span>
                        {opt}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-white/25 italic">
                    No known escape routes.
                  </p>
                )}
                {trap.legal_citations.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {trap.legal_citations.map((cite, i) => (
                      <span
                        key={i}
                        className="text-[9px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/10"
                      >
                        <Gavel className="w-2.5 h-2.5 inline mr-1" />
                        {cite}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Negotiation */}
              <div className="p-3 bg-green-500/5 border border-green-500/10 rounded-lg">
                <h4 className="text-xs font-semibold text-green-400 mb-1 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  Break This Trap
                </h4>
                <p className="text-xs text-white/50">
                  <span className="text-green-400 font-medium">
                    Target Clause {trap.which_clause_to_target}
                  </span>
                  {" — "}
                  {trap.why_target_this_clause}
                </p>
                <div className="mt-1.5">
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                      trap.negotiation_priority === "must_change"
                        ? "bg-red-500/10 text-red-300"
                        : trap.negotiation_priority === "should_change"
                          ? "bg-yellow-500/10 text-yellow-300"
                          : "bg-green-500/10 text-green-300"
                    }`}
                  >
                    {trap.negotiation_priority.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
