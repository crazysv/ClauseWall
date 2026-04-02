"use client";

import type { EvidenceItem } from "@/types/evidence";
import { EvidenceTypeIcon } from "./evidence-type-icon";
import { EVIDENCE_TYPE_META } from "@/types/evidence";

export function EvidenceTimeline({ items }: { items: EvidenceItem[] }) {
  const sorted = [...items].sort((a, b) =>
    new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div className="text-center py-6 md:py-8 lg:py-12 text-slate-500 dark:text-slate-400">
        <p className="text-sm font-medium">No evidence items yet. Start adding evidence to build your chain.</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-0">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-indigo-200 via-indigo-100 to-transparent" />

      {sorted.map((item, i) => {
        const meta = EVIDENCE_TYPE_META[item.evidence_type];
        return (
          <div key={item.id} className="relative pb-6 last:pb-0">
            {/* Dot */}
            <div className={`absolute left-[-17px] top-4 h-3 w-3 rounded-full border-2 bg-white dark:bg-slate-900 ${item.is_certified ? "border-emerald-500" : "border-indigo-400"}`} />

            <div className="rounded-2xl bg-white dark:bg-card border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 p-4 ml-6 hover:border-indigo-300 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <EvidenceTypeIcon type={item.evidence_type} className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-black text-slate-900 dark:text-slate-100 leading-tight">{item.title}</span>
                {item.is_certified && <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-700 px-1.5 rounded uppercase font-bold tracking-widest inline-flex pt-0.5 pb-0.5 translate-y-[1px]">65B ✓</span>}
              </div>
              <div className="flex items-center gap-2 text-xs font-bold tracking-wide uppercase text-slate-500 dark:text-slate-400 mt-2">
                <span>{new Date(item.captured_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                <span className="text-slate-300">•</span>
                <span>{meta?.label}</span>
                {item.issue_category && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-amber-600">{item.issue_category}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
