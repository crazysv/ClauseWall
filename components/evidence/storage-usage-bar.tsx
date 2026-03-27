"use client";

export function StorageUsageBar({ usedBytes, limitBytes = 200 * 1024 * 1024 }: { usedBytes: number; limitBytes?: number }) {
  const percent = Math.min(100, Math.round((usedBytes / limitBytes) * 100));
  const usedMB = (usedBytes / 1024 / 1024).toFixed(1);
  const limitMB = (limitBytes / 1024 / 1024).toFixed(0);

  const color = percent >= 95 ? "bg-red-500" : percent >= 80 ? "bg-yellow-500" : "bg-blue-500";
  const textColor = percent >= 95 ? "text-red-400" : percent >= 80 ? "text-yellow-400" : "text-muted-foreground";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className={textColor}>{usedMB}MB / {limitMB}MB</span>
        <span className={textColor}>{percent}%</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
      </div>
      {percent >= 95 && (
        <p className="text-xs text-red-400">Storage almost full. Delete old bundles to free space.</p>
      )}
    </div>
  );
}
