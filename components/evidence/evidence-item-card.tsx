"use client";

import type { EvidenceItem } from "@/types/evidence";
import { EvidenceTypeIcon } from "./evidence-type-icon";
import { ChainStatusBadge } from "./chain-status-badge";
import { EVIDENCE_TYPE_META } from "@/types/evidence";
import { Shield, Trash2, FileText, Tag } from "lucide-react";

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
    <div className="border border-neutral-900 bg-[#0a0a0a] p-4 hover:border-neutral-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 border border-cyan-900/50 bg-cyan-950/10">
            <EvidenceTypeIcon
              type={item.evidence_type}
              className="h-4 w-4 text-cyan-400"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[7px] font-mono uppercase tracking-widest text-neutral-500 border border-neutral-800 px-1.5 py-0.5 bg-[#050505]">
                #{item.sequence_number}
              </span>
              <h4 className="text-[9px] font-mono uppercase tracking-widest text-neutral-200 truncate">
                {item.title}
              </h4>
            </div>
            <p className="text-[7px] font-mono uppercase tracking-widest text-neutral-600 truncate mt-1">
              {meta?.label} •{" "}
              {new Date(item.captured_at).toLocaleDateString("en-IN")}
              {item.original_filename && ` • ${item.original_filename}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {item.is_certified && (
            <span
              className="text-emerald-400"
              title="65B Certified"
            >
              <Shield className="h-4 w-4" />
            </span>
          )}
          {onCertify && !item.is_certified && (
            <button
              onClick={() => onCertify(item.id)}
              className="flex items-center gap-1 px-2 py-1 border border-cyan-900/50 bg-cyan-950/10 text-[7px] font-mono uppercase tracking-widest text-cyan-400 hover:text-cyan-300 hover:border-cyan-800 transition-colors"
            >
              <FileText className="h-3 w-3" />
              65B
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(item.id)}
              className="p-1.5 border border-red-900/50 bg-red-950/20 text-red-400 hover:text-red-300 hover:border-red-800 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      {item.description && (
        <p className="text-[8px] font-mono text-neutral-500 mt-3 line-clamp-2 leading-relaxed">
          {item.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 mt-3 flex-wrap pt-3 border-t border-neutral-800">
        <span
          className="text-[7px] font-mono text-neutral-600 truncate max-w-[150px] bg-[#050505] px-1.5 py-0.5 border border-neutral-800"
          title={item.content_hash}
        >
          HASH: {item.content_hash.substring(0, 12)}...
        </span>
        <ChainStatusBadge verified={true} />

        {item.tags && item.tags.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Tag className="h-3 w-3 text-neutral-600" />
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 border border-neutral-800 bg-[#050505] text-[7px] font-mono uppercase tracking-widest text-neutral-500"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {item.issue_category && (
          <span className="px-1.5 py-0.5 border border-amber-900/50 text-[7px] font-mono uppercase tracking-widest bg-amber-950/20 text-amber-400">
            {item.issue_category}
          </span>
        )}
      </div>
    </div>
  );
}
