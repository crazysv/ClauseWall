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
      ? "bg-red-600"
      : percent >= 80
        ? "bg-yellow-500"
        : "bg-blue-600";
  const textColor =
    percent >= 95
      ? "text-red-700 dark:text-red-400"
      : percent >= 80
        ? "text-yellow-700 dark:text-yellow-400"
        : "text-muted-foreground";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm font-black uppercase tracking-widest">
        <span className={textColor}>
          {usedMB}MB / {limitMB}MB
        </span>
        <span className={textColor}>{percent}%</span>
      </div>
      <div className="h-6 border-4 border-black bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-0.5">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {percent >= 95 && (
        <p className="text-sm font-bold text-red-700 dark:text-red-400 pt-1">
          STORAGE ALMOST FULL. DELETE OLD BUNDLES TO FREE SPACE.
        </p>
      )}
    </div>
  );
}
