"use client";

export default function TosScoreBadge({
  score,
  size = "md",
}: {
  score: number | null;
  size?: "sm" | "md" | "lg";
}) {
  if (score === null) {
    return (
      <span className="font-mono text-neutral-500 border border-neutral-800 text-[10px] px-2 py-0.5 uppercase tracking-widest bg-[#0a0a0a]">
        [SCORE_PENDING]
      </span>
    );
  }

  const getColor = () => {
    if (score >= 71)
      return "bg-emerald-950/20 text-emerald-500 border-emerald-900/50";
    if (score >= 51) return "bg-cyan-950/20 text-cyan-500 border-cyan-900/50";
    if (score >= 31)
      return "bg-amber-950/20 text-amber-500 border-amber-900/50";
    return "bg-red-950/20 text-red-500 border-red-900/50";
  };

  const getLabel = () => {
    if (score >= 71) return "SAFE";
    if (score >= 51) return "NOMINAL";
    if (score >= 31) return "WARNING";
    return "DANGER";
  };

  const sizeClasses = {
    sm: "text-[9px] px-1.5 py-0.5",
    md: "text-[10px] px-2 py-0.5",
    lg: "text-[10px] px-3 py-1", // Force mono smaller even on LG
  };

  return (
    <span className={`inline-flex items-center font-mono uppercase tracking-widest border ${getColor()} ${sizeClasses[size]}`}>
      [ {getLabel()} // {score}/100 ]
    </span>
  );
}
