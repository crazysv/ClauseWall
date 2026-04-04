import React from "react";

// DangerGauge component - Visual gauge showing overall danger level
export function DangerGauge({ score }: { score: number }) {
  const color =
    score > 80
      ? "bg-purple-600"
      : score > 60
        ? "bg-red-600"
        : score > 30
          ? "bg-yellow-600"
          : "bg-green-600";
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-bold uppercase text-foreground tracking-wider">
        Risk Level
      </h3>
      <div className="w-full h-4 bg-muted border-2 border-foreground rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500 border-r-2 border-foreground`}
          style={{ width: `${score}%` }}
        ></div>
      </div>
      <p className="text-xs font-black text-foreground tabular-nums uppercase">
        {score} / 100
      </p>
    </div>
  );
}
