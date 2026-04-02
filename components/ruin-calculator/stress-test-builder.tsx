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

export function StressTestBuilder({
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
    <Card className="bg-slate-900/50 border-slate-800">
      <CardContent className="p-4">
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          🎯 Custom Scenario Builder
        </h4>

        {/* Event selector */}
        <div className="flex flex-wrap gap-2 mb-3">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as LifeEventType)}
            className="flex-1 min-w-[140px] px-3 py-2 rounded-xl bg-indigo-50/50 border border-white/10 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-white/20"
          >
            {EVENT_OPTIONS.map((opt) => (
              <option key={opt.type} value={opt.type}>
                {opt.icon} {LIFE_EVENT_LABELS[opt.type]}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-900 dark:text-slate-100/40">Month</span>
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
              className="w-16 px-2 py-2 rounded-xl bg-indigo-50/50 border border-white/10 text-sm text-slate-900 dark:text-slate-100 text-center focus:outline-none focus:ring-1 focus:ring-white/20"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={addEvent}
            className="gap-1"
          >
            <Plus className="h-3 w-3" />
            Add
          </Button>
        </div>

        {/* Selected events */}
        {events.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {events.map((event, i) => {
              const opt = EVENT_OPTIONS.find((o) => o.type === event.type);
              return (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-card/[0.03] border border-white/5"
                >
                  <span className="text-sm text-slate-900 dark:text-slate-100/70">
                    {opt?.icon} {LIFE_EVENT_LABELS[event.type]} in month{" "}
                    {event.month}
                  </span>
                  <button
                    onClick={() => removeEvent(i)}
                    className="text-slate-900 dark:text-slate-100/30 hover:text-red-400 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
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
          className="w-full gap-2"
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Running...
            </>
          ) : (
            `Run Custom Test (${events.length} events)`
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
