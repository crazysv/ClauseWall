"use client";

// ============================================
// DEADLINE TIMELINE
// Main visual vertical timeline component
// ============================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, ShieldCheck, PartyPopper } from "lucide-react";
import type { ContractDeadline, TimelineEvent } from "@/types";
import { buildTimelineEvents, calculateDaysUntil } from "@/lib/timebomb/date-calculator";
import { DeadlineCard } from "./deadline-card";

interface DeadlineTimelineProps {
  deadlines: ContractDeadline[];
  onDefuse: (id: string) => void;
  documentId: string;
}

type FilterType = "all" | "critical" | "upcoming" | "defused" | "missed";

export function DeadlineTimeline({
  deadlines,
  onDefuse,
  documentId,
}: DeadlineTimelineProps) {
  const [filter, setFilter] = useState<FilterType>("all");

  const events = buildTimelineEvents(deadlines);
  const allDefused =
    deadlines.length > 0 &&
    deadlines.every(
      (d) => d.status === "defused" || d.status === "action_taken"
    );

  // Filter events
  const filteredEvents = events.filter((e) => {
    switch (filter) {
      case "critical":
        return (
          e.deadline.urgency === "critical" &&
          e.deadline.status !== "defused" &&
          e.deadline.status !== "action_taken"
        );
      case "upcoming":
        return (
          e.days_from_now >= 0 &&
          e.deadline.status !== "defused" &&
          e.deadline.status !== "action_taken"
        );
      case "defused":
        return (
          e.deadline.status === "defused" ||
          e.deadline.status === "action_taken"
        );
      case "missed":
        return e.deadline.status === "missed";
      default:
        return true;
    }
  });

  // Counts for filter badges
  const counts = {
    all: events.length,
    critical: events.filter(
      (e) =>
        e.deadline.urgency === "critical" &&
        e.deadline.status !== "defused" &&
        e.deadline.status !== "action_taken"
    ).length,
    upcoming: events.filter(
      (e) =>
        e.days_from_now >= 0 &&
        e.deadline.status !== "defused" &&
        e.deadline.status !== "action_taken"
    ).length,
    defused: events.filter(
      (e) =>
        e.deadline.status === "defused" ||
        e.deadline.status === "action_taken"
    ).length,
    missed: events.filter((e) => e.deadline.status === "missed").length,
  };

  // Find today position for the timeline
  const todayIdx = filteredEvents.findIndex((e) => e.days_from_now >= 0);

  if (deadlines.length === 0) {
    return (
      <div className="text-center py-8 md:py-6 md:py-8 lg:py-12 lg:py-16 bg-white dark:bg-card border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm dark:shadow-slate-900/20">
        <p className="text-slate-500 dark:text-slate-400 font-black text-xl mb-3 mt-4 tracking-tight">
          No deadlines found in this contract 🎉
        </p>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">
          This contract has no significant temporal obligations.
        </p>
      </div>
    );
  }

  if (allDefused) {
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center py-8 md:py-6 md:py-8 lg:py-12 lg:py-16 bg-emerald-50 border border-emerald-200 rounded-3xl shadow-sm dark:shadow-slate-900/20 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-white dark:bg-slate-900/40 pointer-events-none" />
        <div className="relative z-10">
          <PartyPopper className="w-12 h-12 mx-auto text-emerald-500 mb-4" />
          <h3 className="text-lg md:text-xl lg:text-2xl font-black tracking-tight text-emerald-700 mb-2">
            All Deadlines Defused! 🛡️
          </h3>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 leading-relaxed max-w-sm mx-auto">
            You&apos;ve addressed every deadline in this contract. You&apos;re protected.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-8 flex-wrap">
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-xl shadow-sm dark:shadow-slate-900/20">
          <Filter className="w-5 h-5 text-slate-400" />
        </div>
        {(
          [
            { key: "all", label: "All" },
            { key: "critical", label: "Critical" },
            { key: "upcoming", label: "Upcoming" },
            { key: "defused", label: "Defused" },
            { key: "missed", label: "Missed" },
          ] as { key: FilterType; label: string }[]
        ).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${ filter === f.key ? "bg-indigo-600 border-indigo-700 text-white shadow-md shadow-indigo-600/20" : "bg-white dark:bg-card border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm dark:shadow-slate-900/20 hover:shadow" }`}
            aria-label={`Filter ${f.label}`}
          >
            {f.label}
            <span className={`ml-2 px-1.5 py-0.5 rounded-md ${filter === f.key ? 'bg-indigo-700/50 text-indigo-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'}`}>
              {counts[f.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-slate-300 via-slate-200 to-transparent origin-top rounded-full ml-[-1px] md:ml-[calc(-2px)]"
        />

        <AnimatePresence mode="popLayout">
          {filteredEvents.map((event, index) => {
            const isLeft = index % 2 === 0;
            const daysUntil = calculateDaysUntil(event.date);

            return (
              <motion.div
                key={event.deadline.id}
                initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="relative mb-4"
              >
                {/* TODAY marker */}
                {index === todayIdx && todayIdx > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative flex items-center gap-2 mb-6 pl-4 md:pl-0 md:justify-center"
                  >
                    <div className="h-0.5 flex-1 bg-orange-300 max-w-[100px] rounded-full" />
                    <motion.span
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                      }}
                      className="text-[10px] font-black uppercase tracking-widest text-orange-700 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 shadow-sm dark:shadow-slate-900/20 shadow-orange-500/10"
                    >
                      TODAY
                    </motion.span>
                    <div className="h-0.5 flex-1 bg-orange-300 max-w-[100px] rounded-full" />
                  </motion.div>
                )}

                {/* Timeline node */}
                <div className="flex items-start gap-4 pl-4 md:pl-0">
                  {/* Mobile: all on right. Desktop: alternate */}
                  <div className="hidden md:block md:w-1/2 md:pr-8">
                    {isLeft && (
                      <div className="flex justify-end">
                        <div className="max-w-md w-full">
                          <DeadlineCard
                            deadline={event.deadline}
                            onDefuse={onDefuse}
                            documentId={documentId}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dot on the line */}
                  <div className="relative z-10 flex-shrink-0 -ml-[19px] md:ml-[calc(-7px)] mt-4">
                    <motion.div
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm dark:shadow-slate-900/20 ring-1 ring-slate-200"
                      style={{ backgroundColor: event.urgency_color }}
                      animate={
                        event.deadline.urgency === "critical" &&
                        !event.deadline.status.includes("defus")
                          ? {
                              boxShadow: [
                                `0 0 0 0px ${event.urgency_color}40`,
                                `0 0 0 6px ${event.urgency_color}00`,
                              ],
                            }
                          : {}
                      }
                      transition={
                        event.deadline.urgency === "critical"
                          ? { repeat: Infinity, duration: 1.5 }
                          : {}
                      }
                    />
                    {/* Date label */}
                    <span className="absolute left-6 md:hidden -top-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap bg-white dark:bg-card/80 py-0.5 px-2 rounded border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 backdrop-blur-sm">
                      {new Date(event.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      • {daysUntil >= 0 ? `${daysUntil}d` : `${Math.abs(daysUntil)}d ago`}
                    </span>
                  </div>

                  <div className="hidden md:block md:w-1/2 md:pl-8">
                    {!isLeft && (
                      <div className="max-w-md w-full">
                        <DeadlineCard
                          deadline={event.deadline}
                          onDefuse={onDefuse}
                          documentId={documentId}
                        />
                      </div>
                    )}
                  </div>

                  {/* Mobile card */}
                  <div className="md:hidden flex-1 ml-4">
                    <DeadlineCard
                      deadline={event.deadline}
                      onDefuse={onDefuse}
                      documentId={documentId}
                    />
                  </div>
                </div>

                {/* Defused checkmark */}
                {(event.deadline.status === "defused" ||
                  event.deadline.status === "action_taken") && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute left-2.5 md:left-1/2 md:-translate-x-1/2 -top-2 bg-emerald-100 rounded-full border border-emerald-200 p-0.5 shadow-sm dark:shadow-slate-900/20"
                  >
                    <ShieldCheck className="w-5 h-5 text-emerald-600 drop-shadow-sm dark:shadow-slate-900/20" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty filter state */}
        {filteredEvents.length === 0 && (
          <div className="text-center py-8 md:py-6 md:py-8 lg:py-12 lg:py-16 bg-white dark:bg-card border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm dark:shadow-slate-900/20">
            <p className="text-slate-500 dark:text-slate-400 font-black text-xl mb-2 tracking-tight mt-4">
              No {filter} deadlines found.
            </p>
            <button
              onClick={() => setFilter("all")}
              className="text-indigo-600 font-bold uppercase tracking-widest text-[10px] mt-2 hover:text-indigo-700 hover:underline mb-4"
            >
              Show all deadlines
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
