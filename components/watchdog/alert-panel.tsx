"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Loader2, CheckCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WatchdogAlertWithCompany } from "@/types";

export default function AlertPanel() {
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
        <Loader2 className="h-5 w-5 animate-spin text-foreground" />
      </div>
    );
  }

  const severityEmoji: Record<string, string> = {
    critical: "🔴",
    major: "🟡",
    minor: "🔵",
    cosmetic: "⚪",
  };

  return (
    <Card className="bg-background border-2 border-foreground card-impact/50 border-foreground border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alerts
            {unreadCount > 0 && (
              <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px]">
                {unreadCount} new
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllRead}
              className="text-xs gap-1"
            >
              <CheckCheck className="h-3 w-3" /> Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 max-h-80 overflow-y-auto">
        {alerts.length === 0 ? (
          <p className="text-sm text-foreground text-center py-4">
            No alerts yet. Watch some companies to get notified.
          </p>
        ) : (
          alerts.slice(0, 10).map((alert) => (
            <Link
              key={alert.id}
              href={`/watchdog/changes/${alert.change_id}`}
              className={`block p-3 rounded-none transition-colors ${alert.is_read ? "bg-background border-2 border-foreground card-impact/30" : "bg-blue-500/5 border border-blue-500/10"} hover:bg-muted`}
            >
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">
                  {severityEmoji[alert.severity] || "📋"}
                </span>
                <div className="min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${alert.is_read ? "text-foreground" : ""}`}
                  >
                    {alert.title}
                  </p>
                  <p className="text-xs text-foreground line-clamp-2 mt-0.5">
                    {alert.body}
                  </p>
                  <p className="text-[10px] text-foreground mt-1">
                    {new Date(alert.sent_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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
