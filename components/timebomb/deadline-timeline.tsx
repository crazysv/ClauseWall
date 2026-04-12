"use client";

// ============================================
// DEADLINE TIMELINE
// Main visual vertical timeline component
// ============================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, ShieldCheck, PartyPopper } from "lucide-react";
import type { ContractDeadline, TimelineEvent } from "@/types";
import {
  buildTimelineEvents,
  calculateDaysUntil,
} from "@/lib/timebomb/date-calculator";
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
      (d) => d.status === "defused" || d.status === "action_taken",
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
        e.deadline.status !== "action_taken",
    ).length,
    upcoming: events.filter(
      (e) =>
        e.days_from_now >= 0 &&
        e.deadline.status !== "defused" &&
        e.deadline.status !== "action_taken",
    ).length,
    defused: events.filter(
      (e) =>
        e.deadline.status === "defused" || e.deadline.status === "action_taken",
    ).length,
    missed: events.filter((e) => e.deadline.status === "missed").length,
  };

  // Find today position for the timeline
  const todayIdx = filteredEvents.findIndex((e) => e.days_from_now >= 0);

  if (deadlines.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-neutral-800">
        <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-300 mb-2">
          [ NO_DEADLINES_FOUND ] 🎉
        </p>
        <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600">
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
        className="text-center py-16 border border-emerald-900/50 bg-emerald-950/10"
      >
        <PartyPopper className="w-12 h-12 mx-auto text-emerald-500 mb-6" />
        <h3 className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-2">
          ALL DEADLINES DEFUSED 🛡️
        </h3>
        <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 max-w-md mx-auto leading-relaxed">
          YOU&apos;VE ADDRESSED EVERY DEADLINE IN THIS CONTRACT. YOU&apos;RE
          PROTECTED.
        </p>
      </motion.div>
    );
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-1.5 mb-6 flex-wrap border-b border-neutral-900 pb-3">
        <div className="p-1.5 border border-neutral-800 bg-[#050505] mr-1">
          <Filter className="w-3.5 h-3.5 text-neutral-500" />
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
            className={`px-2.5 py-1 font-mono uppercase tracking-widest text-[7px] border transition-colors ${
              filter === f.key
                ? "bg-amber-950/20 text-amber-400 border-amber-900/50"
                : "bg-[#050505] text-neutral-600 border-neutral-800 hover:border-neutral-700 hover:text-neutral-400"
            }`}
            aria-label={`Filter ${f.label}`}
          >
            {f.label}
            <span
              className={`ml-1.5 px-1 py-0.5 text-[7px] ${filter === f.key ? "text-amber-400/70" : "text-neutral-700"}`}
            >
              {counts[f.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative pt-4">
        {/* Vertical line */}
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute left-6 md:left-1/2 top-4 bottom-0 w-px bg-neutral-800 origin-top -translate-x-[0.5px]"
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
                    <div className="h-px flex-1 bg-neutral-800 max-w-[80px]" />
                    <motion.span
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                      }}
                      className="text-[8px] font-mono uppercase tracking-widest text-amber-400 px-3 py-1 border border-amber-900/50 bg-amber-950/20"
                    >
                      TODAY
                    </motion.span>
                    <div className="h-px flex-1 bg-neutral-800 max-w-[80px]" />
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
                      className="w-3 h-3 border border-neutral-700"
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
                    <span className="absolute left-8 md:hidden top-0 text-[8px] font-mono uppercase tracking-widest text-neutral-600 whitespace-nowrap bg-[#0a0a0a] px-1">
                      {new Date(event.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      •{" "}
                      {daysUntil >= 0
                        ? `${daysUntil}d`
                        : `${Math.abs(daysUntil)}d ago`}
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
                    <ShieldCheck className="w-4 h-4 text-emerald-500 z-20" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty filter state */}
        {filteredEvents.length === 0 && (
          <div className="text-center py-12 border border-dashed border-neutral-800 my-8">
            <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-600">
              NO {filter.toUpperCase()} DEADLINES FOUND.
            </p>
            <button
              onClick={() => setFilter("all")}
              className="mt-4 px-3 py-1.5 border border-neutral-800 bg-[#050505] font-mono uppercase tracking-widest text-[8px] text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 transition-colors"
            >
              SHOW ALL DEADLINES
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
