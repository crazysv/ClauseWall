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
    <div className="border-4 border-black p-4 bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="p-3 border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-blue-100 dark:bg-blue-900/30">
            <EvidenceTypeIcon
              type={item.evidence_type}
              className="h-6 w-6 stroke-[3px]"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="text-sm font-black uppercase tracking-widest text-muted-foreground border-2 border-black px-1.5 py-0.5">
                #{item.sequence_number}
              </span>
              <h4 className="font-black text-lg uppercase tracking-widest text-foreground truncate">
                {item.title}
              </h4>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground truncate mt-1">
              {meta?.label} •{" "}
              {new Date(item.captured_at).toLocaleDateString("en-IN")}
              {item.original_filename && ` • ${item.original_filename}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {item.is_certified && (
            <span
              className="text-emerald-600 dark:text-emerald-400"
              title="65B Certified"
            >
              <Shield className="h-6 w-6 stroke-[3px]" />
            </span>
          )}
          {onCertify && !item.is_certified && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCertify(item.id)}
              className="btn-impact px-3 text-xs bg-white dark:bg-zinc-900 border-2 border-black hover:bg-blue-100"
            >
              <FileText className="h-4 w-4 mr-2 stroke-[3px]" />
              65B
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(item.id)}
              className="btn-impact px-2 text-xs bg-red-100 dark:bg-red-900/30 border-2 border-black hover:bg-red-200"
            >
              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400 stroke-[3px]" />
            </Button>
          )}
        </div>
      </div>

      {/* Description */}
      {item.description && (
        <p className="text-sm font-medium text-muted-foreground mt-4 line-clamp-2">
          {item.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-3 mt-4 flex-wrap pt-4 border-t-2 border-black border-dashed">
        <span
          className="text-xs font-bold font-mono text-muted-foreground truncate max-w-[150px] bg-muted dark:bg-black/50 px-2 py-0.5 border-2 border-black"
          title={item.content_hash}
        >
          HASH: {item.content_hash.substring(0, 12)}...
        </span>
        <ChainStatusBadge verified={true} />

        {item.tags && item.tags.length > 0 && (
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground stroke-[3px]" />
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 border-2 border-black bg-gray-100 dark:bg-zinc-800 text-xs font-black uppercase tracking-widest text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {item.issue_category && (
          <span className="px-2 py-0.5 border-2 border-black text-xs font-black uppercase tracking-widest bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100">
            {item.issue_category}
          </span>
        )}
      </div>
    </div>
  );
}
