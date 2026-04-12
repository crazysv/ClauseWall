"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import type {
  TimelineEvent,
  ContractStateMachine,
  TimelineEventType,
} from "@/lib/statemachine/types";

interface TimelineSliderProps {
  events: TimelineEvent[];
  totalMonths: number;
  stateMachine: ContractStateMachine;
  onMonthChange?: (month: number) => void;
}

const EVENT_COLORS: Record<TimelineEventType, string> = {
  normal: "#10b981",
  milestone: "#3b82f6",
  deadline: "#f59e0b",
  risk: "#f97316",
  trap_entry: "#ef4444",
  action_required: "#a855f7",
};

const EVENT_ICONS: Record<TimelineEventType, string> = {
  normal: "●",
  milestone: "🏁",
  deadline: "⏰",
  risk: "⚠️",
  trap_entry: "🪤",
  action_required: "📋",
};

export default function TimelineSlider({
  events,
  totalMonths,
  stateMachine,
  onMonthChange,
}: TimelineSliderProps) {
  const [currentMonth, setCurrentMonth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredEvent, setHoveredEvent] = useState<TimelineEvent | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const handleMonthUpdate = useCallback(
    (month: number) => {
      const clamped = Math.max(0, Math.min(totalMonths, Math.round(month)));
      setCurrentMonth(clamped);
      onMonthChange?.(clamped);
    },
    [totalMonths, onMonthChange],
  );

  const getMonthFromPointer = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width),
      );
      return ratio * totalMonths;
    },
    [totalMonths],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      handleMonthUpdate(getMonthFromPointer(e.clientX));
    },
    [getMonthFromPointer, handleMonthUpdate],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      handleMonthUpdate(getMonthFromPointer(e.clientX));
    },
    [isDragging, getMonthFromPointer, handleMonthUpdate],
  );

  const handlePointerUp = useCallback(() => setIsDragging(false), []);

  // State segments for colored track
  const segments = useMemo(() => {
    const segs: Array<{ fromMonth: number; toMonth: number; color: string }> =
      [];
    const sorted = [...events].sort((a, b) => a.month - b.month);
    let prevMonth = 0;

    for (const ev of sorted) {
      if (ev.month > prevMonth) {
        const color =
          ev.type === "risk" || ev.type === "trap_entry"
            ? "#ef4444"
            : ev.type === "deadline"
              ? "#f59e0b"
              : "#10b981";
        segs.push({ fromMonth: prevMonth, toMonth: ev.month, color });
      }
      prevMonth = ev.month;
    }

    if (prevMonth < totalMonths) {
      segs.push({
        fromMonth: prevMonth,
        toMonth: totalMonths,
        color: "#10b981",
      });
    }

    return segs;
  }, [events, totalMonths]);

  // Events at or near current month
  const nearbyEvents = useMemo(() => {
    return events.filter((e) => Math.abs(e.month - currentMonth) <= 1);
  }, [events, currentMonth]);

  // Current state at this month
  const currentState = useMemo(() => {
    // Find the most recent event at or before current month
    const pastEvents = events.filter((e) => e.month <= currentMonth);
    if (pastEvents.length === 0) return null;
    const latest = pastEvents[pastEvents.length - 1];
    return stateMachine.states.find((s) => s.id === latest.stateId) || null;
  }, [events, currentMonth, stateMachine]);

  // Tick marks
  const ticks = useMemo(() => {
    const result: number[] = [];
    const interval = totalMonths <= 12 ? 1 : totalMonths <= 24 ? 3 : 6;
    for (let m = 0; m <= totalMonths; m += interval) {
      result.push(m);
    }
    return result;
  }, [totalMonths]);

  return (
    <div className="space-y-5">
      {/* Current state label */}
      {currentState && (
        <div className="flex items-center justify-between p-3 bg-[#050505] border border-neutral-800">
          <div>
            <p className="text-[7px] font-mono uppercase tracking-widest text-neutral-600 mb-0.5">
              Month {currentMonth}
            </p>
            <p className="text-xs font-mono uppercase tracking-widest text-neutral-200">
              {currentState.name}
            </p>
          </div>
          <span
            className="text-[7px] font-mono uppercase tracking-widest px-2 py-0.5 border"
            style={{
              backgroundColor: currentState.isTrap ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
              borderColor: currentState.isTrap ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)",
              color: currentState.isTrap ? "#f87171" : "#34d399",
            }}
          >
            {currentState.type.replace(/_/g, " ")}
          </span>
        </div>
      )}

      {/* Timeline Track */}
      <div className="relative pt-8 pb-10">
        <div
          ref={trackRef}
          className="relative h-3 bg-[#050505] border border-neutral-800 cursor-pointer overflow-hidden"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Colored segments */}
          {segments.map((seg, i) => {
            const left = (seg.fromMonth / totalMonths) * 100;
            const width = ((seg.toMonth - seg.fromMonth) / totalMonths) * 100;
            return (
              <div
                key={i}
                className="absolute inset-y-0"
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  backgroundColor: seg.color,
                  opacity: 0.2,
                  borderLeft: i > 0 ? `1px solid rgba(255,255,255,0.1)` : undefined,
                }}
              />
            );
          })}

          {/* Progress fill */}
          <div
            className="absolute inset-y-0 left-0 bg-cyan-500/40 border-r border-cyan-400/50"
            style={{ width: `${(currentMonth / totalMonths) * 100}%` }}
          />
        </div>

        {/* Draggable thumb */}
        <motion.div
          className="absolute top-[28px] w-4 h-7 -mt-2 -ml-2 bg-cyan-400 border border-cyan-300 cursor-grab active:cursor-grabbing z-10"
          style={{ left: `${(currentMonth / totalMonths) * 100}%` }}
          animate={{ scale: isDragging ? 1.1 : 1 }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div className="w-px h-3 bg-cyan-900 mx-auto mt-1.5" />
        </motion.div>

        {/* Event markers */}
        {events.map((ev, i) => {
          const left = (ev.month / totalMonths) * 100;
          const color = EVENT_COLORS[ev.type];

          return (
            <div
              key={`${ev.stateId}-${ev.month}-${i}`}
              className="absolute top-2 cursor-pointer group z-20"
              style={{ left: `${left}%` }}
              onMouseEnter={() => setHoveredEvent(ev)}
              onMouseLeave={() => setHoveredEvent(null)}
            >
              <div
                className="w-3 h-3 -ml-1.5"
                style={{ backgroundColor: color }}
              />

              {/* Tooltip */}
              {hoveredEvent === ev && (
                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 z-30">
                  <div className="bg-[#0a0a0a] border border-neutral-800 p-3">
                    <p className="text-[8px] font-mono text-neutral-200 leading-tight">
                      {ev.event}
                    </p>
                    <p className="text-[7px] font-mono uppercase tracking-widest text-neutral-600 mt-1">
                      Month {ev.month}
                    </p>
                    {ev.userAction && (
                      <p className="text-[7px] font-mono text-cyan-400 mt-1.5 bg-cyan-950/10 p-1 border border-dashed border-cyan-900/50">
                        📋 {ev.userAction}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Tick marks */}
        <div className="absolute top-[52px] left-0 right-0 flex justify-between pointer-events-none">
          {ticks.map((month) => (
            <span
              key={month}
              className="text-[7px] font-mono tabular-nums text-neutral-600"
              style={{
                position: "absolute",
                left: `${(month / totalMonths) * 100}%`,
                transform: "translateX(-50%)",
              }}
            >
              {month}mo
            </span>
          ))}
        </div>
      </div>

      {/* Events at current month */}
      {nearbyEvents.length > 0 && (
        <div className="space-y-2 mt-3">
          <p className="text-[7px] text-neutral-500 font-mono uppercase tracking-widest border-b border-neutral-800 pb-1 inline-block">
            Events near month {currentMonth}
          </p>
          {nearbyEvents.map((ev, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 p-3 bg-[#050505] border border-neutral-800"
            >
              <span className="text-lg flex-shrink-0 bg-[#0a0a0a] p-1 border border-neutral-800">
                {EVENT_ICONS[ev.type]}
              </span>
              <div className="min-w-0">
                <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-300 truncate">
                  {ev.event}
                </p>
                {ev.userAction && (
                  <p className="text-[7px] font-mono text-cyan-400 mt-1 bg-cyan-950/10 inline-block px-1 border border-dashed border-cyan-900/50">
                    📋 {ev.userAction}
                  </p>
                )}
              </div>
              <span className="text-[7px] font-mono text-neutral-200 ml-auto bg-amber-950/20 border border-amber-900/50 px-1.5 py-0.5">
                M{ev.month}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
