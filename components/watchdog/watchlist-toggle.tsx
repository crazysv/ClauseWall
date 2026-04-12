"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function WatchlistToggle({
  companyId,
  isWatching,
  onToggle,
}: {
  companyId: string;
  isWatching: boolean;
  onToggle?: (watching: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [watching, setWatching] = useState(isWatching);

  const toggle = async () => {
    setLoading(true);
    try {
      if (watching) {
        const res = await fetch(
          `/api/watchdog/watchlist?company_id=${companyId}`,
          { method: "DELETE" },
        );
        if (!res.ok) throw new Error("Failed to remove");
        setWatching(false);
        onToggle?.(false);
        toast.success("Removed from watchlist");
      } else {
        const res = await fetch("/api/watchdog/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company_id: companyId }),
        });
        if (!res.ok) throw new Error("Failed to add");
        setWatching(true);
        onToggle?.(true);
        toast.success("Added to watchlist");
      }
    } catch {
      toast.error("Failed to update watchlist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-2 px-3 py-1.5 border font-mono uppercase tracking-widest text-[9px] transition-all
        ${watching 
          ? "border-cyan-900/50 bg-cyan-950/20 text-cyan-500 hover:bg-cyan-900/30" 
          : "border-neutral-800 bg-[#0a0a0a] text-neutral-400 hover:bg-neutral-900 hover:text-neutral-300"
        }
        ${loading ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : watching ? (
        <EyeOff className="h-3 w-3" />
      ) : (
        <Eye className="h-3 w-3" />
      )}
      {watching ? "[ TRACKING ENGAGED ]" : "[ INITIATE TRACKING ]"}
    </button>
  );
}
