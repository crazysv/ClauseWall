// ============================================
// /watchdog/settings — Alert Preferences
// ============================================

"use client";

import { useState, useEffect } from "react";
import { Settings, Loader2, Bell, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function WatchdogSettingsPage() {
  const [watchlist, setWatchlist] = useState<
    Array<{
      id: string;
      company_id: string;
      company?: { name: string; slug: string };
      alert_email: boolean;
      alert_telegram: boolean;
      alert_inapp: boolean;
      sensitivity: string;
      telegram_chat_id: string | null;
    }>
  >([]);
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
    value: boolean | string,
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
          w.company_id === companyId ? { ...w, [field]: value } : w,
        ),
      );
      toast.success("Preferences updated");
    } catch {
      toast.error("Failed to update preferences");
    }
  };

  const removeFromWatchlist = async (companyId: string) => {
    try {
      const res = await fetch(
        `/api/watchdog/watchlist?company_id=${companyId}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) throw new Error("Failed");
      setWatchlist((prev) => prev.filter((w) => w.company_id !== companyId));
      toast.success("Removed from watchlist");
    } catch {
      toast.error("Failed to remove");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gray-800 flex items-center justify-center">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Watchdog Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your alert preferences
            </p>
          </div>
        </div>

        {watchlist.length === 0 ? (
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-8 text-center">
              <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-2">
                You're not watching any companies yet.
              </p>
              <p className="text-sm text-muted-foreground">
                Go to the{" "}
                <a
                  href="/watchdog/companies"
                  className="text-blue-400 hover:underline"
                >
                  Companies
                </a>{" "}
                page to start watching.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {watchlist.map((entry) => (
              <Card key={entry.id} className="bg-gray-900/50 border-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <a
                      href={`/watchdog/companies/${entry.company?.slug}`}
                      className="hover:text-blue-400 transition-colors"
                    >
                      {entry.company?.name || "Unknown Company"}
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromWatchlist(entry.company_id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Remove
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Alert channels */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={entry.alert_inapp}
                        onChange={(e) =>
                          updatePreference(
                            entry.company_id,
                            "alert_inapp",
                            e.target.checked,
                          )
                        }
                        className="rounded border-gray-700 bg-gray-800"
                      />
                      <span className="text-sm">In-App</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={entry.alert_email}
                        onChange={(e) =>
                          updatePreference(
                            entry.company_id,
                            "alert_email",
                            e.target.checked,
                          )
                        }
                        className="rounded border-gray-700 bg-gray-800"
                      />
                      <span className="text-sm">Email</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={entry.alert_telegram}
                        onChange={(e) =>
                          updatePreference(
                            entry.company_id,
                            "alert_telegram",
                            e.target.checked,
                          )
                        }
                        className="rounded border-gray-700 bg-gray-800"
                      />
                      <span className="text-sm">Telegram</span>
                    </label>
                    {/* Sensitivity */}
                    <select
                      value={entry.sensitivity}
                      onChange={(e) =>
                        updatePreference(
                          entry.company_id,
                          "sensitivity",
                          e.target.value,
                        )
                      }
                      className="text-sm bg-gray-800 border border-gray-700 rounded px-2 py-1"
                    >
                      <option value="all_changes">All changes</option>
                      <option value="major_and_critical">
                        Major & Critical
                      </option>
                      <option value="critical_only">Critical only</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
