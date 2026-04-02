// ============================================
// /watchdog/settings — Alert Preferences
// ============================================

"use client";

import { useState, useEffect } from "react";
import { Settings, Loader2, Bell, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { toast } from "sonner";
import Link from "next/link";

export default function WatchdogSettingsPage() {
  const [watchlist, setWatchlist] = useState<Array<{
    id: string;
    company_id: string;
    company?: { name: string; slug: string };
    alert_email: boolean;
    alert_telegram: boolean;
    alert_inapp: boolean;
    sensitivity: string;
    telegram_chat_id: string | null;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      const res = await fetch("/api/watchdog/watchlist");
      if (res.ok) {
        const data = await res.json();
        setWatchlist(data.watchlist || []);
      }
    } catch {
      // Not logged in
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (
    companyId: string,
    field: string,
    value: boolean | string
  ) => {
    try {
      const entry = watchlist.find((w) => w.company_id === companyId);
      if (!entry) return;

      const res = await fetch("/api/watchdog/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: companyId, [field]: value }),
      });

      if (!res.ok) throw new Error("Failed to update");

      setWatchlist((prev) =>
        prev.map((w) =>
          w.company_id === companyId ? { ...w, [field]: value } : w
        )
      );
      toast.success("Preferences updated");
    } catch {
      toast.error("Failed to update preferences");
    }
  };

  const removeFromWatchlist = async (companyId: string) => {
    try {
      const res = await fetch(`/api/watchdog/watchlist?company_id=${companyId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      setWatchlist((prev) => prev.filter((w) => w.company_id !== companyId));
      toast.success("Removed from watchlist");
    } catch {
      toast.error("Failed to remove");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans flex flex-col relative overflow-hidden text-slate-900 dark:text-slate-100">
      {/* Background gradients */}
      <div className="absolute top-0 right-1/4 w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-16 max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 mb-2 shadow-sm border border-indigo-100 dark:border-indigo-800/30">
               <Settings className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Watchdog Settings
            </h1>
            <p className="text-lg font-medium text-slate-600 dark:text-slate-400 max-w-2xl">
              Manage your alert preferences and active subscriptions.
            </p>
          </div>
        </div>

        {watchlist.length === 0 ? (
          <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-800/60 shadow-xl dark:shadow-slate-900/20 rounded-3xl overflow-hidden backdrop-blur-md">
            <CardContent className="p-10 text-center">
              <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-6">
                 <Shield className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-black text-slate-700 dark:text-slate-300">Nobody to watch</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4 mt-2 font-medium">You're not watching any companies yet.</p>
              <Link href="/watchdog/companies" className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-6 text-sm font-bold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                Explore Companies
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {watchlist.map((entry) => (
              <Card key={entry.id} className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-800/60 shadow-xl dark:shadow-slate-900/20 rounded-3xl overflow-hidden backdrop-blur-md">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/30">
                  <CardTitle className="text-lg font-black flex items-center justify-between">
                    <Link href={`/watchdog/companies/${entry.company?.slug}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-slate-900 dark:text-slate-100">
                      {entry.company?.name || "Unknown Company"}
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromWatchlist(entry.company_id)}
                      className="text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Remove
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Alert channels */}
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={entry.alert_inapp}
                        onChange={(e) => updatePreference(entry.company_id, "alert_inapp", e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 bg-slate-50 dark:bg-slate-900 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors">In-App</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={entry.alert_email}
                        onChange={(e) => updatePreference(entry.company_id, "alert_email", e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 bg-slate-50 dark:bg-slate-900 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors">Email</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={entry.alert_telegram}
                        onChange={(e) => updatePreference(entry.company_id, "alert_telegram", e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 bg-slate-50 dark:bg-slate-900 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors">Telegram</span>
                    </label>
                    {/* Sensitivity */}
                    <select
                      value={entry.sensitivity}
                      onChange={(e) => updatePreference(entry.company_id, "sensitivity", e.target.value)}
                      className="text-sm font-bold bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="all_changes">All changes</option>
                      <option value="major_and_critical">Major & Critical</option>
                      <option value="critical_only">Critical only</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
