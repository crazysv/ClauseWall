"use client";

import { useEffect, useState } from "react";
import { Loader2, Newspaper } from "lucide-react";
import { ChangeCard } from "./change-card";
import type { TosChangeWithCompany } from "@/types";

export function ChangeFeed({
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
      } catch {
        // Silently handled
      } finally {
        setLoading(false);
      }
    };

    fetchChanges();
  }, [companyId, limit]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 md:py-8 lg:py-12 gap-3 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
        Loading changes...
      </div>
    );
  }

  if (changes.length === 0) {
    return (
      <div className="text-center py-8 md:py-6 md:py-8 lg:py-12 lg:py-16 px-4">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 mb-4 shadow-sm dark:shadow-slate-900/20">
          <Newspaper className="h-8 w-8 text-slate-400" />
        </div>
        <p className="text-slate-900 dark:text-slate-100 font-black text-lg">No changes detected yet.</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2 max-w-sm mx-auto leading-relaxed">
          Changes will appear here once relevant Terms of Service pages are monitored and scraped.
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
