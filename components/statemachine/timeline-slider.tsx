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
    [totalMonths, onMonthChange]
  );

  const getMonthFromPointer = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return ratio * totalMonths;
    },
    [totalMonths]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      handleMonthUpdate(getMonthFromPointer(e.clientX));
    },
    [getMonthFromPointer, handleMonthUpdate]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      handleMonthUpdate(getMonthFromPointer(e.clientX));
    },
    [isDragging, getMonthFromPointer, handleMonthUpdate]
  );

  const handlePointerUp = useCallback(() => setIsDragging(false), []);

  // State segments for colored track
  const segments = useMemo(() => {
    const segs: Array<{ fromMonth: number; toMonth: number; color: string }> = [];
    const sorted = [...events].sort((a, b) => a.month - b.month);
    let prevMonth = 0;

    for (const ev of sorted) {
      if (ev.month > prevMonth) {
        const color = ev.type === "risk" || ev.type === "trap_entry" ? "#ef4444" :
                      ev.type === "deadline" ? "#f59e0b" : "#10b981";
        segs.push({ fromMonth: prevMonth, toMonth: ev.month, color });
      }
      prevMonth = ev.month;
    }

    if (prevMonth < totalMonths) {
      segs.push({ fromMonth: prevMonth, toMonth: totalMonths, color: "#10b981" });
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
    <div className="space-y-6">
      {/* Current state label */}
      {currentState && (
        <div className="flex items-center justify-between p-4 bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-1">Month {currentMonth}</p>
            <p className="text-lg font-black uppercase tracking-widest text-black">{currentState.name}</p>
          </div>
          <span
            className="text-xs font-black uppercase tracking-widest px-3 py-1 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
            style={{
              backgroundColor: currentState.isTrap ? "#fca5a5" : "#6ee7b7",
              color: "#000000",
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
          className="relative h-6 bg-white border-4 border-black shadow-[inset_0_-4px_0_0_rgba(0,0,0,0.1)] cursor-pointer overflow-hidden"
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
                  opacity: 0.3,
                  borderLeft: i > 0 ? `2px solid black` : undefined,
                }}
              />
            );
          })}

          {/* Progress fill */}
          <div
            className="absolute inset-y-0 left-0 bg-blue-500 border-r-4 border-black"
            style={{ width: `${(currentMonth / totalMonths) * 100}%` }}
          />
        </div>

        {/* Draggable thumb */}
        <motion.div
          className="absolute top-[26px] w-6 h-10 -mt-2 -ml-3 bg-yellow-400 border-4 border-black cursor-grab active:cursor-grabbing z-10 shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
          style={{ left: `${(currentMonth / totalMonths) * 100}%` }}
          animate={{ scale: isDragging ? 1.1 : 1 }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div className="w-1 h-4 bg-black mx-auto mt-2" />
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
                className="w-4 h-4 -ml-2 border-2 border-black"
                style={{ backgroundColor: color }}
              />

              {/* Tooltip */}
              {hoveredEvent === ev && (
                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 z-30">
                  <div className="bg-white border-4 border-black p-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                    <p className="font-black text-black leading-tight">{ev.event}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-black/60 mt-1">Month {ev.month}</p>
                    {ev.userAction && (
                      <p className="text-xs font-bold text-blue-800 mt-2 bg-blue-100 p-1 border-2 border-blue-900 border-dashed">📋 {ev.userAction}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Tick marks */}
        <div className="absolute top-[60px] left-0 right-0 flex justify-between pointer-events-none">
          {ticks.map((month) => (
            <span
              key={month}
              className="text-[10px] font-black text-black"
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
        <div className="space-y-3 mt-4">
          <p className="text-[10px] text-black font-black uppercase tracking-widest border-b-2 border-black pb-1 inline-block">
            Events near month {currentMonth}
          </p>
          {nearbyEvents.map((ev, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
            >
              <span className="text-2xl flex-shrink-0 bg-gray-100 p-1 border-2 border-black">{EVENT_ICONS[ev.type]}</span>
              <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-widest text-black truncate">{ev.event}</p>
                {ev.userAction && (
                  <p className="text-xs font-bold text-blue-900 mt-1 bg-blue-100 inline-block px-1 border-2 border-blue-900">📋 {ev.userAction}</p>
                )}
              </div>
              <span className="text-[10px] font-black text-black ml-auto bg-yellow-400 border-2 border-black px-2 py-1 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">M{ev.month}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
