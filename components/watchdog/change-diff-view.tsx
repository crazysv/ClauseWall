"use client";

import DirectionBadge from "./direction-badge";
import type { SemanticChange } from "@/types";
import { AlertCircle, Target, Fingerprint, MapPin, Activity, Scale, Users } from "lucide-react";

const severityConfig: Record<
  string,
  { color: string; label: string; border: string; glow: string; icon: any }
> = {
  critical: {
    color: "text-red-500",
    label: "CRITICAL",
    border: "border-red-900/50",
    glow: "shadow-[0_0_15px_rgba(239,68,68,0.15)]",
    icon: AlertCircle
  },
  major: {
    color: "text-amber-500",
    label: "MAJOR",
    border: "border-amber-900/50",
    glow: "",
    icon: Target
  },
  minor: {
    color: "text-cyan-500",
    label: "MINOR",
    border: "border-cyan-900/50",
    glow: "",
    icon: Activity
  },
  cosmetic: {
    color: "text-neutral-500",
    label: "COSMETIC",
    border: "border-neutral-800",
    glow: "",
    icon: Fingerprint
  },
};

const changeTypeLabels: Record<string, string> = {
  rights_gained: "RIGHTS_GAINED",
  rights_lost: "RIGHTS_LOST",
  obligation_added: "OBLIGATION_ADDED",
  obligation_removed: "OBLIGATION_REMOVED",
  liability_changed: "LIABILITY_CHANGED",
  data_usage_changed: "DATA_USAGE_CHANGED",
  dispute_resolution_changed: "DISPUTE_RESOLUTION_CHANGED",
  pricing_terms_changed: "PRICING_CHANGED",
  termination_changed: "TERMINATION_CHANGED",
  neutral_clarification: "CLARIFICATION",
};

export default function ChangeDiffView({
  changes,
}: {
  changes: SemanticChange[];
}) {
  return (
    <div className="space-y-6">
      {changes.map((change, index) => {
        const config = severityConfig[change.severity] || severityConfig.minor;
        const Icon = config.icon;

        return (
          <div
            key={index}
            className={`bg-[#0a0a0a] border ${config.border} ${config.glow} relative`}
          >
            {/* Top Indicator Line */}
            {change.severity === "critical" && (
              <div className="absolute top-0 inset-x-0 h-[1px] bg-red-500" />
            )}
            {change.severity === "major" && (
              <div className="absolute top-0 inset-x-0 h-[1px] bg-amber-500" />
            )}

            <div className="p-5 md:p-6">
              {/* Header */}
              <div className="flex items-center gap-3 flex-wrap mb-4">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 border text-[9px] font-mono uppercase tracking-widest ${config.color} ${config.border} bg-[#050505]`}>
                  <Icon className="h-3 w-3" />
                  [ {config.label} ]
                </span>
                
                <span className="text-[9px] font-mono uppercase tracking-widest border border-neutral-800 text-neutral-400 bg-[#050505] px-2 py-0.5">
                  {changeTypeLabels[change.change_type] || change.change_type}
                </span>

                <DirectionBadge direction={change.direction} />
              </div>

              <h4 className="text-sm font-mono text-neutral-200 mb-5 uppercase tracking-wide border-l-2 border-neutral-800 pl-3">
                {change.section_title}
              </h4>

              {/* Before / After Diff Board */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-900 border border-neutral-900 mb-6 font-mono">
                {change.old_text && (
                  <div className="bg-[#050505] p-4 relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-red-900/50" />
                    <p className="text-[9px] text-red-500/70 mb-2 uppercase tracking-widest flex items-center gap-2">
                       <span className="line-through">[- PREVIOUS_STATE]</span>
                    </p>
                    <p className="text-[11px] text-neutral-400 leading-relaxed pl-2 z-10">
                      {change.old_text}
                    </p>
                  </div>
                )}
                {change.new_text && (
                  <div className="bg-[#050505] p-4 relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-emerald-900/50" />
                    <p className="text-[9px] text-emerald-500/70 mb-2 uppercase tracking-widest flex items-center gap-2">
                      <span>[+ CURRENT_STATE]</span>
                    </p>
                    <p className="text-[11px] text-neutral-300 leading-relaxed pl-2 z-10">
                      {change.new_text}
                    </p>
                  </div>
                )}
              </div>

              {/* Impact / Telemetry Specs */}
              <div className="space-y-4 border-t border-neutral-900 pt-5">
                <div className="flex items-start gap-3">
                   <Target className="h-4 w-4 text-cyan-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] font-mono text-cyan-600 uppercase tracking-widest block mb-1">
                      [ PRIMARY IMPACT VECTOR ]
                    </span>
                    <p className="text-[11px] font-mono text-neutral-300 leading-relaxed">
                      {change.user_impact_summary}
                    </p>
                  </div>
                </div>

                {change.legal_implications && change.legal_implications !== "No legal implications." && (
                  <div className="flex items-start gap-3">
                    <Scale className="h-4 w-4 text-amber-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] font-mono text-amber-600 uppercase tracking-widest block mb-1">
                        [ LEGAL IMPLICATIONS ]
                      </span>
                      <p className="text-[11px] font-mono text-amber-500/80 leading-relaxed">
                        {change.legal_implications}
                      </p>
                    </div>
                  </div>
                )}

                {change.affected_user_actions && change.affected_user_actions.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Users className="h-4 w-4 text-neutral-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block mb-2">
                        [ AFFECTED USER ACTIONS ]
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {change.affected_user_actions.map((action, i) => (
                          <span
                            key={i}
                            className="text-[9px] font-mono border border-neutral-800 bg-[#050505] text-neutral-400 px-1.5 py-0.5 uppercase tracking-wider"
                          >
                            {action}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confidence Readout */}
              <div className="mt-6 pt-4 border-t border-neutral-900 flex items-center justify-end">
                <span className="text-[9px] font-mono text-neutral-600 uppercase tracking-widest">
                  SYS.CONFIDENCE_INTERVAL: {Math.round(change.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
