"use client";

import { Badge } from "@/components/ui/badge";
import type { ChangeDirection } from "@/types";

const directionConfig: Record<ChangeDirection, { label: string; color: string; emoji: string }> = {
  pro_company: { label: "Pro-Company", color: "bg-red-500/15 text-red-400 border-red-500/30", emoji: "🔴" },
  pro_consumer: { label: "Pro-Consumer", color: "bg-green-500/15 text-green-400 border-green-500/30", emoji: "🟢" },
  neutral: { label: "Neutral", color: "bg-gray-500/15 text-gray-400 border-gray-500/30", emoji: "⚪" },
};

export default function DirectionBadge({ direction }: { direction: ChangeDirection }) {
  const config = directionConfig[direction] || directionConfig.neutral;
  return (
    <Badge className={`${config.color} text-xs gap-1`}>
      {config.emoji} {config.label}
    </Badge>
  );
}
