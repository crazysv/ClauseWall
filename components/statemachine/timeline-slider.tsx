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
    <div className="space-y-4">
      {/* Current state label */}
      {currentState && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Month {currentMonth}</p>
            <p className="text-sm font-medium">{currentState.name}</p>
          </div>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full border"
            style={{
              backgroundColor: currentState.isTrap ? "#450a0a" : "#022c22",
              borderColor: currentState.isTrap ? "#ef444440" : "#10b98140",
              color: currentState.isTrap ? "#ef4444" : "#10b981",
            }}
          >
            {currentState.type.replace(/_/g, " ")}
          </span>
        </div>
      )}

      {/* Timeline Track */}
      <div className="relative pt-6 pb-8">
        <div
          ref={trackRef}
          className="relative h-3 rounded-full bg-gray-800 cursor-pointer overflow-hidden"
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
                  backgroundColor: `${seg.color}20`,
                  borderLeft: i > 0 ? `1px solid ${seg.color}30` : undefined,
                }}
              />
            );
          })}

          {/* Progress fill */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500/60 to-cyan-500/40"
            style={{ width: `${(currentMonth / totalMonths) * 100}%` }}
          />
        </div>

        {/* Draggable thumb */}
        <motion.div
          className="absolute top-[18px] w-5 h-5 -mt-1 -ml-2.5 rounded-full bg-blue-500 border-2 border-white shadow-lg shadow-blue-500/30 cursor-grab active:cursor-grabbing z-10"
          style={{ left: `${(currentMonth / totalMonths) * 100}%` }}
          animate={{ scale: isDragging ? 1.2 : 1 }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />

        {/* Event markers */}
        {events.map((ev, i) => {
          const left = (ev.month / totalMonths) * 100;
          const color = EVENT_COLORS[ev.type];

          return (
            <div
              key={`${ev.stateId}-${ev.month}-${i}`}
              className="absolute top-0 cursor-pointer group"
              style={{ left: `${left}%` }}
              onMouseEnter={() => setHoveredEvent(ev)}
              onMouseLeave={() => setHoveredEvent(null)}
            >
              <div
                className="w-2 h-2 -ml-1 rounded-full border border-gray-700"
                style={{ backgroundColor: color }}
              />

              {/* Tooltip */}
              {hoveredEvent === ev && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 z-20">
                  <div className="bg-gray-900 border border-white/10 rounded-lg p-2 text-[10px] shadow-xl">
                    <p className="font-medium text-gray-200">{ev.event}</p>
                    <p className="text-gray-500 mt-0.5">Month {ev.month}</p>
                    {ev.userAction && (
                      <p className="text-amber-400 mt-0.5">📋 {ev.userAction}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Tick marks */}
        <div className="absolute top-[35px] left-0 right-0 flex justify-between pointer-events-none">
          {ticks.map((month) => (
            <span
              key={month}
              className="text-[9px] text-gray-600"
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
        <div className="space-y-1.5">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
            Events near month {currentMonth}
          </p>
          {nearbyEvents.map((ev, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5"
            >
              <span className="text-sm flex-shrink-0">{EVENT_ICONS[ev.type]}</span>
              <div className="min-w-0">
                <p className="text-xs text-gray-300 truncate">{ev.event}</p>
                {ev.userAction && (
                  <p className="text-[10px] text-amber-400 mt-0.5">{ev.userAction}</p>
                )}
              </div>
              <span className="text-[10px] text-gray-600 flex-shrink-0 ml-auto">m{ev.month}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
