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
      <div className="text-center py-16 border-4 border-dashed border-black bg-white dark:bg-zinc-950">
        <p className="text-foreground font-black uppercase tracking-widest text-xl mb-2">
          NO DEADLINES FOUND IN THIS CONTRACT 🎉
        </p>
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-sm">
          THIS CONTRACT HAS NO SIGNIFICANT TEMPORAL OBLIGATIONS.
        </p>
      </div>
    );
  }

  if (allDefused) {
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center py-16 border-4 border-black bg-green-100 dark:bg-green-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
      >
        <PartyPopper className="w-16 h-16 mx-auto text-green-600 dark:text-green-500 mb-6 stroke-[3px]" />
        <h3 className="text-2xl font-black text-green-700 dark:text-green-400 mb-2 uppercase tracking-widest">
          ALL DEADLINES DEFUSED! 🛡️
        </h3>
        <p className="text-green-900 dark:text-green-300 font-bold uppercase tracking-widest max-w-md mx-auto leading-relaxed">
          YOU&apos;VE ADDRESSED EVERY DEADLINE IN THIS CONTRACT. YOU&apos;RE PROTECTED.
        </p>
      </motion.div>
    );
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-8 flex-wrap border-b-4 border-black pb-4">
        <div className="p-2 border-4 border-black bg-white dark:bg-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <Filter className="w-5 h-5 text-black dark:text-white stroke-[3px]" />
        </div>
        {(
          [
            { key: "all", label: "ALL" },
            { key: "critical", label: "CRITICAL" },
            { key: "upcoming", label: "UPCOMING" },
            { key: "defused", label: "DEFUSED" },
            { key: "missed", label: "MISSED" },
          ] as { key: FilterType; label: string }[]
        ).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 font-black uppercase tracking-widest text-xs border-4 border-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none ${
              filter === f.key
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "bg-white text-black dark:bg-zinc-900 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800"
            }`}
            aria-label={`Filter ${f.label}`}
          >
            {f.label}
            <span className={`ml-2 px-1.5 py-0.5 border-2 border-black text-[10px] ${filter === f.key ? 'bg-white text-black dark:bg-black dark:text-white' : 'bg-gray-200 text-black dark:bg-zinc-800 dark:text-white'}`}>
              {counts[f.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative pt-4">
        {/* Vertical line mt-4 is optional, handled by wrapper padding */}
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute left-6 md:left-1/2 top-4 bottom-0 w-1.5 border-l-4 border-r-4 border-black bg-black origin-top -translate-x-[3px]"
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
                    className="relative flex items-center gap-4 mb-8 pl-8 md:pl-0 md:justify-center z-10"
                  >
                    <div className="h-1 flex-1 bg-black max-w-[80px]" />
                    <motion.span
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                      }}
                      className="text-xs font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 px-4 py-2 border-4 border-black bg-orange-100 dark:bg-orange-950 shadow-[4px_4px_0px_0px_rgba(249,115,22,1)]"
                    >
                      TODAY
                    </motion.span>
                    <div className="h-1 flex-1 bg-black max-w-[80px]" />
                  </motion.div>
                )}

                {/* Timeline node */}
                <div className="flex items-start gap-6 pl-6 md:pl-0">
                  {/* Mobile: all on right. Desktop: alternate */}
                  <div className="hidden md:block md:w-1/2 md:pr-10">
                    {isLeft && (
                      <div className="flex justify-end">
                        <div className="max-w-xl w-full">
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
                  <div className="relative z-10 flex-shrink-0 -ml-[5px] md:ml-[3px]">
                    <motion.div
                      className="w-5 h-5 border-4 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      style={{ backgroundColor: event.urgency_color }}
                      animate={
                        event.deadline.urgency === "critical" &&
                        !event.deadline.status.includes("defus")
                          ? {
                              scale: [1, 1.2, 1],
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
                    <span className="absolute left-8 md:hidden top-0 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap bg-background px-1">
                      {new Date(event.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      • {daysUntil >= 0 ? `${daysUntil}d` : `${Math.abs(daysUntil)}d ago`}
                    </span>
                  </div>

                  <div className="hidden md:block md:w-1/2 md:pl-10">
                    {!isLeft && (
                      <div className="max-w-xl w-full">
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
                    className="absolute left-[3px] md:left-1/2 md:-translate-x-1/2 -top-1"
                  >
                    <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-500 fill-white dark:fill-black stroke-[3px] z-20" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty filter state */}
        {filteredEvents.length === 0 && (
          <div className="text-center py-12 border-4 border-dashed border-black bg-gray-50 dark:bg-zinc-900 my-8">
            <p className="text-muted-foreground font-black uppercase tracking-widest text-sm">
              NO {filter.toUpperCase()} DEADLINES FOUND.
            </p>
            <button
              onClick={() => setFilter("all")}
              className="mt-4 px-4 py-2 border-4 border-black bg-white dark:bg-black font-black uppercase tracking-widest text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none transition-all"
            >
              SHOW ALL DEADLINES
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
