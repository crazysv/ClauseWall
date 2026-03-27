// ============================================
// ALERT DISPATCHER
// Multi-channel alert delivery for ToS changes
// ============================================

import { createAdminClient } from "@/lib/supabase/admin";
import { sendMessage } from "@/lib/bot/telegram-client";
import { shouldAlert, getHighestSeverity } from "./change-classifier";
import type { TosChange, MonitoredCompany, UserWatchlistEntry, SemanticChange, ChangeSeverity } from "@/types";

/**
 * Dispatch alerts for a change to all watching users
 */
export async function dispatchAlerts(
  change: TosChange,
  company: MonitoredCompany
): Promise<{ sent: number; failed: number }> {
  const supabase = createAdminClient();
  let sent = 0;
  let failed = 0;

  // Get users watching this company
  const { data: watchers, error } = await supabase
    .from("user_watchlist")
    .select("*")
    .eq("company_id", company.id);

  if (error || !watchers || watchers.length === 0) {
    console.log(`[Watchdog] No watchers for ${company.name}`);
    return { sent: 0, failed: 0 };
  }

  const severity = getHighestSeverity(change.changes as SemanticChange[]) as ChangeSeverity;
  const title = `${getSeverityEmoji(severity)} ${company.name} — ToS Updated`;
  const body = generateAlertBody(change, company);

  for (const watcher of watchers as UserWatchlistEntry[]) {
    // Check sensitivity preference
    if (!shouldAlert(change.changes as SemanticChange[], watcher.sensitivity)) {
      continue;
    }

    try {
      // In-app alert (always)
      if (watcher.alert_inapp) {
        await supabase.from("watchdog_alerts").insert({
          user_id: watcher.user_id,
          company_id: company.id,
          change_id: change.id,
          alert_type: "inapp",
          title,
          body,
          severity,
        });
        sent++;
      }

      // Telegram alert
      if (watcher.alert_telegram && watcher.telegram_chat_id) {
        try {
          const telegramMsg = formatTelegramAlert(change, company, severity);
          await sendMessage(parseInt(watcher.telegram_chat_id), telegramMsg);
          
          await supabase.from("watchdog_alerts").insert({
            user_id: watcher.user_id,
            company_id: company.id,
            change_id: change.id,
            alert_type: "telegram",
            title,
            body: telegramMsg,
            severity,
          });
          sent++;
        } catch (teleErr) {
          console.error("[Watchdog] Telegram alert failed:", teleErr);
          failed++;
        }
      }

      // Email alert (via Resend)
      if (watcher.alert_email) {
        try {
          await sendEmailAlert(watcher.user_id, title, body, change, company);
          
          await supabase.from("watchdog_alerts").insert({
            user_id: watcher.user_id,
            company_id: company.id,
            change_id: change.id,
            alert_type: "email",
            title,
            body,
            severity,
          });
          sent++;
        } catch (emailErr) {
          console.error("[Watchdog] Email alert failed:", emailErr);
          failed++;
        }
      }
    } catch (err) {
      console.error(`[Watchdog] Alert dispatch failed for user ${watcher.user_id}:`, err);
      failed++;
    }
  }

  return { sent, failed };
}

/**
 * Generate alert body text
 */
function generateAlertBody(change: TosChange, company: MonitoredCompany): string {
  const changes = change.changes as SemanticChange[];
  const critical = changes.filter((c) => c.severity === "critical");
  const major = changes.filter((c) => c.severity === "major");

  let body = `${company.name} updated their terms. `;

  if (critical.length > 0) {
    body += `${critical.length} critical change${critical.length > 1 ? "s" : ""} detected. `;
    body += critical[0].user_impact_summary + " ";
  } else if (major.length > 0) {
    body += `${major.length} major change${major.length > 1 ? "s" : ""} detected. `;
    body += major[0].user_impact_summary + " ";
  } else {
    body += `${changes.length} change${changes.length > 1 ? "s" : ""} detected. `;
  }

  if (change.summary) body += change.summary;

  return body.trim();
}

/**
 * Format alert for Telegram (HTML)
 */
