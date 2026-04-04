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
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No evidence items yet. Start adding evidence to build your chain.</p>
      </div>
    );
  }

  return (
    <div className="relative pl-8 space-y-4 pt-4 border-l-4 border-black ml-4">
      {sorted.map((item, i) => {
        const meta = EVIDENCE_TYPE_META[item.evidence_type];
        return (
          <div key={item.id} className="relative pb-2">
            {/* Dot */}
            <div className={`absolute -left-[42px] top-4 h-4 w-4 rounded-full border-4 border-black ${item.is_certified ? "bg-emerald-500" : "bg-blue-500"}`} />

            <div className="border-4 border-black bg-white dark:bg-zinc-900 p-4 ml-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none transition-all duration-200">
              <div className="flex items-center gap-3 mb-2">
                <EvidenceTypeIcon type={item.evidence_type} className="h-6 w-6 text-black dark:text-white stroke-[3px]" />
                <span className="text-lg font-black uppercase tracking-widest text-foreground">{item.title}</span>
                {item.is_certified && <span className="text-xs font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100 px-2 py-0.5 border-2 border-black ml-2">65B ✓</span>}
              </div>
              <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-muted-foreground mt-3 pt-3 border-t-2 border-dashed border-black">
                <span>{new Date(item.captured_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                <span className="text-black">•</span>
                <span>{meta?.label}</span>
                {item.issue_category && (
                  <>
                    <span className="text-black">•</span>
                    <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 px-2 py-0.5 border-2 border-black">{item.issue_category}</span>
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
