"use client";

import { Badge } from "@/components/ui/badge";
import type { CompanySector } from "@/types";

const SECTOR_LABELS: Record<string, string> = {
  ride_hailing: "Ride-hailing",
  food_delivery: "Food Delivery",
  ecommerce: "E-commerce",
  payments: "Payments",
  social: "Social",
  streaming: "Streaming",
  travel: "Travel",
  banking: "Banking",
  telecom: "Telecom",
  edtech: "EdTech",
  government: "Government",
  other: "Other",
};

const SECTOR_ICONS: Record<string, string> = {
  ride_hailing: "🚗",
  food_delivery: "🍔",
  ecommerce: "🛒",
  payments: "💳",
  social: "💬",
  streaming: "🎬",
  travel: "✈️",
  banking: "🏦",
  telecom: "📱",
  edtech: "📚",
  government: "🏛️",
  other: "📋",
};

const ALL_SECTORS: CompanySector[] = [
  "ride_hailing",
  "food_delivery",
  "ecommerce",
  "payments",
  "social",
  "streaming",
  "travel",
  "banking",
  "telecom",
  "edtech",
  "government",
];

export default function SectorFilter({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (sector: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange("all")}
        className={`px-3 py-1.5 rounded-full text-sm border transition-all ${selected === "all" ? "bg-blue-500/15 border-blue-500/30 text-blue-400" : "bg-background border-2 border-foreground card-impact/50 border-foreground border-2 text-muted-foreground hover:border-foreground border-2"}`}
      >
        All
      </button>
      {ALL_SECTORS.map((sector) => (
        <button
          key={sector}
          onClick={() => onChange(sector)}
          className={`px-3 py-1.5 rounded-full text-sm border transition-all ${selected === sector ? "bg-blue-500/15 border-blue-500/30 text-blue-400" : "bg-background border-2 border-foreground card-impact/50 border-foreground border-2 text-muted-foreground hover:border-foreground border-2"}`}
        >
          {SECTOR_ICONS[sector]} {SECTOR_LABELS[sector]}
        </button>
      ))}
    </div>
  );
}

export { SECTOR_LABELS, SECTOR_ICONS };
