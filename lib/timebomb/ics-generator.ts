// ============================================
// ICS CALENDAR GENERATOR
// Generates .ics (iCalendar) files manually.
// NO external npm packages.
// ============================================

import type { ContractDeadline } from "@/types";

const CRLF = "\r\n";

/**
 * Generate a complete .ics file with all deadlines
 */
export function generateICSFile(
  deadlines: ContractDeadline[],
  documentTitle: string
): string {
  const events = deadlines
    .filter(
      (d) =>
        d.status !== "defused" &&
        d.status !== "expired" &&
        d.status !== "action_taken"
    )
    .map((d) => generateVEvent(d))
    .join("");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ClauseWall//Contract Time Bomb Defuser//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:ClauseWall Deadlines - ${escapeICSText(documentTitle)}`,
    "X-WR-TIMEZONE:Asia/Kolkata",
    "BEGIN:VTIMEZONE",
    "TZID:Asia/Kolkata",
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:+0530",
    "TZOFFSETTO:+0530",
    "TZNAME:IST",
    "END:STANDARD",
    "END:VTIMEZONE",
  ]
    .join(CRLF)
    .concat(CRLF)
    .concat(events)
    .concat("END:VCALENDAR")
    .concat(CRLF);
}

/**
 * Generate an .ics file for a single deadline
 */
export function generateSingleICS(
  deadline: ContractDeadline,
  documentId: string
): string {
  const event = generateVEvent(deadline);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ClauseWall//Contract Time Bomb Defuser//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:ClauseWall Deadline",
    "X-WR-TIMEZONE:Asia/Kolkata",
    "BEGIN:VTIMEZONE",
    "TZID:Asia/Kolkata",
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:+0530",
    "TZOFFSETTO:+0530",
    "TZNAME:IST",
    "END:STANDARD",
    "END:VTIMEZONE",
  ]
    .join(CRLF)
    .concat(CRLF)
    .concat(event)
    .concat("END:VCALENDAR")
    .concat(CRLF);
}

// ---- Internal helpers ----

function generateVEvent(deadline: ContractDeadline): string {
  const uid = `${crypto.randomUUID()}@clausewall.app`;
  const now = new Date();
  const deadlineDate = new Date(deadline.deadline_date);

  const urgencyEmoji = getUrgencyEmoji(deadline.urgency);
  const priority = getSeverityPriority(deadline.consequence_severity);

  const description = [
    deadline.description,
    "",
    `💰 At stake: ${deadline.financial_description || "Not specified"}`,
    "",
    `⚠️ If missed: ${deadline.consequence_if_missed}`,
    "",
    `✅ Action required: ${deadline.action_required}`,
  ].join("\\n");

  const url = `https://clause-wall.vercel.app/timebomb/${deadline.document_id}`;

  const lines: string[] = [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatICSDateUTC(now)}`,
    `DTSTART;TZID=Asia/Kolkata:${formatICSDate(deadlineDate)}T090000`,
    `DTEND;TZID=Asia/Kolkata:${formatICSDate(deadlineDate)}T100000`,
    ...foldICSLine(
      `SUMMARY:${urgencyEmoji} CONTRACT DEADLINE: ${escapeICSText(deadline.title)}`
    ),
    ...foldICSLine(`DESCRIPTION:${escapeICSText(description)}`),
    `CATEGORIES:${deadline.deadline_type}`,
    `PRIORITY:${priority}`,
    `URL:${url}`,
    "STATUS:CONFIRMED",
    // Alarms at 30, 14, 7, 3, 1 days before
    "BEGIN:VALARM",
    "TRIGGER:-P30D",
    "ACTION:DISPLAY",
    ...foldICSLine(
      `DESCRIPTION:30 days until: ${escapeICSText(deadline.title)}`
    ),
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-P14D",
    "ACTION:DISPLAY",
    ...foldICSLine(
      `DESCRIPTION:14 days until: ${escapeICSText(deadline.title)}`
    ),
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-P7D",
    "ACTION:DISPLAY",
    ...foldICSLine(
      `DESCRIPTION:7 days until: ${escapeICSText(deadline.title)}`
    ),
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-P3D",
    "ACTION:DISPLAY",
    ...foldICSLine(
      `DESCRIPTION:3 days until: ${escapeICSText(deadline.title)}`
    ),
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    ...foldICSLine(
      `DESCRIPTION:TOMORROW: ${escapeICSText(deadline.title)}`
    ),
    "END:VALARM",
    "END:VEVENT",
  ];

  return lines.join(CRLF) + CRLF;
}

/**
 * Format date as ICS local date: "20270303T090000"
 */
function formatICSDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

/**
 * Format date as ICS UTC: "20270303T033000Z"
 */
function formatICSDateUTC(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const h = String(date.getUTCHours()).padStart(2, "0");
  const min = String(date.getUTCMinutes()).padStart(2, "0");
  const s = String(date.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${d}T${h}${min}${s}Z`;
}

/**
 * Escape special characters for ICS text values
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

/**
 * Fold ICS line at 75 octets per RFC 5545
 * Returns array of lines (first line + continuation lines with leading space)
 */
function foldICSLine(line: string): string[] {
  if (line.length <= 75) return [line];

  const result: string[] = [];
  result.push(line.slice(0, 75));
  let remaining = line.slice(75);

  while (remaining.length > 0) {
    // Continuation lines start with a space, so 74 chars of content
    result.push(" " + remaining.slice(0, 74));
    remaining = remaining.slice(74);
  }

  return result;
}

function getUrgencyEmoji(urgency: string): string {
  switch (urgency) {
    case "critical":
      return "🔴";
    case "high":
      return "🟠";
    case "medium":
      return "🟡";
    case "low":
      return "🔵";
    default:
      return "⚠️";
  }
}

function getSeverityPriority(severity: string): number {
  switch (severity) {
    case "catastrophic":
      return 1;
    case "major":
      return 3;
    case "moderate":
      return 5;
    case "minor":
      return 9;
    default:
      return 5;
  }
}
