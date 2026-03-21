// ============================================
// REMINDER SERVICE
// Checks deadlines and sends multi-channel
// reminders. Called by daily cron job.
// ============================================

import { createAdminClient } from "@/lib/supabase/admin";
import { sendMessage } from "@/lib/bot/telegram-client";
import type { ContractDeadline, DeadlineReminderSettings } from "@/types";
import { calculateDaysUntil } from "./date-calculator";

interface ReminderResult {
  sent: number;
  failed: number;
  skipped: number;
}

// Reminder thresholds and their corresponding DB columns
const REMINDER_THRESHOLDS = [
  { days: 30, column: "reminder_30d_sent" },
  { days: 14, column: "reminder_14d_sent" },
  { days: 7, column: "reminder_7d_sent" },
  { days: 3, column: "reminder_3d_sent" },
  { days: 1, column: "reminder_1d_sent" },
  { days: 0, column: "reminder_today_sent" },
] as const;

/**
 * Check all deadlines and send appropriate reminders
 */
export async function checkAndSendReminders(): Promise<ReminderResult> {
  const result: ReminderResult = { sent: 0, failed: 0, skipped: 0 };

  try {
    const supabase = createAdminClient();

    // Fetch all active deadlines
    const { data: deadlines, error } = await supabase
      .from("contract_deadlines")
      .select("*")
      .in("status", ["upcoming", "warning", "urgent"]);

    if (error || !deadlines || deadlines.length === 0) {
      console.log("[TimeBomb Reminder] No active deadlines to process");
      return result;
    }

    console.log(`[TimeBomb Reminder] Processing ${deadlines.length} active deadlines`);

    // Cache user settings
    const settingsCache = new Map<string, DeadlineReminderSettings | null>();

    for (const deadline of deadlines) {
      try {
        const daysUntil = calculateDaysUntil(deadline.deadline_date);

        // Update status if needed
        if (daysUntil < 0 && deadline.status !== "missed") {
          await supabase
            .from("contract_deadlines")
            .update({ status: "missed", updated_at: new Date().toISOString() })
            .eq("id", deadline.id);

          // Handle recurring deadlines
          if (deadline.is_recurring && deadline.recurrence_interval_days) {
            await createNextRecurrence(supabase, deadline);
          }
          continue;
        } else if (daysUntil <= 7 && deadline.status !== "urgent") {
          await supabase
            .from("contract_deadlines")
            .update({ status: "urgent", urgency: "critical", updated_at: new Date().toISOString() })
            .eq("id", deadline.id);
        } else if (daysUntil <= 30 && deadline.status === "upcoming") {
          await supabase
            .from("contract_deadlines")
            .update({ status: "warning", urgency: daysUntil <= 7 ? "critical" : "high", updated_at: new Date().toISOString() })
            .eq("id", deadline.id);
        }

        // Check which reminder to fire
        for (const threshold of REMINDER_THRESHOLDS) {
          if (
            daysUntil <= threshold.days &&
            !(deadline as Record<string, unknown>)[threshold.column]
          ) {
            // Get user settings (cached)
            if (!settingsCache.has(deadline.user_id)) {
              const { data: settings } = await supabase
                .from("deadline_reminder_settings")
                .select("*")
                .eq("user_id", deadline.user_id)
                .single();
              settingsCache.set(deadline.user_id, settings);
            }

            const settings = settingsCache.get(deadline.user_id) ?? null;

            // Send via each enabled channel
            const sent = await sendReminders(
              supabase,
              deadline as ContractDeadline,
              settings,
              daysUntil,
              threshold.days
            );

            // Mark reminder as sent
            await supabase
              .from("contract_deadlines")
              .update({
                [threshold.column]: true,
                updated_at: new Date().toISOString(),
              })
              .eq("id", deadline.id);

            result.sent += sent;
            break; // Only fire the most relevant reminder per deadline per run
          }
        }
      } catch (deadlineError) {
        console.error(`[TimeBomb Reminder] Error processing deadline ${deadline.id}:`, deadlineError);
        result.failed++;
      }
    }

    return result;
  } catch (error) {
    console.error("[TimeBomb Reminder] Service error:", error);
    return result;
  }
}

/**
 * Send reminders via all enabled channels
 */
