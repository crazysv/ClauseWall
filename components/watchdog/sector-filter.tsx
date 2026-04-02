"use client";

import { Badge } from "@/components/ui/badge";
import type { CompanySector } from "@/types";
import { SECTOR_LABELS, SECTOR_ICONS, ALL_SECTORS } from "./watchdog-constants";

export function SectorFilter({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (sector: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by sector">
      <button
        onClick={() => onChange("all")}
        aria-label="Show all sectors"
        aria-pressed={selected === "all"}
        className={`px-4 py-2 rounded-xl text-sm border-2 transition-all font-bold ${ selected === "all" ? "bg-indigo-600 border-indigo-700 text-white shadow-sm dark:shadow-slate-900/20" : "bg-white dark:bg-card border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 shadow-sm dark:shadow-slate-900/20" }`}
      >
        All
      </button>
      {ALL_SECTORS.map((sector) => (
        <button
          key={sector}
          onClick={() => onChange(sector)}
          aria-label={`Filter by ${SECTOR_LABELS[sector]}`}
          aria-pressed={selected === sector}
          className={`px-4 py-2 rounded-xl text-sm border-2 transition-all font-bold ${ selected === sector ? "bg-indigo-600 border-indigo-700 text-white shadow-sm dark:shadow-slate-900/20" : "bg-white dark:bg-card border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 shadow-sm dark:shadow-slate-900/20" }`}
        >
          {SECTOR_ICONS[sector]} {SECTOR_LABELS[sector]}
        </button>
      ))}
    </div>
  );
}

export { SECTOR_LABELS, SECTOR_ICONS };

