"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Loader2, CheckCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WatchdogAlertWithCompany } from "@/types";

export function AlertPanel() {
  const [alerts, setAlerts] = useState<WatchdogAlertWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/watchdog/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch {
      // Not logged in or error
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/watchdog/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark_all_read: true }),
      });
      setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
      setUnreadCount(0);
    } catch {
      // Ignore
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const severityEmoji: Record<string, string> = {
    critical: "🔴", major: "🟡", minor: "🔵", cosmetic: "⚪",
  };

  return (
    <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 rounded-xl overflow-hidden">
      <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bell className="h-5 w-5 text-indigo-600" />
            Alerts
            {unreadCount > 0 && (
              <Badge className="bg-red-50 text-red-700 border-red-200 font-bold px-2 py-0.5 text-[10px] rounded-full uppercase tracking-widest">
                {unreadCount} new
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 gap-1 h-8">
              <CheckCheck className="h-4 w-4" /> Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 p-3 max-h-80 overflow-y-auto">
        {alerts.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium text-center py-6">
            No alerts yet. Watch some companies to get notified.
          </p>
        ) : (
          alerts.slice(0, 10).map((alert) => (
            <Link
              key={alert.id}
              href={`/watchdog/changes/${alert.change_id}`}
              className={`block p-3.5 rounded-xl transition-colors border ${ alert.is_read ? "bg-slate-50 dark:bg-slate-800 border-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800" : "bg-blue-50 border-blue-100 shadow-sm dark:shadow-slate-900/20 hover:bg-blue-100/70" }`}
            >
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 mt-0.5 text-base bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 p-1.5 rounded-lg">
                  {severityEmoji[alert.severity] || "📋"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-bold truncate ${alert.is_read ? "text-slate-500" : "text-slate-900 dark:text-slate-100"}`}>
                    {alert.title}
                  </p>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
                    {alert.body}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2">
                    {new Date(alert.sent_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
