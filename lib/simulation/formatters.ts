// ============================================
// FORMATTERS
// INR formatting, percentile labels, risk colors
// ============================================

/**
 * Format number as Indian Rupees (₹1,00,000 format).
 */
export function formatINR(amount: number): string {
  if (amount === 0) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

/**
 * Format number as compact INR (₹1.2L, ₹2.5Cr).
 */
export function formatINRCompact(amount: number): string {
  if (amount === 0) return "₹0";
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

/**
 * Get human-readable percentile label.
 */
export function getPercentileLabel(percentile: number): string {
  switch (percentile) {
    case 50:
      return "Median outcome";
    case 75:
      return "1 in 4 chance of exceeding";
    case 90:
      return "1 in 10 chance";
    case 95:
      return "Nightmare scenario";
    case 99:
      return "Catastrophic scenario";
    default:
      return `${percentile}th percentile`;
  }
}

/**
 * Get color for percentile level (Tailwind classes).
 */
export function getPercentileColor(percentile: number): {
  text: string;
  bg: string;
  border: string;
  fill: string;
} {
  switch (percentile) {
    case 50:
      return {
        text: "text-green-400",
        bg: "bg-green-500/10",
        border: "border-green-500/20",
        fill: "#22c55e",
      };
    case 75:
      return {
        text: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        fill: "#f59e0b",
      };
    case 90:
      return {
        text: "text-orange-400",
        bg: "bg-orange-500/10",
        border: "border-orange-500/20",
        fill: "#f97316",
      };
    case 95:
      return {
        text: "text-red-400",
        bg: "bg-red-500/10",
        border: "border-red-500/20",
        fill: "#ef4444",
      };
    case 99:
      return {
        text: "text-red-600",
        bg: "bg-red-900/20",
        border: "border-red-900/50",
        fill: "#991b1b",
      };
    default:
      return {
        text: "text-neutral-400",
        bg: "bg-neutral-900/50",
        border: "border-neutral-800",
        fill: "#525252",
      };
  }
}

/**
 * Format percentage.
 */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Get histogram bar color based on cost range.
 */
export function getHistogramBarColor(binIndex: number, totalBins: number): string {
  const ratio = binIndex / totalBins;
  if (ratio < 0.3) return "#10b981"; // emerald-500
  if (ratio < 0.5) return "#f59e0b"; // amber-500
  if (ratio < 0.7) return "#f97316"; // orange-500
  if (ratio < 0.85) return "#ef4444"; // red-500
  return "#991b1b"; // deep red (red-800)
}