async function sendReminders(
  supabase: ReturnType<typeof createAdminClient>,
  deadline: ContractDeadline,
  settings: DeadlineReminderSettings | null,
  daysUntil: number,
  thresholdDays: number
): Promise<number> {
  let sentCount = 0;

  // Always create in-app notification
  await createInAppNotification(supabase, deadline.user_id, deadline.id, thresholdDays);
  sentCount++;

  if (!settings) return sentCount;

  // Telegram
  if (settings.telegram_enabled && settings.telegram_chat_id) {
    const success = await sendTelegramReminder(
      settings.telegram_chat_id,
      deadline,
      daysUntil
    );
    if (success) {
      await logNotification(supabase, deadline.user_id, deadline.id, "telegram", thresholdDays, true);
      sentCount++;
    } else {
      await logNotification(supabase, deadline.user_id, deadline.id, "telegram", thresholdDays, false);
    }
  }

  // Email (optional — Resend)
  if (settings.email_enabled) {
    const success = await sendEmailReminder(deadline, daysUntil);
    if (success) {
      await logNotification(supabase, deadline.user_id, deadline.id, "email", thresholdDays, true);
      sentCount++;
    }
  }

  // Push (optional — web-push)
  if (settings.push_enabled && settings.push_subscription) {
    const success = await sendPushReminder(
      settings.push_subscription,
      deadline,
      daysUntil
    );
    if (success) {
      await logNotification(supabase, deadline.user_id, deadline.id, "push", thresholdDays, true);
      sentCount++;
    }
  }

  return sentCount;
}

/**
 * Send Telegram reminder
 */
async function sendTelegramReminder(
  chatId: string,
  deadline: ContractDeadline,
  daysUntil: number
): Promise<boolean> {
  try {
    const urgencyEmoji =
      daysUntil <= 1 ? "🔴" : daysUntil <= 7 ? "🟠" : daysUntil <= 30 ? "🟡" : "🔵";
    const urgencyLabel =
      daysUntil <= 1 ? "URGENT" : daysUntil <= 7 ? "HIGH PRIORITY" : daysUntil <= 30 ? "ATTENTION" : "REMINDER";

    const message = [
      `${urgencyEmoji} <b>${urgencyLabel} — CONTRACT DEADLINE</b>`,
      ``,
      `📋 <b>${deadline.title}</b>`,
      `⏰ <b>${daysUntil} day${daysUntil !== 1 ? "s" : ""} remaining</b> (due: ${formatDate(deadline.deadline_date)})`,
      deadline.financial_description ? `💰 At stake: ${deadline.financial_description}` : null,
      ``,
      `⚠️ <i>If you miss this:</i>`,
      deadline.consequence_if_missed,
      ``,
      `✅ <b>Action required:</b>`,
      deadline.action_required,
      ``,
      `🔗 <a href="https://clause-wall.vercel.app/timebomb/${deadline.document_id}">View deadline details</a>`,
    ]
      .filter(Boolean)
      .join("\n");

    await sendMessage(Number(chatId), message);
    return true;
  } catch (error) {
    console.error("[TimeBomb Reminder] Telegram send failed:", error);
    return false;
  }
}

/**
 * Send email reminder (optional — requires Resend API key)
 */
