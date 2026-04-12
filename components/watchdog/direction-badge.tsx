"use client";

import type { ChangeDirection } from "@/types";

const directionConfig: Record<
  ChangeDirection,
  { label: string; color: string; border: string; bg: string }
> = {
  pro_company: {
    label: "PRO-ENTITY_NODE",
    color: "text-red-500",
    border: "border-red-900/50",
    bg: "bg-red-950/20",
  },
  pro_consumer: {
    label: "PRO-CLIENT_NODE",
    color: "text-emerald-500",
    border: "border-emerald-900/50",
    bg: "bg-emerald-950/20",
  },
  neutral: {
    label: "NEUTRAL_NODE",
    color: "text-neutral-500",
    border: "border-neutral-800",
    bg: "bg-[#0a0a0a]",
  },
};

export default function DirectionBadge({
  direction,
}: {
  direction: ChangeDirection;
}) {
  const config = directionConfig[direction] || directionConfig.neutral;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 border font-mono text-[9px] uppercase tracking-widest ${config.color} ${config.border} ${config.bg}`}>
      [ {config.label} ]
    </span>
  );
}
