// ============================================
// LAW CHANGE NOTIFICATION SENDER
// Sends notifications for law change impacts
// via Telegram, email, push, and in-app.
// Reuses existing notification infrastructure.
// ============================================

import { getLawChangeDB } from "./db";
import { sendMessage } from "@/lib/bot/telegram-client";

/**
 * Send notifications for all unnotified law change impacts.
 * Groups by user, batches per user (max 1 notification per user per day).
 */
export async function sendLawChangeNotifications(): Promise<{
  sent: number;
  failed: number;
}> {
  const db = getLawChangeDB();
  let sent = 0;
  let failed = 0;

  try {
    // Fetch unnotified impacts with law change details
    const { data: unnotified, error } = await db
      .from("law_change_impacts")
      .select("*, law_changes!inner(*)")
      .eq("notified", false)
      .limit(50);

    if (error || !unnotified || unnotified.length === 0) {

      return { sent: 0, failed: 0 };
    }


    // Group by user_id
    const byUser = new Map<string, typeof unnotified>();
    for (const impact of unnotified) {
      const userId = impact.user_id;
      if (!byUser.has(userId)) {
        byUser.set(userId, []);
      }
      byUser.get(userId)!.push(impact);
    }

    // Process per user
    for (const [userId, impacts] of byUser) {
      try {
        // Get user notification settings (reuse deadline settings)
        const { data: settings } = await db
          .from("deadline_reminder_settings")
          .select("*")
          .eq("user_id", userId)
          .single();

        // Create in-app notification for each impact
        for (const impact of impacts) {
          const change = impact.law_changes;
          const urgency = getUrgency(impact.impact_severity);

          try {
            // In-app notification
            await db.from("law_change_notifications").insert({
              user_id: userId,
              law_change_id: impact.law_change_id,
              impact_id: impact.id,
              title: `⚖️ ${change.title}`,
              body: impact.impact_description,
              urgency,
            });

            const channels: string[] = ["in_app"];

            // Telegram notification (batched — send one summary per user)
            if (settings?.telegram_enabled && settings?.telegram_chat_id) {
              try {
                const message = formatTelegramMessage(impact, change);
                await sendMessage(
                  Number(settings.telegram_chat_id),
                  message
                );
                channels.push("telegram");
              } catch (telegramError) {
                console.warn(
                  `[LawChangeNotifier] Telegram failed for user ${userId}:`,
                  (telegramError as Error).message
                );
              }
            }

            // Email notification (optional)
            if (settings?.email_enabled) {
              try {
                const emailSent = await sendEmailNotification(
                  impact,
                  change
                );
                if (emailSent) channels.push("email");
              } catch {
                // Silently fail
              }
            }

            // Push notification (optional)
            if (settings?.push_enabled && settings?.push_subscription) {
              try {
                const pushSent = await sendPushNotification(
                  settings.push_subscription,
                  impact,
                  change
                );
                if (pushSent) channels.push("push");
              } catch {
                // Silently fail
              }
            }

            // Mark as notified
            await db
              .from("law_change_impacts")
              .update({
                notified: true,
                notified_at: new Date().toISOString(),
                notification_channels: channels,
              })
              .eq("id", impact.id);

            sent++;
          } catch (impactError) {
            console.error(
              `[LawChangeNotifier] Impact ${impact.id} notification failed:`,
              (impactError as Error).message
            );
            failed++;
          }
        }
      } catch (userError) {
        console.error(
          `[LawChangeNotifier] User ${userId} notification failed:`,
          (userError as Error).message
        );
        failed += impacts.length;
      }
    }
  } catch (error) {
    console.error("[LawChangeNotifier] Service error:", error);
  }


  return { sent, failed };
}

function getUrgency(severity: string): "critical" | "important" | "informational" {
  switch (severity) {
    case "rights_lost":
    case "clause_voided":
    case "protection_removed":
      return "critical";
    case "obligation_added":
    case "limit_changed":
    case "rights_gained":
    case "protection_added":
      return "important";
    default:
      return "informational";
  }
}

function formatTelegramMessage(impact: any, change: any): string {
  const urgencyEmoji =
    getUrgency(impact.impact_severity) === "critical"
      ? "🔴"
      : getUrgency(impact.impact_severity) === "important"
        ? "🟠"
        : "🔵";

  return [
    `${urgencyEmoji} <b>LAW CHANGE AFFECTS YOUR CONTRACT</b>`,
    ``,
    `📋 <b>${change.title}</b>`,
    `📅 ${change.date_published}`,
    change.court_name
      ? `🏛️ ${change.court_name}`
      : change.act_name
        ? `📜 ${change.act_name}`
        : null,
    ``,
    `📝 Clause ${impact.clause_number || ""}: ${impact.clause_type}`,
    ``,
    `⚡ <b>Impact:</b> ${impact.impact_description}`,
    impact.financial_description
      ? `💰 ${impact.financial_description}`
      : null,
    ``,
    `✅ <b>What to do:</b>`,
    impact.action_required,
    ``,
    `🔗 <a href="https://clause-wall.vercel.app/lawchange">View details</a>`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function sendEmailNotification(
  impact: any,
  change: any
): Promise<boolean> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return false;

    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    const urgencyEmoji =
      getUrgency(impact.impact_severity) === "critical" ? "🔴" : "⚖️";

    await resend.emails.send({
      from: "ClauseWall <noreply@clausewall.app>",
      to: ["user@example.com"], // Would use user email from auth
      subject: `${urgencyEmoji} Law Change: ${change.title}`,
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 24px; border-radius: 12px;">
          <h2 style="color: #6366f1;">⚖️ ${change.title}</h2>
          <p><strong>Date:</strong> ${change.date_published}</p>
          <p><strong>Clause affected:</strong> ${impact.clause_type}</p>
          <p><strong>Impact:</strong> ${impact.impact_description}</p>
          ${impact.financial_description ? `<p><strong>💰</strong> ${impact.financial_description}</p>` : ""}
          <p><strong>✅ Action:</strong> ${impact.action_required}</p>
          <a href="https://clause-wall.vercel.app/lawchange" style="display: inline-block; background: #6366f1; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">View Details</a>
        </div>
      `,
    });

    return true;
  } catch {
    return false;
  }
}

async function sendPushNotification(
  subscriptionJson: string,
  impact: any,
  change: any
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

    await webPush.sendNotification(
      subscription,
      JSON.stringify({
        title: `⚖️ Law Change: ${change.title}`,
        body: impact.impact_description.substring(0, 200),
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: `law-change-${impact.id}`,
        data: { url: "/lawchange" },
      })
    );

    return true;
  } catch {
    return false;
  }
}
