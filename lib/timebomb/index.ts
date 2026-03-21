// ============================================
// BARREL EXPORT — lib/timebomb/index.ts
// Re-exports all public functions
// ============================================

// Core extraction
export { extractTemporalObligations } from "./temporal-extractor";

// Date calculations
export {
  calculateAbsoluteDates,
  calculateDaysUntil,
  getUrgencyFromDays,
  getUrgencyColor,
  getSeverityColor,
  groupDeadlinesByMonth,
  getDeadlineStats,
  buildTimelineEvents,
  formatIndianCurrency,
} from "./date-calculator";

// ICS calendar generation
export { generateICSFile, generateSingleICS } from "./ics-generator";

// Action letter generation
export { generateActionTemplate } from "./action-generator";

// Reminder service
export { checkAndSendReminders } from "./reminder-service";
