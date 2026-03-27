"use client";

import { useEffect, useState } from "react";
import { Loader2, Newspaper } from "lucide-react";
import ChangeCard from "./change-card";
import type { TosChangeWithCompany } from "@/types";

export default function ChangeFeed({
  companyId,
  limit = 20,
}: {
  companyId?: string;
  limit?: number;
}) {
  const [changes, setChanges] = useState<TosChangeWithCompany[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChanges = async () => {
      try {
        const params = new URLSearchParams();
        if (companyId) params.set("company_id", companyId);
        params.set("limit", String(limit));

        const res = await fetch(`/api/watchdog/changes?${params}`);
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();
        setChanges(data.changes || []);
      } catch (err) {
        console.error("Failed to fetch changes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChanges();
  }, [companyId, limit]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading changes...
      </div>
    );
  }

  if (changes.length === 0) {
    return (
      <div className="text-center py-12">
        <Newspaper className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No changes detected yet.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Changes will appear here once ToS pages are scraped.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {changes.map((change) => (
        <ChangeCard key={change.id} change={change} />
      ))}
    </div>
  );
}
