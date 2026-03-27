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
    <div className="relative pl-6 space-y-0">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-500/50 via-blue-500/20 to-transparent" />

      {sorted.map((item, i) => {
        const meta = EVIDENCE_TYPE_META[item.evidence_type];
        return (
          <div key={item.id} className="relative pb-6 last:pb-0">
            {/* Dot */}
            <div className={`absolute left-[-17px] top-1 h-3 w-3 rounded-full border-2 ${item.is_certified ? "bg-emerald-500 border-emerald-400" : "bg-blue-500 border-blue-400"}`} />

            <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 ml-2 hover:bg-white/[0.04] transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <EvidenceTypeIcon type={item.evidence_type} className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">{item.title}</span>
                {item.is_certified && <span className="text-[10px] text-emerald-400">65B ✓</span>}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>{new Date(item.captured_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                <span>•</span>
                <span>{meta?.label}</span>
                {item.issue_category && (
                  <>
                    <span>•</span>
                    <span className="text-amber-400">{item.issue_category}</span>
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
