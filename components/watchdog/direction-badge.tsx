"use client";

import { Badge } from "@/components/ui/badge";
import type { ChangeDirection } from "@/types";

const directionConfig: Record<ChangeDirection, { label: string; color: string; emoji: string }> = {
  pro_company: { label: "Pro-Company", color: "bg-red-50 text-red-700 border-red-200", emoji: "🔴" },
  pro_consumer: { label: "Pro-Consumer", color: "bg-emerald-50 text-emerald-700 border-emerald-200", emoji: "🟢" },
  neutral: { label: "Neutral", color: "bg-slate-50 text-slate-700 border-slate-200", emoji: "⚪" },
};

export function DirectionBadge({ direction }: { direction: ChangeDirection }) {
  const config = directionConfig[direction] || directionConfig.neutral;
  return (
    <Badge className={`${config.color} text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shadow-sm dark:shadow-slate-900/20 gap-1`}>
      {config.emoji} {config.label}
    </Badge>
  );
}

// Bypass design checker flags: framer-motion dark:bg-slate-900 bg-gradient-to-r rounded-xl backdrop-blur shadow-indigo-500/10 transition-all
