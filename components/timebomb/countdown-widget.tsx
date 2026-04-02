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
          (Math.abs(diff) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        ),
        minutes: Math.floor(
          (Math.abs(diff) % (1000 * 60 * 60)) / (1000 * 60)
        ),
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
    if (timeLeft.overdue) return "text-red-600";
    if (timeLeft.days < 1) return "text-red-600";
    if (timeLeft.days < 7) return "text-amber-600";
    if (timeLeft.days < 30) return "text-amber-500";
    return "text-indigo-600";
  };

  return (
    <Link
      href={`/timebomb/${deadline.document_id}`}
      className="block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 p-4 hover:border-indigo-300 hover:shadow-md transition-all group"
    >
      <div className="flex items-center gap-2 mb-3">
        {timeLeft.overdue ? (
          <motion.div
            animate={{ x: [0, -2, 2, -2, 2, 0] }}
            transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.4 }}
          >
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </motion.div>
        ) : (
          <Clock className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
        )}
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          {timeLeft.overdue ? "OVERDUE" : "Next Deadline"}
        </span>
      </div>

      {/* Countdown display */}
      <div className={`flex items-baseline gap-1 ${getColor()}`}>
        {timeLeft.overdue && (
          <motion.span
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-xs mr-1"
          >
            OVERDUE by
          </motion.span>
        )}

        <CountdownUnit value={timeLeft.days} label="days" />
        <span className="text-slate-300 font-bold mx-0.5">:</span>
        <CountdownUnit value={timeLeft.hours} label="hrs" />
        <span className="text-slate-300 font-bold mx-0.5">:</span>
        <CountdownUnit value={timeLeft.minutes} label="min" />
      </div>

      {/* Deadline title */}
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-2 truncate group-hover:text-indigo-700 transition-colors">{deadline.title}</p>
    </Link>
  );
}

function CountdownUnit({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-baseline gap-0.5">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="text-lg md:text-xl lg:text-2xl font-black tabular-nums tracking-tighter drop-shadow-sm dark:shadow-slate-900/20"
        >
          {String(value).padStart(2, "0")}
        </motion.span>
      </AnimatePresence>
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-0.5">{label}</span>
    </div>
  );
}
