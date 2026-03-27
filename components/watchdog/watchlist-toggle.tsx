"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
        const res = await fetch(`/api/watchdog/watchlist?company_id=${companyId}`, { method: "DELETE" });
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
    <Button
      variant={watching ? "outline" : "default"}
      size="sm"
      onClick={toggle}
      disabled={loading}
      className={`gap-2 ${watching ? "border-blue-500/30 text-blue-400" : "bg-blue-600 hover:bg-blue-700"}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : watching ? (
        <EyeOff className="h-4 w-4" />
      ) : (
        <Eye className="h-4 w-4" />
      )}
      {watching ? "Watching" : "Watch"}
    </Button>
  );
}
