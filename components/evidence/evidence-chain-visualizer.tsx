"use client";

import type { ChainLink } from "@/types/evidence";
import { Shield, Link as LinkIcon, Hash } from "lucide-react";

export function EvidenceChainVisualizer({ links }: { links: ChainLink[] }) {
  if (links.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600">
          NO CHAIN LINKS YET.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-x-auto relative">
      <div className="flex items-center gap-2 text-[8px] font-mono uppercase tracking-widest text-neutral-500 mb-5">
        <Shield className="h-3.5 w-3.5 text-emerald-400" />
        <span>
          CRYPTOGRAPHIC HASH CHAIN — EACH ITEM IS LINKED TO THE PREVIOUS VIA
          SHA-256
        </span>
      </div>

      <div className="border-l border-neutral-800 ml-4 pl-8 py-2 relative">
        {links.map((link, i) => (
          <div key={link.item_id} className="relative mb-6 last:mb-0">
            {/* Chain connector node */}
            <div className="absolute -left-[33px] top-4 w-2.5 h-2.5 border border-cyan-500 bg-cyan-500 z-10" />

            {/* Content block */}
            <div
              className={`border p-4 ${link.verified ? "border-emerald-900/50 bg-emerald-950/10" : "border-red-900/50 bg-red-950/20"}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`text-sm font-mono tabular-nums uppercase tracking-widest ${link.verified ? "text-emerald-400" : "text-red-400"}`}
                  >
                    #{link.sequence_number}
                  </span>
                  <Hash className="h-3 w-3 text-neutral-600" />
                  <span className="text-[8px] font-mono text-neutral-400 truncate bg-[#050505] px-1.5 py-0.5 border border-neutral-800">
                    {link.content_hash.substring(0, 16)}...
                  </span>
                </div>
                <span
                  className={`text-sm font-mono ${link.verified ? "text-emerald-400" : "text-red-400"}`}
                >
                  {link.verified ? "✓" : "✗"}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-dashed border-neutral-800">
                <span className="text-[7px] font-mono uppercase tracking-widest text-neutral-600">
                  CHAIN:
                </span>
                <span className="text-[7px] font-mono text-neutral-500 truncate">
                  {link.chain_hash.substring(0, 32)}...
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
