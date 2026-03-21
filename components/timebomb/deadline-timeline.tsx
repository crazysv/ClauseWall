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
      <div className="text-center py-16">
        <p className="text-white/40 text-lg">
          No deadlines found in this contract 🎉
        </p>
        <p className="text-white/20 text-sm mt-2">
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
        className="text-center py-16"
      >
        <PartyPopper className="w-12 h-12 mx-auto text-green-400 mb-4" />
        <h3 className="text-xl font-bold text-green-400 mb-2">
          All Deadlines Defused! 🛡️
        </h3>
        <p className="text-white/40">
          You&apos;ve addressed every deadline in this contract. You&apos;re protected.
        </p>
      </motion.div>
    );
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter className="w-4 h-4 text-white/30" />
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
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              filter === f.key
                ? "bg-white/10 border-white/20 text-white"
                : "bg-white/[0.02] border-white/5 text-white/40 hover:text-white/60"
            }`}
            aria-label={`Filter ${f.label}`}
          >
            {f.label}
            <span className="ml-1.5 text-white/30">
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
          className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent origin-top"
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
                    className="relative flex items-center gap-2 mb-4 pl-4 md:pl-0 md:justify-center"
                  >
                    <div className="h-px flex-1 bg-orange-500/30 max-w-[100px]" />
                    <motion.span
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                      }}
                      className="text-xs font-bold text-orange-400 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20"
                    >
                      TODAY
                    </motion.span>
                    <div className="h-px flex-1 bg-orange-500/30 max-w-[100px]" />
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
                  <div className="relative z-10 flex-shrink-0 -ml-4 md:ml-0">
                    <motion.div
                      className="w-3 h-3 rounded-full border-2 border-gray-900"
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
                    <span className="absolute left-5 md:hidden top-0 text-[10px] text-white/30 whitespace-nowrap">
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
                    className="absolute left-2 md:left-1/2 md:-translate-x-1/2 top-0"
                  >
                    <ShieldCheck className="w-4 h-4 text-green-400" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty filter state */}
        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/30 text-sm">
              No {filter} deadlines found.
            </p>
            <button
              onClick={() => setFilter("all")}
              className="text-blue-400 text-xs mt-2 hover:underline"
            >
              Show all deadlines
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
