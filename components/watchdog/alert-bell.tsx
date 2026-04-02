"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

export function AlertBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/watchdog/alerts");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unread_count || 0);
        }
      } catch {
        // Silently fail — user might not be logged in
      }
    };

    fetchCount();
    // Refresh every 60 seconds
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative group cursor-pointer inline-flex">
      <Bell className="h-5 w-5 text-slate-500 group-hover:text-slate-900 dark:text-slate-100 transition-colors" />
      {unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 rounded-full bg-red-600 text-slate-900 dark:text-slate-100 text-[10px] font-bold flex items-center justify-center px-1 shadow-sm dark:shadow-slate-900/20 ring-2 ring-white animate-pulse">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </div>
  );
}
