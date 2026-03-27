"use client";

import { XCircle, AlertTriangle } from "lucide-react";
import type { NotThisAuthority } from "@/types/authority";

interface Props {
  items: NotThisAuthority[];
}

export default function NotThisAuthorityList({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
        <XCircle className="h-3.5 w-3.5" /> Do NOT File Here
      </h4>
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/10">
          <AlertTriangle className="h-3.5 w-3.5 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-red-300">{item.authority_name}</p>
            <p className="text-[11px] text-red-300/50">{item.reason_not_applicable}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
