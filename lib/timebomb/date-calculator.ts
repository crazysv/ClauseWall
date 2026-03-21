// ============================================
// DATE CALCULATOR
// Pure TypeScript — converts relative deadlines
// to absolute calendar dates. ZERO AI calls.
// ============================================

import type {
  ExtractedDeadline,
  ContractDeadline,
  DeadlineUrgency,
  DeadlineSeverity,
  DeadlineStatus,
  DeadlineStats,
  TimelineEvent,
} from "@/types";

/**
 * Convert relative deadlines to absolute dates based on signing date
 */
export function calculateAbsoluteDates(
  deadlines: ExtractedDeadline[],
  signingDate: Date
): ContractDeadline[] {
  const now = new Date();
  const results: ContractDeadline[] = [];

  for (const deadline of deadlines) {
    const deadlineDate = new Date(signingDate);
    deadlineDate.setDate(deadlineDate.getDate() + deadline.relative_days);

    // Handle Feb 29 in non-leap years
    if (
      deadlineDate.getMonth() === 1 &&
      deadlineDate.getDate() === 29 &&
      !isLeapYear(deadlineDate.getFullYear())
    ) {
      deadlineDate.setDate(28);
    }

    const daysUntil = calculateDaysUntil(deadlineDate.toISOString());
    const urgency = getUrgencyFromDays(daysUntil);
    const status = getStatusFromDays(daysUntil);

    // Calculate warning start date (earliest warning day before deadline)
    const maxWarning = Math.max(...(deadline.warning_days.length > 0 ? deadline.warning_days : [30]));
    const warningDate = new Date(deadlineDate);
    warningDate.setDate(warningDate.getDate() - maxWarning);

    // Handle recurring: calculate next occurrence if deadline has passed
    let nextOccurrenceDate: string | null = null;
    if (
      deadline.is_recurring &&
      deadline.recurrence_interval_days &&
      deadline.recurrence_interval_days > 0
    ) {
      const nextDate = new Date(deadlineDate);
      while (nextDate <= now) {
        nextDate.setDate(
          nextDate.getDate() + deadline.recurrence_interval_days
        );
      }
      nextOccurrenceDate = nextDate.toISOString().split("T")[0];
    }

    results.push({
      id: crypto.randomUUID(),
      document_id: "", // Set by caller
      user_id: "", // Set by caller
      clause_id: null,
      deadline_date: deadlineDate.toISOString().split("T")[0],
      warning_start_date: warningDate.toISOString().split("T")[0],
      deadline_type: deadline.deadline_type,
      title: deadline.title,
      description: deadline.description,
      financial_impact: deadline.financial_impact,
      financial_description: deadline.financial_description,
      consequence_if_missed: deadline.consequence_if_missed,
      consequence_severity: deadline.consequence_severity,
      action_required: deadline.action_required,
      action_template: null,
      status,
      urgency,
      is_recurring: deadline.is_recurring,
      recurrence_interval_days: deadline.recurrence_interval_days,
      next_occurrence_date: nextOccurrenceDate,
      reminder_30d_sent: false,
      reminder_14d_sent: false,
      reminder_7d_sent: false,
      reminder_3d_sent: false,
      reminder_1d_sent: false,
      reminder_today_sent: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // Sort by deadline date (chronological)
  results.sort(
    (a, b) =>
      new Date(a.deadline_date).getTime() -
      new Date(b.deadline_date).getTime()
  );

  return results;
}

/**
 * Calculate days between now and a deadline date.
 * Positive = future, negative = past, 0 = today.
 */
export function calculateDaysUntil(deadlineDateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const deadline = new Date(deadlineDateStr);
  deadline.setHours(0, 0, 0, 0);
  return Math.round(
    (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
}

/**
 * Determine urgency based on days until deadline
 */
export function getUrgencyFromDays(daysUntil: number): DeadlineUrgency {
  if (daysUntil < 7) return "critical";
  if (daysUntil < 30) return "high";
  if (daysUntil < 60) return "medium";
  return "low";
}

/**
 * Determine status based on days until deadline
 */
function getStatusFromDays(daysUntil: number): DeadlineStatus {
  if (daysUntil < 0) return "missed";
  if (daysUntil === 0) return "urgent";
  if (daysUntil < 7) return "urgent";
  if (daysUntil < 30) return "warning";
  return "upcoming";
}

/**
 * Get hex urgency color
 */
export function getUrgencyColor(urgency: DeadlineUrgency): string {
  switch (urgency) {
    case "critical":
      return "#ef4444";
    case "high":
      return "#f97316";
    case "medium":
      return "#eab308";
    case "low":
      return "#3b82f6";
  }
}

/**
 * Get hex severity color
 */
export function getSeverityColor(severity: DeadlineSeverity): string {
  switch (severity) {
    case "catastrophic":
      return "#a855f7";
    case "major":
      return "#ef4444";
    case "moderate":
      return "#f97316";
    case "minor":
      return "#eab308";
  }
}

/**
 * Group deadlines by month (YYYY-MM key)
 */
export function groupDeadlinesByMonth(
  deadlines: ContractDeadline[]
): Map<string, ContractDeadline[]> {
  const map = new Map<string, ContractDeadline[]>();

  const sorted = [...deadlines].sort(
    (a, b) =>
      new Date(a.deadline_date).getTime() -
      new Date(b.deadline_date).getTime()
  );

  for (const d of sorted) {
    const key = d.deadline_date.slice(0, 7); // "2027-03"
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(d);
  }

  return map;
}

/**
 * Compute deadline statistics
 */
export function getDeadlineStats(deadlines: ContractDeadline[]): DeadlineStats {
  const stats: DeadlineStats = {
    total: deadlines.length,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    defused: 0,
    missed: 0,
    total_financial_exposure: 0,
    next_critical: null,
  };

  const now = new Date();

  for (const d of deadlines) {
    // Recalculate urgency based on current time
    const daysUntil = calculateDaysUntil(d.deadline_date);
    const urgency = getUrgencyFromDays(daysUntil);

    switch (urgency) {
      case "critical":
        stats.critical++;
        break;
      case "high":
        stats.high++;
        break;
      case "medium":
        stats.medium++;
        break;
      case "low":
        stats.low++;
        break;
    }

    if (d.status === "defused" || d.status === "action_taken") {
      stats.defused++;
    }
    if (d.status === "missed") {
      stats.missed++;
    }

    if (d.financial_impact && d.status !== "defused" && d.status !== "action_taken") {
      stats.total_financial_exposure += d.financial_impact;
    }
  }

  // Find next critical deadline that isn't defused
  const activeDeadlines = deadlines
    .filter(
      (d) =>
        d.status !== "defused" &&
        d.status !== "action_taken" &&
        d.status !== "expired" &&
        new Date(d.deadline_date) >= now
    )
    .sort(
      (a, b) =>
        new Date(a.deadline_date).getTime() -
        new Date(b.deadline_date).getTime()
    );

  stats.next_critical = activeDeadlines[0] || null;

  return stats;
}

/**
 * Convert deadlines to timeline events with position and color
 */
export function buildTimelineEvents(
  deadlines: ContractDeadline[]
): TimelineEvent[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return deadlines
    .map((d) => {
      const daysFromNow = calculateDaysUntil(d.deadline_date);
      const urgency =
        d.status === "defused" || d.status === "action_taken"
          ? "low"
          : getUrgencyFromDays(daysFromNow);

      let position: TimelineEvent["position"];
      if (daysFromNow < 0) position = "past";
      else if (daysFromNow === 0) position = "today";
      else if (daysFromNow <= 60) position = "upcoming";
      else position = "far";

      const urgencyColor =
        d.status === "defused" || d.status === "action_taken"
          ? "#10b981" // emerald-500
          : d.status === "missed"
            ? "#6b7280" // gray-500
            : getUrgencyColor(urgency);

      return {
        date: d.deadline_date,
        deadline: d,
        position,
        days_from_now: daysFromNow,
        urgency_color: urgencyColor,
      };
    })
    .sort((a, b) => a.days_from_now - b.days_from_now);
}

/**
 * Format a financial amount in Indian notation
 */
export function formatIndianCurrency(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * Check if a year is a leap year
 */
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}
