"use client";

import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import type {
  LifeEventType,
  StressScenarioEvent,
} from "@/lib/simulation/types";
import { LIFE_EVENT_LABELS } from "@/lib/simulation/stress-test-engine";

interface Props {
  onRun: (events: StressScenarioEvent[]) => void;
  isLoading: boolean;
  contractMonths: number;
}

const EVENT_OPTIONS: { type: LifeEventType; icon: string }[] = [
  { type: "jobLoss", icon: "💼" },
  { type: "medicalEmergency", icon: "🏥" },
  { type: "marketDownturn", icon: "📉" },
  { type: "landlordDispute", icon: "🏠" },
  { type: "relocation", icon: "✈️" },
  { type: "relationshipChange", icon: "💔" },
  { type: "propertyDefect", icon: "🏗️" },
];

export default function StressTestBuilder({
  onRun,
  isLoading,
  contractMonths,
}: Props) {
  const [events, setEvents] = useState<StressScenarioEvent[]>([]);
  const [selectedType, setSelectedType] = useState<LifeEventType>("jobLoss");
  const [selectedMonth, setSelectedMonth] = useState(6);

  const addEvent = () => {
    setEvents((prev) => [
      ...prev,
      { type: selectedType, month: selectedMonth },
    ]);
  };

  const removeEvent = (index: number) => {
    setEvents((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border border-neutral-900 bg-[#050505] p-6 rounded-sm">
      <h4 className="text-sm font-mono uppercase tracking-widest mb-6 flex items-center gap-2 text-white">
        <span className="p-1 bg-[#0a0a0a] border border-neutral-800 text-cyan-500 rounded-sm">🎯</span> [CUSTOM SCENARIO BUILDER]
      </h4>

      {/* Event selector */}
      <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as LifeEventType)}
            className="flex-1 min-w-[200px] px-4 py-3 bg-[#0a0a0a] border border-neutral-800 rounded-sm text-[10px] font-mono uppercase tracking-widest text-neutral-300 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-colors"
          >
            {EVENT_OPTIONS.map((opt) => (
              <option key={opt.type} value={opt.type} className="bg-[#050505]">
                {opt.icon} {LIFE_EVENT_LABELS[opt.type]}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
              [MONTH]
            </span>
            <input
              type="number"
              value={selectedMonth}
              min={1}
              max={contractMonths}
              onChange={(e) =>
                setSelectedMonth(
                  Math.min(
                    contractMonths,
                    Math.max(1, parseInt(e.target.value) || 1),
                  ),
                )
              }
              className="w-20 px-3 py-3 bg-[#0a0a0a] border border-neutral-800 rounded-sm text-[10px] font-mono text-center text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-colors"
            />
          </div>

          <button
            onClick={addEvent}
            className="h-[40px] px-6 bg-neutral-900 border border-neutral-800 hover:text-white transition-colors font-mono uppercase tracking-widest text-[9px] text-neutral-400 flex items-center justify-center gap-2 rounded-sm"
          >
            <Plus className="h-3 w-3" />
            [ADD]
          </button>
      </div>

      {/* Selected events */}
      {events.length > 0 && (
        <div className="space-y-2 mb-6">
          {events.map((event, i) => {
            const opt = EVENT_OPTIONS.find((o) => o.type === event.type);
            return (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-3 border border-neutral-800 bg-[#0a0a0a] rounded-sm"
                >
                  <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-300">
                    {opt?.icon} {LIFE_EVENT_LABELS[event.type]} IN MONTH{" "}
                    {event.month}
                  </span>
                  <button
                    onClick={() => removeEvent(i)}
                    className="p-1 text-neutral-500 hover:text-red-400 border border-transparent hover:border-red-900/50 rounded-sm transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Run button */}
        <button
          onClick={() => onRun(events)}
          disabled={events.length === 0 || isLoading}
          className={`w-full h-[40px] flex items-center justify-center gap-2 font-mono uppercase tracking-widest text-[9px] border transition-colors rounded-sm ${
            events.length === 0 || isLoading
              ? "bg-neutral-900 border-neutral-800 text-neutral-500"
              : "bg-cyan-950/20 border-cyan-900/50 text-cyan-500 hover:bg-cyan-900/40"
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3 w-3 text-cyan-500 animate-spin" />
              [EXECUTING SEQUENCE...]
            </>
          ) : (
            `[RUN CUSTOM TEST (${events.length} EVENTS)]`
          )}
        </button>
    </div>
  );
}
