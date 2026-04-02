"use client";

import { motion } from "framer-motion";
import type { TrapMechanism, ClauseConnection, RiskLevel } from "@/types";

interface Props {
  mechanisms: TrapMechanism[];
  connections: ClauseConnection[];
}

const RISK_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  safe: { bg: "bg-green-500/10", text: "text-green-400", label: "Safe" },
  warning: { bg: "bg-yellow-500/10", text: "text-yellow-400", label: "Warning" },
  dangerous: { bg: "bg-red-500/10", text: "text-red-400", label: "Dangerous" },
  illegal: { bg: "bg-indigo-500/10", text: "text-purple-400", label: "Illegal" },
};

const CONNECTION_COLORS: Record<string, string> = {
  enables: "text-blue-400",
  amplifies: "text-orange-400",
  blocks_escape: "text-red-400",
  triggers: "text-purple-400",
  compounds: "text-red-500",
  overrides: "text-slate-400",
  references: "text-slate-500",
  depends_on: "text-blue-300",
};

export function TrapMechanismFlow({ mechanisms, connections }: Props) {
  const sorted = [...mechanisms].sort((a, b) => a.step_number - b.step_number);

  return (
    <div className="space-y-2">
      {sorted.map((mech, idx) => {
        // Find outgoing connection to next mechanism
        const nextMech = sorted[idx + 1];
        const connection = nextMech
          ? connections.find(
              (c) =>
                c.from_clause_number === mech.clause_number &&
                c.to_clause_number === nextMech.clause_number
            ) ||
            connections.find(
              (c) =>
                c.from_clause_number === nextMech.clause_number &&
                c.to_clause_number === mech.clause_number
            )
          : null;

        const risk = RISK_BADGE[mech.individual_risk] || RISK_BADGE.warning;

        return (
          <motion.div
            key={mech.clause_number}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.12 }}
          >
            {/* Mechanism Card */}
            <div className="flex gap-3 items-start">
              {/* Step Number */}
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-500/15 flex items-center justify-center">
                <span className="text-[10px] font-bold text-purple-300">
                  {mech.step_number}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 border-l-4 border-indigo-500 border border-white/5 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Clause {mech.clause_number}
                  </span>
                  <span className="text-[10px] text-slate-900 dark:text-slate-100 capitalize">
                    {mech.clause_type.replace(/_/g, " ")}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full ${risk.bg} ${risk.text}`}
                  >
                    {risk.label}
                  </span>
                </div>

                {mech.clause_text_snippet && (
                  <p className="text-[11px] text-slate-900 dark:text-slate-100 mb-1.5 line-clamp-2 italic">
                    &ldquo;{mech.clause_text_snippet}&rdquo;
                  </p>
                )}

                <p className="text-xs text-slate-900 dark:text-slate-100">
                  <span className="text-slate-900 dark:text-slate-100">Role: </span>
                  {mech.role_in_trap}
                </p>
                <p className="text-xs text-slate-900 dark:text-slate-100 mt-0.5">
                  <span className="text-slate-900 dark:text-slate-100">Contribution: </span>
                  {mech.contribution_to_trap}
                </p>
              </div>
            </div>

            {/* Connection Arrow */}
            {connection && (
              <div className="flex items-center ml-3.5 my-1">
                <div className="w-px h-4 bg-white dark:bg-slate-900/10 ml-[10px]" />
                <span
                  className={`text-[9px] ml-3 ${ CONNECTION_COLORS[connection.connection_type] || "text-slate-900 dark:text-slate-100" }`}
                >
                  ↓ {connection.connection_type.replace(/_/g, " ")}
                </span>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
