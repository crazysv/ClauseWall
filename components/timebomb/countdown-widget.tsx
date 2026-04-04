"use client";

// ============================================
// COUNTDOWN WIDGET
// Compact ticking countdown display
// ============================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { ContractDeadline } from "@/types";

interface CountdownWidgetProps {
  deadline: ContractDeadline;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  overdue: boolean;
}

export function CountdownWidget({ deadline }: CountdownWidgetProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  function calculateTimeLeft(): TimeLeft {
    const now = new Date();
    const target = new Date(deadline.deadline_date + "T09:00:00+05:30"); // 9 AM IST
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) {
      return {
        days: Math.floor(Math.abs(diff) / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (Math.abs(diff) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        ),
        minutes: Math.floor((Math.abs(diff) % (1000 * 60 * 60)) / (1000 * 60)),
        overdue: true,
      };
    }

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      overdue: false,
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline.deadline_date]);

  const getColor = () => {
    if (timeLeft.overdue) return "text-red-700 dark:text-red-500 font-black";
    if (timeLeft.days < 1) return "text-red-700 dark:text-red-500 font-black";
    if (timeLeft.days < 7)
      return "text-orange-700 dark:text-orange-500 font-black";
    if (timeLeft.days < 30)
      return "text-amber-700 dark:text-amber-500 font-black";
    return "text-blue-700 dark:text-blue-500 font-black";
  };

  return (
    <Link
      href={`/timebomb/${deadline.document_id}`}
      className="block border-4 border-black bg-white dark:bg-zinc-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none transition-all"
    >
      <div className="flex items-center gap-2 mb-4 border-b-2 border-black pb-2">
        {timeLeft.overdue ? (
          <motion.div
            animate={{ x: [0, -2, 2, -2, 2, 0] }}
            transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.4 }}
          >
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-500 stroke-[3px]" />
          </motion.div>
        ) : (
          <Clock className="w-5 h-5 text-black dark:text-white stroke-[3px]" />
        )}
        <span className="text-xs font-black uppercase tracking-widest text-foreground">
          {timeLeft.overdue ? "OVERDUE" : "NEXT DEADLINE"}
        </span>
      </div>

      {/* Countdown display */}
      <div
        className={`flex items-baseline gap-1 ${getColor()} tabular-nums tracking-tighter`}
      >
        {timeLeft.overdue && (
          <motion.span
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-xs mr-2 uppercase tracking-widest"
          >
            OVERDUE BY
          </motion.span>
        )}

        <CountdownUnit value={timeLeft.days} label="DAYS" />
        <span className="text-muted-foreground mx-1 font-black">:</span>
        <CountdownUnit value={timeLeft.hours} label="HRS" />
        <span className="text-muted-foreground mx-1 font-black">:</span>
        <CountdownUnit value={timeLeft.minutes} label="MIN" />
      </div>

      {/* Deadline title */}
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-3 truncate">
        {deadline.title}
      </p>
    </Link>
  );
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="text-3xl font-black"
        >
          {String(value).padStart(2, "0")}
        </motion.span>
      </AnimatePresence>
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
        {label}
      </span>
    </div>
  );
}
