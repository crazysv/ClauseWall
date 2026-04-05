"use client";

import { Clock, CheckCircle2, XCircle, Wifi } from "lucide-react";

interface Props {
  workingHours: string | null;
  workingDays: string | null;
  closedOn: string | null;
  compact?: boolean;
}

function isOpenNow(
  hours: string | null,
  days: string | null,
  closedOn: string | null,
): "open" | "closed" | "unknown" {
  if (!hours) return "unknown";

  const now = new Date();
  const day = now.toLocaleDateString("en-US", { weekday: "long" });
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();

  // Check closed days
  if (closedOn) {
    const closedDays = closedOn.toLowerCase();
    if (closedDays.includes(day.toLowerCase())) return "closed";
    if (closedDays.includes("sunday") && day === "Sunday") return "closed";
    if (closedDays.includes("saturday") && day === "Saturday") return "closed";
  }

  // Check working days
  if (days) {
    const d = days.toLowerCase();
    if (
      d.includes("monday to friday") &&
      (day === "Saturday" || day === "Sunday")
    )
      return "closed";
    if (d.includes("monday to saturday") && day === "Sunday") return "closed";
  }

  // Parse hours like "10:00 AM - 5:00 PM" or "10:30 AM - 5:30 PM"
  const match = hours.match(
    /(\d{1,2}):?(\d{2})?\s*(AM|PM)\s*[-–to]\s*(\d{1,2}):?(\d{2})?\s*(AM|PM)/i,
  );
  if (!match) return "unknown";

  const [, startH, startM, startAP, endH, endM, endAP] = match;
  let openHour = parseInt(startH);
  if (startAP.toUpperCase() === "PM" && openHour !== 12) openHour += 12;
  if (startAP.toUpperCase() === "AM" && openHour === 12) openHour = 0;
  const openMin = parseInt(startM || "0");

  let closeHour = parseInt(endH);
  if (endAP.toUpperCase() === "PM" && closeHour !== 12) closeHour += 12;
  if (endAP.toUpperCase() === "AM" && closeHour === 12) closeHour = 0;
  const closeMin = parseInt(endM || "0");

  const currentTotal = currentHour * 60 + currentMin;
  const openTotal = openHour * 60 + openMin;
  const closeTotal = closeHour * 60 + closeMin;

  if (currentTotal >= openTotal && currentTotal < closeTotal) return "open";
  return "closed";
}

export default function AuthorityHoursBadge({
  workingHours,
  workingDays,
  closedOn,
  compact,
}: Props) {
  const status = isOpenNow(workingHours, workingDays, closedOn);

  const config = {
    open: {
      icon: CheckCircle2,
      label: "Open Now",
      bg: "bg-green-500/15",
      text: "text-green-400",
      dot: "bg-green-400",
    },
    closed: {
      icon: XCircle,
      label: "Closed",
      bg: "bg-red-500/15",
      text: "text-red-400",
      dot: "bg-red-400",
    },
    unknown: {
      icon: Clock,
      label: "Hours Unknown",
      bg: "bg-gray-500/15",
      text: "text-foreground",
      dot: "bg-gray-400",
    },
  };

  const { icon: Icon, label, bg, text, dot } = config[status];

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${bg} ${text} ${compact ? "text-xs" : "text-sm"}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${dot} ${status === "open" ? "animate-pulse" : ""}`}
      />
      <span className="font-medium">{label}</span>
      {!compact && workingHours && (
        <span className="opacity-60 text-xs ml-1">({workingHours})</span>
      )}
    </div>
  );
}
