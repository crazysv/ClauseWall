"use client";

import type { EvidenceItem } from "@/types/evidence";
import { EvidenceTypeIcon } from "./evidence-type-icon";
import { EVIDENCE_TYPE_META } from "@/types/evidence";

export function EvidenceTimeline({ items }: { items: EvidenceItem[] }) {
  const sorted = [...items].sort(
    (a, b) =>
      new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime(),
  );

  if (sorted.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600">
          NO EVIDENCE ITEMS YET. START ADDING EVIDENCE TO BUILD YOUR CHAIN.
        </p>
      </div>
    );
  }

  return (
    <div className="relative pl-8 space-y-3 pt-4 border-l border-neutral-800 ml-4">
      {sorted.map((item, i) => {
        const meta = EVIDENCE_TYPE_META[item.evidence_type];
        return (
          <div key={item.id} className="relative pb-1">
            {/* Dot */}
            <div
              className={`absolute -left-[33px] top-4 h-2.5 w-2.5 border ${item.is_certified ? "border-emerald-500 bg-emerald-500" : "border-cyan-500 bg-cyan-500"}`}
            />

            <div className="border border-neutral-900 bg-[#0a0a0a] p-4 ml-4 hover:border-neutral-700 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <EvidenceTypeIcon
                  type={item.evidence_type}
                  className="h-4 w-4 text-neutral-400"
                />
                <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-300 truncate">
                  {item.title}
                </span>
                {item.is_certified && (
                  <span className="text-[7px] font-mono uppercase tracking-widest text-emerald-400 px-1.5 py-0.5 border border-emerald-900/50 bg-emerald-950/20 ml-1">
                    65B ✓
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[7px] font-mono uppercase tracking-widest text-neutral-600 mt-2 pt-2 border-t border-dashed border-neutral-800">
                <span>
                  {new Date(item.captured_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span className="text-neutral-700">•</span>
                <span>{meta?.label}</span>
                {item.issue_category && (
                  <>
                    <span className="text-neutral-700">•</span>
                    <span className="text-amber-400 px-1.5 py-0.5 border border-amber-900/50 bg-amber-950/20">
                      {item.issue_category}
                    </span>
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
