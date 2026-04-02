"use client";

import type { EvidenceItem } from "@/types/evidence";
import { EvidenceTypeIcon } from "./evidence-type-icon";
import { ChainStatusBadge } from "./chain-status-badge";
import { EVIDENCE_TYPE_META } from "@/types/evidence";
import { Shield, Trash2, FileText, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EvidenceItemCard({
  item,
  onDelete,
  onCertify,
}: {
  item: EvidenceItem;
  onDelete?: (id: string) => void;
  onCertify?: (id: string) => void;
}) {
  const meta = EVIDENCE_TYPE_META[item.evidence_type];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 p-4 hover:border-indigo-300 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className={`p-2.5 rounded-xl bg-${meta?.color || "slate"}-50 text-${meta?.color || "slate"}-600`}>
            <EvidenceTypeIcon type={item.evidence_type} className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">#{item.sequence_number}</span>
              <h4 className="font-black text-slate-900 dark:text-slate-100 truncate">{item.title}</h4>
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate mt-1">
              {meta?.label} • {new Date(item.captured_at).toLocaleDateString("en-IN")}
              {item.original_filename && ` • ${item.original_filename}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {item.is_certified && (
            <div className="p-1 rounded-full bg-emerald-50 text-emerald-600" title="65B Certified">
              <Shield className="h-4 w-4" />
            </div>
          )}
          {onCertify && !item.is_certified && (
            <Button variant="ghost" size="sm" onClick={() => onCertify(item.id)} className="h-7 px-2.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg">
              <FileText className="h-3 w-3 mr-1" />65B
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)} className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg">
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Description */}
      {item.description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-3 line-clamp-2">{item.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 flex-wrap">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[120px]" title={item.content_hash}>
          Hash: {item.content_hash.substring(0, 12)}...
        </span>
        <ChainStatusBadge verified={true} />

        {item.tags && item.tags.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Tag className="h-3 w-3 text-slate-300" />
            {item.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">{tag}</span>
            ))}
          </div>
        )}

        {item.issue_category && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-100 text-amber-700">{item.issue_category}</span>
        )}
      </div>
    </div>
  );
}
