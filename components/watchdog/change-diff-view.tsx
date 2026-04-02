"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DirectionBadge } from "./direction-badge";
import type { SemanticChange } from "@/types";
import { SEVERITY_CONFIG } from "./watchdog-constants";

const changeTypeLabels: Record<string, string> = {
  rights_gained: "Rights Gained",
  rights_lost: "Rights Lost",
  obligation_added: "Obligation Added",
  obligation_removed: "Obligation Removed",
  liability_changed: "Liability Changed",
  data_usage_changed: "Data Usage Changed",
  dispute_resolution_changed: "Dispute Resolution Changed",
  pricing_terms_changed: "Pricing Changed",
  termination_changed: "Termination Changed",
  neutral_clarification: "Clarification",
};

export function ChangeDiffView({ changes }: { changes: SemanticChange[] }) {
  return (
    <div className="space-y-4">
      {changes.map((change, index) => {
        const config = SEVERITY_CONFIG[change.severity] || SEVERITY_CONFIG.minor;

        return (
          <Card key={index} className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 rounded-xl overflow-hidden mb-4">
            {change.severity === "critical" && <div className="h-1 bg-red-600" />}
            {change.severity === "major" && <div className="h-1 bg-amber-500" />}

            <CardContent className="p-5 sm:p-6">
              {/* Header */}
              <div className="flex items-center gap-2.5 flex-wrap mb-4">
                <Badge className={`${config.badgeClass} font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-[10px] shadow-sm dark:shadow-slate-900/20`}>
                  {config.emoji} {config.label}
                </Badge>
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 rounded-md px-2 py-0.5">
                  {changeTypeLabels[change.change_type] || change.change_type}
                </Badge>
                <DirectionBadge direction={change.direction} />
              </div>

              <h4 className="font-black text-slate-900 dark:text-slate-100 text-lg mb-4">{change.section_title}</h4>

              {/* Before / After */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                {change.old_text && (
                  <div className="rounded-xl bg-red-50 border border-red-100 p-4 shadow-sm dark:shadow-slate-900/20">
                    <p className="text-[10px] text-red-600 font-bold mb-2 uppercase tracking-widest">Before</p>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed">
                      {change.old_text}
                    </p>
                  </div>
                )}
                {change.new_text && (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 shadow-sm dark:shadow-slate-900/20">
                    <p className="text-[10px] text-emerald-600 font-bold mb-2 uppercase tracking-widest">After</p>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed">
                      {change.new_text}
                    </p>
                  </div>
                )}
              </div>

              {/* Impact */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-base pt-0.5 drop-shadow-sm dark:shadow-slate-900/20 leading-none">📌</span>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Impact</span>
                    <p className="text-sm font-medium text-slate-700 leading-snug mt-1">{change.user_impact_summary}</p>
                  </div>
                </div>

                {change.legal_implications && change.legal_implications !== "No legal implications." && (
                  <div className="flex items-start gap-3">
                    <span className="text-base pt-0.5 drop-shadow-sm dark:shadow-slate-900/20 leading-none">⚖️</span>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Legal</span>
                      <p className="text-sm font-medium text-amber-700 leading-snug mt-1">{change.legal_implications}</p>
                    </div>
                  </div>
                )}

                {change.affected_user_actions && change.affected_user_actions.length > 0 && (
                  <div className="flex items-start gap-3">
                    <span className="text-base pt-0.5 drop-shadow-sm dark:shadow-slate-900/20 leading-none">👤</span>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Affected Actions</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {change.affected_user_actions.map((action, i) => (
                          <Badge key={i} variant="outline" className="bg-slate-50 dark:bg-slate-800 text-slate-700 border-slate-200 dark:border-slate-700 font-medium px-2 py-0.5 text-[10px] rounded-md shadow-sm dark:shadow-slate-900/20">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confidence */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-end">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Confidence: {Math.round(change.confidence * 100)}%
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
