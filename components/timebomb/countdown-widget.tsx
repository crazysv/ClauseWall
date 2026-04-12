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
    if (timeLeft.overdue) return "text-red-500 font-mono";
    if (timeLeft.days < 1) return "text-red-500 font-mono";
    if (timeLeft.days < 7) return "text-amber-500 font-mono";
    if (timeLeft.days < 30) return "text-amber-400 font-mono";
    return "text-cyan-400 font-mono";
  };

  return (
    <Link
      href={`/timebomb/${deadline.document_id}`}
      className="block border border-neutral-900 bg-[#0a0a0a] p-4 hover:border-neutral-700 transition-colors"
    >
      <div className="flex items-center gap-2 mb-4 border-b border-neutral-900 pb-2">
        {timeLeft.overdue ? (
          <motion.div
            animate={{ x: [0, -2, 2, -2, 2, 0] }}
            transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.4 }}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
          </motion.div>
        ) : (
          <Clock className="w-3.5 h-3.5 text-neutral-600" />
        )}
        <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-400">
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
            className="text-[8px] mr-2 uppercase tracking-widest"
          >
            OVERDUE BY
          </motion.span>
        )}

        <CountdownUnit value={timeLeft.days} label="DAYS" />
        <span className="text-neutral-700 mx-1">:</span>
        <CountdownUnit value={timeLeft.hours} label="HRS" />
        <span className="text-neutral-700 mx-1">:</span>
        <CountdownUnit value={timeLeft.minutes} label="MIN" />
      </div>

      {/* Deadline title */}
      <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 mt-3 truncate">
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
          className="text-2xl font-mono tabular-nums"
        >
          {String(value).padStart(2, "0")}
        </motion.span>
      </AnimatePresence>
      <span className="text-[7px] font-mono uppercase tracking-widest text-neutral-600 ml-0.5">
        {label}
      </span>
    </div>
  );
}
