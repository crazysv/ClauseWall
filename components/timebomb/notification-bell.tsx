"use client";

// ============================================
// NOTIFICATION BELL
// Navbar notification icon with dropdown
// ============================================

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, AlertTriangle, Clock, Info, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import type { DeadlineNotification } from "@/types";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<DeadlineNotification[]>([]);
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
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (daysB: number) => {
    if (daysB <= 3) return <AlertTriangle className="w-3.5 h-3.5 text-red-400" />;
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
        className="relative p-2 rounded-lg hover:bg-white dark:bg-slate-900/5 transition-colors"
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
          <Bell className="w-5 h-5 text-white/50" />
        </motion.div>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[9px] text-white font-bold flex items-center justify-center"
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
            className="absolute right-0 mt-3 w-80 max-h-96 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-card shadow-xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 dark:bg-slate-800/80 backdrop-blur-sm">
              <span className="text-sm font-black tracking-tight text-slate-900 dark:text-slate-100">
                Notifications
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={loading}
                  className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            {notifications.length === 0 ? (
              <div className="p-4 md:p-6 lg:p-8 text-center bg-white dark:bg-slate-900">
                <Bell className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">No notifications yet</p>
                <p className="text-[10px] font-medium text-slate-400 mt-2">
                  Activate Time Bomb Defuser to get deadline alerts
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
                    className={`w-full flex items-start gap-4 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 last:border-0 ${ !n.read ? "bg-indigo-50/30" : "bg-white dark:bg-slate-900" }`}
                  >
                    <div className="mt-1">{getIcon(n.days_before)}</div>
                    <div className="flex-1 min-w-0 mt-0.5">
                      <p className="text-[11px] font-bold text-slate-700 truncate">
                        Deadline reminder ({n.days_before}d before)
                      </p>
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
                        {getTimeAgo(n.sent_at)} • {n.notification_type}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
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
                className="w-full p-4 text-center text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors border-t border-slate-100 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center gap-1.5"
              >
                View all deadlines
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