function formatTelegramAlert(
  change: TosChange,
  company: MonitoredCompany,
  severity: string
): string {
  const changes = change.changes as SemanticChange[];
  const emoji = getSeverityEmoji(severity);

  let msg = `${emoji} <b>Contract Watchdog Alert</b>\n\n`;
  msg += `📋 <b>${escapeHtml(company.name)}</b> updated their terms\n\n`;

  // Show top changes
  const topChanges = changes
    .sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity))
    .slice(0, 3);

  for (const c of topChanges) {
    const changeEmoji = getSeverityEmoji(c.severity);
    msg += `${changeEmoji} <b>${escapeHtml(c.section_title)}</b>\n`;
    msg += `  └ ${escapeHtml(c.user_impact_summary)}\n\n`;
  }

  if (changes.length > 3) {
    msg += `<i>+${changes.length - 3} more changes</i>\n\n`;
  }

  msg += `🔗 <a href="https://clausewall.vercel.app/watchdog/changes/${change.id}">View Full Analysis</a>`;

  return msg;
}

/**
 * Send email alert via Resend
 */
async function sendEmailAlert(
  userId: string,
  title: string,
  body: string,
  change: TosChange,
  company: MonitoredCompany
): Promise<void> {
  // Get user email from auth
  const supabase = createAdminClient();
  const { data: userData } = await supabase.auth.admin.getUserById(userId);
  const email = userData?.user?.email;

  if (!email) {
    console.log("[Watchdog] No email found for user", userId);
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[Watchdog] RESEND_API_KEY not configured, skipping email");
    return;
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    await resend.emails.send({
      from: "ClauseWall Watchdog <notifications@clausewall.vercel.app>",
      to: email,
      subject: title,
      html: generateEmailHtml(title, body, change, company),
    });
  } catch (error) {
    console.error("[Watchdog] Resend email failed:", error);
  }
}

/**
 * Generate HTML email template
 */
function generateEmailHtml(
  title: string,
  body: string,
  change: TosChange,
  company: MonitoredCompany
): string {
  const changes = change.changes as SemanticChange[];
  const appUrl = "https://clausewall.vercel.app";

  return `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #e5e5e5; padding: 24px; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #3b82f6; font-size: 20px;">🛡️ ClauseWall Watchdog</h1>
      </div>
      <h2 style="color: #f5f5f5; font-size: 18px;">${escapeHtml(title)}</h2>
      <p style="color: #a3a3a3; line-height: 1.6;">${escapeHtml(body)}</p>
      <hr style="border: 1px solid #262626; margin: 16px 0;" />
      ${changes.slice(0, 3).map((c) => `
        <div style="padding: 12px; background: #171717; border-radius: 6px; margin-bottom: 8px;">
          <div style="font-weight: bold; color: ${getSeverityColor(c.severity)};">${getSeverityEmoji(c.severity)} ${escapeHtml(c.section_title)}</div>
          <p style="color: #a3a3a3; font-size: 14px; margin: 4px 0 0;">${escapeHtml(c.user_impact_summary)}</p>
        </div>
      `).join("")}
      <div style="text-align: center; margin-top: 24px;">
        <a href="${appUrl}/watchdog/changes/${change.id}" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">View Full Analysis</a>
      </div>
      <p style="text-align: center; color: #525252; font-size: 12px; margin-top: 24px;">
        <a href="${appUrl}/watchdog/settings" style="color: #525252;">Manage alert preferences</a>
      </p>
    </div>
  `;
}

function getSeverityEmoji(severity: string): string {
  switch (severity) {
    case "critical": return "🔴";
    case "major": return "🟡";
    case "minor": return "🔵";
    case "cosmetic": return "⚪";
    default: return "📋";
  }
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case "critical": return "#ef4444";
    case "major": return "#f59e0b";
    case "minor": return "#3b82f6";
    default: return "#737373";
  }
}

function severityOrder(severity: string): number {
  switch (severity) {
    case "critical": return 0;
    case "major": return 1;
    case "minor": return 2;
    case "cosmetic": return 3;
    default: return 4;
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
