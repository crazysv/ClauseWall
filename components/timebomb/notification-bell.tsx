"use client";

// ============================================
// NOTIFICATION BELL
// Navbar notification icon with dropdown
// ============================================

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Check,
  AlertTriangle,
  Clock,
  Info,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { DeadlineNotification } from "@/types";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<DeadlineNotification[]>(
    [],
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();

    // Re-fetch every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/timebomb/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications?.slice(0, 10) || []);
      setUnreadCount(data.unread_count || 0);
    } catch {
      // Silently fail — notification bell shouldn't disrupt UX
    }
  };

  const markAllRead = async () => {
    try {
      setLoading(true);
      await fetch("/api/timebomb/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (daysB: number) => {
    if (daysB <= 3)
      return <AlertTriangle className="w-3.5 h-3.5 text-red-400" />;
    if (daysB <= 14) return <Clock className="w-3.5 h-3.5 text-orange-400" />;
    return <Info className="w-3.5 h-3.5 text-blue-400" />;
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 border-4 border-transparent hover:border-black hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all group"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <motion.div
          animate={
            unreadCount > 0
              ? {
                  rotate: [0, 10, -10, 10, -10, 0],
                }
              : {}
          }
          transition={
            unreadCount > 0
              ? { duration: 0.5, repeat: Infinity, repeatDelay: 10 }
              : {}
          }
        >
          <Bell className="w-5 h-5 text-black dark:text-foreground stroke-[3px] group-hover:-translate-y-0.5 transition-transform" />
        </motion.div>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 border-2 border-black bg-red-500 text-[10px] text-foreground font-black flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto border-4 border-black bg-white dark:bg-zinc-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-50 text-foreground"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b-4 border-black bg-gray-50 dark:bg-zinc-900">
              <span className="text-sm font-black uppercase tracking-widest text-foreground block">
                NOTIFICATIONS
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={loading}
                  className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-colors flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 border-2 border-black"
                >
                  <Check className="w-3 h-3 stroke-[3px]" />
                  MARK ALL READ
                </button>
              )}
            </div>

            {/* List */}
            {notifications.length === 0 ? (
              <div className="p-8 text-center border-b-4 border-black last:border-b-0">
                <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-4 stroke-[1.5px]" />
                <p className="text-sm font-black uppercase tracking-widest text-foreground">
                  NO NOTIFICATIONS YET
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2 leading-relaxed">
                  ACTIVATE TIME BOMB DEFUSER TO GET DEADLINE ALERTS
                </p>
              </div>
            ) : (
              <div>
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      router.push(`/timebomb/${n.deadline_id}`);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-start gap-4 p-4 text-left hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors border-b-2 border-black/10 dark:border-foreground border-2 last:border-b-0 border-dashed ${!n.read ? "bg-orange-50 dark:bg-orange-900/10" : ""}`}
                  >
                    <div className="mt-1 border-2 border-black bg-white dark:bg-black p-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex-shrink-0">
                      {getIcon(n.days_before)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black uppercase tracking-widest text-foreground truncate block">
                        DEADLINE REMINDER ({n.days_before}D BEFORE)
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1 block">
                        {getTimeAgo(n.sent_at)} • {n.notification_type}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="w-3 h-3 border-2 border-black bg-orange-500 mt-1 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Footer */}
            {notifications.length > 0 && (
              <button
                onClick={() => {
                  router.push("/dashboard");
                  setIsOpen(false);
                }}
                className="w-full p-4 text-center text-xs font-black uppercase tracking-widest text-foreground hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors border-t-4 border-black flex items-center justify-center gap-2 group"
              >
                VIEW ALL DEADLINES
                <ExternalLink className="w-4 h-4 stroke-[3px] group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