async function sendEmailReminder(
  deadline: ContractDeadline,
  daysUntil: number
): Promise<boolean> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return false;

    // Dynamic import for optional dependency
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    const urgencyEmoji =
      daysUntil <= 1 ? "🔴" : daysUntil <= 7 ? "🟠" : daysUntil <= 30 ? "🟡" : "🔵";

    await resend.emails.send({
      from: "ClauseWall <noreply@clausewall.app>",
      to: ["user@example.com"], // Would need user email from auth
      subject: `${urgencyEmoji} Contract Deadline in ${daysUntil} days: ${deadline.title}`,
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 24px; border-radius: 12px;">
          <h2 style="color: ${daysUntil <= 7 ? "#ef4444" : "#eab308"};">${urgencyEmoji} ${deadline.title}</h2>
          <p><strong>Due:</strong> ${formatDate(deadline.deadline_date)} (${daysUntil} days away)</p>
          ${deadline.financial_description ? `<p><strong>💰 At stake:</strong> ${deadline.financial_description}</p>` : ""}
          <p><strong>⚠️ If missed:</strong> ${deadline.consequence_if_missed}</p>
          <p><strong>✅ Action needed:</strong> ${deadline.action_required}</p>
          <a href="https://clause-wall.vercel.app/timebomb/${deadline.document_id}" style="display: inline-block; background: #3b82f6; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">View Details</a>
        </div>
      `,
    });

    return true;
  } catch (error) {
    // Silently fail if Resend is not installed or configured
    console.error("[TimeBomb Reminder] Email send failed:", error);
    return false;
  }
}

/**
 * Send push notification (optional — requires web-push)
 */
async function sendPushReminder(
  subscriptionJson: string,
  deadline: ContractDeadline,
  daysUntil: number
): Promise<boolean> {
  try {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey) return false;

    const webPush = await import("web-push");
    webPush.setVapidDetails(
      "mailto:hello@clausewall.app",
      publicKey,
      privateKey
    );

    const subscription = JSON.parse(subscriptionJson);
    const urgencyEmoji =
      daysUntil <= 1 ? "🔴" : daysUntil <= 7 ? "🟠" : daysUntil <= 30 ? "🟡" : "🔵";

    await webPush.sendNotification(
      subscription,
      JSON.stringify({
        title: `${urgencyEmoji} Contract Deadline: ${deadline.title}`,
        body: `${daysUntil} day${daysUntil !== 1 ? "s" : ""} remaining. ${deadline.action_required}`,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: `deadline-${deadline.id}`,
        data: { url: `/timebomb/${deadline.document_id}` },
      })
    );

    return true;
  } catch (error) {
    console.error("[TimeBomb Reminder] Push send failed:", error);
    return false;
  }
}

/**
 * Create in-app notification
 */
async function createInAppNotification(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  deadlineId: string,
  daysBefore: number
): Promise<void> {
  try {
    await supabase.from("deadline_notifications").insert({
      user_id: userId,
      deadline_id: deadlineId,
      notification_type: "in_app",
      days_before: daysBefore,
      delivered: true,
      read: false,
    });
  } catch (error) {
    console.error("[TimeBomb Reminder] In-app notification failed:", error);
  }
}

/**
 * Log a sent notification
 */
async function logNotification(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  deadlineId: string,
  type: "telegram" | "email" | "push",
  daysBefore: number,
  delivered: boolean
): Promise<void> {
  try {
    await supabase.from("deadline_notifications").insert({
      user_id: userId,
      deadline_id: deadlineId,
      notification_type: type,
      days_before: daysBefore,
      delivered,
      read: false,
    });
  } catch (error) {
    console.error("[TimeBomb Reminder] Log notification failed:", error);
  }
}

/**
 * Create next recurring deadline occurrence
 */
async function createNextRecurrence(
  supabase: ReturnType<typeof createAdminClient>,
  deadline: ContractDeadline
): Promise<void> {
  try {
    if (!deadline.recurrence_interval_days) return;

    const currentDate = new Date(deadline.deadline_date);
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + deadline.recurrence_interval_days);

    // Update current deadline with next occurrence reference
    await supabase
      .from("contract_deadlines")
      .update({
        next_occurrence_date: nextDate.toISOString().split("T")[0],
        updated_at: new Date().toISOString(),
      })
      .eq("id", deadline.id);

    // Create the new deadline
    await supabase.from("contract_deadlines").insert({
      document_id: deadline.document_id,
      user_id: deadline.user_id,
      clause_id: deadline.clause_id,
      deadline_date: nextDate.toISOString().split("T")[0],
      warning_start_date: new Date(
        nextDate.getTime() - 30 * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split("T")[0],
      deadline_type: deadline.deadline_type,
      title: deadline.title,
      description: deadline.description,
      financial_impact: deadline.financial_impact,
      financial_description: deadline.financial_description,
      consequence_if_missed: deadline.consequence_if_missed,
      consequence_severity: deadline.consequence_severity,
      action_required: deadline.action_required,
      status: "upcoming",
      urgency: "low",
      is_recurring: true,
      recurrence_interval_days: deadline.recurrence_interval_days,
      reminder_30d_sent: false,
      reminder_14d_sent: false,
      reminder_7d_sent: false,
      reminder_3d_sent: false,
      reminder_1d_sent: false,
      reminder_today_sent: false,
    });

    console.log(`[TimeBomb Reminder] Created next recurrence for "${deadline.title}" on ${nextDate.toISOString().split("T")[0]}`);
  } catch (error) {
    console.error("[TimeBomb Reminder] Create recurrence failed:", error);
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
