"use client";

import { Badge } from "@/components/ui/badge";

export default function TosScoreBadge({
  score,
  size = "md",
}: {
  score: number | null;
  size?: "sm" | "md" | "lg";
}) {
  if (score === null) {
    return (
      <Badge variant="outline" className="text-muted-foreground border-white/10 text-xs">
        N/A
      </Badge>
    );
  }

  const getColor = () => {
    if (score >= 71) return "bg-green-500/15 text-green-400 border-green-500/30";
    if (score >= 51) return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    if (score >= 31) return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    return "bg-red-500/15 text-red-400 border-red-500/30";
  };

  const getEmoji = () => {
    if (score >= 71) return "🟢";
    if (score >= 51) return "🔵";
    if (score >= 31) return "🟡";
    return "🔴";
  };

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2 py-1",
    lg: "text-sm px-3 py-1.5 font-semibold",
  };

  return (
    <Badge className={`${getColor()} ${sizeClasses[size]} gap-1`}>
      {getEmoji()} {score}/100
    </Badge>
  );
}
