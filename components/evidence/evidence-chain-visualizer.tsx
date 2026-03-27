"use client";

import type { ChainLink } from "@/types/evidence";
import { Shield, Link as LinkIcon, Hash } from "lucide-react";

export function EvidenceChainVisualizer({ links }: { links: ChainLink[] }) {
  if (links.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No chain links yet.
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-x-auto">
      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
        <Shield className="h-4 w-4 text-emerald-400" />
        <span>Cryptographic Hash Chain — Each item is linked to the previous via SHA-256</span>
      </div>

      {links.map((link, i) => (
        <div key={link.item_id} className="flex items-center gap-2">
          {/* Chain connector */}
          {i > 0 && (
            <div className="flex flex-col items-center -my-2">
              <div className="h-4 w-0.5 bg-blue-500/30" />
              <LinkIcon className="h-3 w-3 text-blue-500/50" />
              <div className="h-4 w-0.5 bg-blue-500/30" />
            </div>
          )}

          {/* Chain block */}
          <div className={`flex-1 rounded-lg border p-3 ${link.verified ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-xs font-bold ${link.verified ? "text-emerald-400" : "text-red-400"}`}>
                  #{link.sequence_number}
                </span>
                <Hash className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-mono text-muted-foreground truncate">
                  {link.content_hash.substring(0, 16)}...
                </span>
              </div>
              <span className={`text-[10px] ${link.verified ? "text-emerald-400" : "text-red-400"}`}>
                {link.verified ? "✓" : "✗"}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-muted-foreground/60">Chain:</span>
              <span className="text-[10px] font-mono text-muted-foreground/60 truncate">
                {link.chain_hash.substring(0, 24)}...
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
