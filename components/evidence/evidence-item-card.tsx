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
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2 rounded-lg bg-${meta?.color || "gray-500"}/10`}>
            <EvidenceTypeIcon type={item.evidence_type} className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono">#{item.sequence_number}</span>
              <h4 className="font-medium text-sm text-foreground truncate">{item.title}</h4>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {meta?.label} • {new Date(item.captured_at).toLocaleDateString("en-IN")}
              {item.original_filename && ` • ${item.original_filename}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {item.is_certified && (
            <span className="text-xs text-emerald-400" title="65B Certified">
              <Shield className="h-4 w-4" />
            </span>
          )}
          {onCertify && !item.is_certified && (
            <Button variant="ghost" size="sm" onClick={() => onCertify(item.id)} className="h-7 px-2 text-xs text-blue-400 hover:text-blue-300">
              <FileText className="h-3 w-3 mr-1" />65B
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)} className="h-7 px-2 text-xs text-red-400 hover:text-red-300">
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Description */}
      {item.description && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{item.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span className="text-[10px] font-mono text-muted-foreground/60 truncate max-w-[120px]" title={item.content_hash}>
          Hash: {item.content_hash.substring(0, 12)}...
        </span>
        <ChainStatusBadge verified={true} />

        {item.tags && item.tags.length > 0 && (
          <div className="flex items-center gap-1">
            <Tag className="h-3 w-3 text-muted-foreground" />
            {item.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-muted-foreground">{tag}</span>
            ))}
          </div>
        )}

        {item.issue_category && (
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400">{item.issue_category}</span>
        )}
      </div>
    </div>
  );
}
