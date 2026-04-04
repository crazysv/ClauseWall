"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, X } from "lucide-react";
import type { LifeEventType, StressScenarioEvent } from "@/lib/simulation/types";
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
    setEvents((prev) => [...prev, { type: selectedType, month: selectedMonth }]);
  };

  const removeEvent = (index: number) => {
    setEvents((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="card-impact p-6 bg-white border-4 border-black">
      <h4 className="text-lg font-black uppercase tracking-tight mb-6 flex items-center gap-2 text-black">
        <span className="p-1 bg-black text-white">🎯</span> Custom Scenario Builder
      </h4>

      {/* Event selector */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as LifeEventType)}
          className="flex-1 min-w-[200px] px-4 py-3 border-4 border-black rounded-none text-sm font-bold uppercase tracking-widest text-black focus:outline-none focus:ring-0 focus:border-red-600 transition-colors"
        >
          {EVENT_OPTIONS.map((opt) => (
            <option key={opt.type} value={opt.type}>
              {opt.icon} {LIFE_EVENT_LABELS[opt.type]}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-3">
          <span className="text-xs font-black uppercase tracking-widest text-black/50">Month</span>
          <input
            type="number"
            value={selectedMonth}
            min={1}
            max={contractMonths}
            onChange={(e) =>
              setSelectedMonth(
                Math.min(contractMonths, Math.max(1, parseInt(e.target.value) || 1))
              )
            }
            className="w-20 px-3 py-3 border-4 border-black rounded-none text-sm font-bold text-center text-black focus:outline-none focus:ring-0 focus:border-red-600 transition-colors"
          />
        </div>

        <Button
          variant="outline"
          onClick={addEvent}
          className="h-[52px] rounded-none border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all font-black uppercase tracking-wider gap-2 px-6"
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {/* Selected events */}
      {events.length > 0 && (
        <div className="space-y-2 mb-6">
          {events.map((event, i) => {
            const opt = EVENT_OPTIONS.find((o) => o.type === event.type);
            return (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-3 border-2 border-black bg-gray-50"
              >
                <span className="text-sm font-bold uppercase tracking-widest text-black">
                  {opt?.icon} {LIFE_EVENT_LABELS[event.type]} in month{" "}
                  {event.month}
                </span>
                <button
                  onClick={() => removeEvent(i)}
                  className="p-1 hover:bg-black hover:text-white border-2 border-transparent hover:border-black transition-colors"
                >
                  <X className="h-4 w-4 text-black hover:text-white" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Run button */}
      <Button
        onClick={() => onRun(events)}
        disabled={events.length === 0 || isLoading}
        className="w-full h-[52px] rounded-none border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all font-black uppercase tracking-wider gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Running...
          </>
        ) : (
          `Run Custom Test (${events.length} events)`
        )}
      </Button>
    </div>
  );
}
