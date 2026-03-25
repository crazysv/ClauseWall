"use client";

import type { ContractMismatch, MismatchSeverity } from "@/types";

interface ComparisonTableProps {
  mismatches: ContractMismatch[];
}

const SEVERITY_DOT: Record<MismatchSeverity, string> = {
  critical: "bg-red-500",
  major: "bg-orange-500",
  minor: "bg-yellow-500",
  info: "bg-blue-500",
};

const TYPE_LABELS: Record<string, string> = {
  direct_contradiction: "Contradicted",
  missing_promise: "Missing",
  weakened_promise: "Weakened",
  hidden_condition: "Hidden",
  amount_mismatch: "Amount ≠",
  timeline_mismatch: "Timeline ≠",
  scope_mismatch: "Scope ≠",
};

export default function ComparisonTable({ mismatches }: ComparisonTableProps) {
  if (mismatches.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-white/60">
        📊 Promise vs. Contract — Side by Side
      </h3>

      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="py-2 px-3 text-left text-xs font-medium text-white/40 w-8">#</th>
              <th className="py-2 px-3 text-left text-xs font-medium text-amber-400/60">💬 Promise</th>
              <th className="py-2 px-3 text-left text-xs font-medium text-slate-400/60">📄 Contract</th>
              <th className="py-2 px-3 text-left text-xs font-medium text-white/40">Status</th>
              <th className="py-2 px-3 text-left text-xs font-medium text-white/40">Clause</th>
            </tr>
          </thead>
          <tbody>
            {mismatches.map((m, i) => (
              <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="py-3 px-3 text-xs text-white/30 align-top">{i + 1}</td>
                <td className="py-3 px-3 align-top max-w-[200px]">
                  <p className="text-sm text-amber-200/80 leading-relaxed line-clamp-3">
                    {m.promise_says}
                  </p>
                  <p className="text-[10px] text-white/20 mt-1">
                    — {m.promise.promised_by}{m.promise.date ? `, ${m.promise.date}` : ""}
                  </p>
                </td>
                <td className="py-3 px-3 align-top max-w-[200px]">
                  <p className="text-sm text-slate-300/70 leading-relaxed line-clamp-3">
                    {m.contract_says}
                  </p>
                </td>
                <td className="py-3 px-3 align-top">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${SEVERITY_DOT[m.severity]}`} />
                    <span className="text-xs text-white/50 whitespace-nowrap">
                      {TYPE_LABELS[m.mismatch_type] || m.mismatch_type}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-3 align-top">
                  <span className="text-xs text-white/30">
                    {m.clause_number ? `#${m.clause_number}` : "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
