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

export function ComparisonTable({ mismatches }: ComparisonTableProps) {
  if (mismatches.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg shadow-sm dark:shadow-slate-900/20">
        📊 Promise vs. Contract — Side by Side
      </h3>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <th className="py-2.5 px-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 w-8">#</th>
              <th className="py-2.5 px-4 text-left text-[10px] font-bold uppercase tracking-widest text-amber-700">💬 Promise</th>
              <th className="py-2.5 px-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">📄 Contract</th>
              <th className="py-2.5 px-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
              <th className="py-2.5 px-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Clause</th>
            </tr>
          </thead>
          <tbody>
            {mismatches.map((m, i) => (
              <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors">
                <td className="py-4 px-4 text-sm font-bold text-slate-400 align-top">{i + 1}</td>
                <td className="py-4 px-4 align-top max-w-[200px]">
                  <p className="text-sm font-medium text-amber-900 leading-relaxed line-clamp-3">
                    {m.promise_says}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600/60 mt-2">
                    — {m.promise.promised_by}{m.promise.date ? `, ${m.promise.date}` : ""}
                  </p>
                </td>
                <td className="py-4 px-4 align-top max-w-[200px]">
                  <p className="text-sm font-medium text-slate-700 leading-relaxed line-clamp-3">
                    {m.contract_says}
                  </p>
                </td>
                <td className="py-4 px-4 align-top">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm dark:shadow-slate-900/20 ${SEVERITY_DOT[m.severity]}`} />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      {TYPE_LABELS[m.mismatch_type] || m.mismatch_type}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 align-top">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-white dark:bg-card border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md shadow-sm dark:shadow-slate-900/20">
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
