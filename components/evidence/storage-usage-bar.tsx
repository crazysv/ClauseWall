"use client";

export function StorageUsageBar({
  usedBytes,
  limitBytes = 200 * 1024 * 1024,
}: {
  usedBytes: number;
  limitBytes?: number;
}) {
  const percent = Math.min(100, Math.round((usedBytes / limitBytes) * 100));
  const usedMB = (usedBytes / 1024 / 1024).toFixed(1);
  const limitMB = (limitBytes / 1024 / 1024).toFixed(0);

  const color =
    percent >= 95
      ? "bg-red-500"
      : percent >= 80
        ? "bg-amber-500"
        : "bg-cyan-500";
  const textColor =
    percent >= 95
      ? "text-red-400"
      : percent >= 80
        ? "text-amber-400"
        : "text-neutral-500";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[8px] font-mono uppercase tracking-widest">
        <span className={textColor}>
          {usedMB}MB / {limitMB}MB
        </span>
        <span className={textColor}>{percent}%</span>
      </div>
      <div className="h-2 border border-neutral-800 bg-[#050505] p-px">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {percent >= 95 && (
        <p className="text-[8px] font-mono uppercase tracking-widest text-red-400 pt-1">
          STORAGE ALMOST FULL. DELETE OLD BUNDLES TO FREE SPACE.
        </p>
      )}
    </div>
  );
}
