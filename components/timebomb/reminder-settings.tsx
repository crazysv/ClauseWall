"use client";

// ============================================
// REMINDER SETTINGS
// Multi-channel notification preferences
// ============================================

import { useState, useEffect } from "react";
import {
  Bell,
  MessageCircle,
  Mail,
  Smartphone,
  Loader2,
  Save,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import type { DeadlineReminderSettings } from "@/types";
import { TelegramLink } from "./telegram-link";

interface ReminderSettingsProps {
  onSaved?: () => void;
}

export function ReminderSettings({ onSaved }: ReminderSettingsProps) {
  const [settings, setSettings] = useState<DeadlineReminderSettings | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/timebomb/reminder-settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error("[TimeBomb] Settings fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      const res = await fetch("/api/timebomb/reminder-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error("Failed to save settings");
      toast.success("Reminder settings saved!");
      onSaved?.();
    } catch (error) {
      console.error("[TimeBomb] Settings save error:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof DeadlineReminderSettings>(
    key: K,
    value: DeadlineReminderSettings[K],
  ) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  if (loading) {
    return (
      <div className="border border-neutral-900 bg-[#0a0a0a] p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-40 bg-neutral-900" />
          <div className="h-10 bg-neutral-900" />
          <div className="h-10 bg-neutral-900" />
          <div className="h-10 bg-neutral-900" />
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="border border-neutral-900 bg-[#0a0a0a] p-5">
      <h4 className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-2 mb-5 border-b border-neutral-900 pb-3">
        <Bell className="w-3.5 h-3.5 text-amber-500" />
        REMINDER_SETTINGS
      </h4>

      <div className="space-y-1">
        {/* Telegram */}
        <ToggleRow
          icon={<MessageCircle className="w-3.5 h-3.5 text-cyan-400" />}
          label="Telegram Reminders"
          description={
            settings.telegram_chat_id
              ? "Connected ✓"
              : "Link your Telegram account"
          }
          enabled={settings.telegram_enabled}
          onToggle={(v) => updateSetting("telegram_enabled", v)}
          disabled={!settings.telegram_chat_id}
        />

        {!settings.telegram_chat_id && settings.telegram_enabled && (
          <div className="ml-6 mb-2">
            <TelegramLink
              onLinked={() => {
                fetchSettings();
              }}
            />
          </div>
        )}

        {/* Email */}
        <ToggleRow
          icon={<Mail className="w-3.5 h-3.5 text-emerald-400" />}
          label="Email Reminders"
          description="Receive deadline alerts via email"
          enabled={settings.email_enabled}
          onToggle={(v) => updateSetting("email_enabled", v)}
        />

        {/* Push */}
        <ToggleRow
          icon={<Smartphone className="w-3.5 h-3.5 text-purple-400" />}
          label="Browser Push Notifications"
          description="Get desktop/mobile notification alerts"
          enabled={settings.push_enabled}
          onToggle={async (v) => {
            if (v) {
              try {
                const { registerPushNotifications } =
                  await import("@/lib/timebomb/push-registration");
                const subscription = await registerPushNotifications();
                if (subscription) {
                  updateSetting("push_enabled", true);
                  updateSetting("push_subscription", subscription);
                } else {
                  toast.error(
                    "Push notifications need permission. Check your browser settings.",
                  );
                }
              } catch {
                toast.error("Failed to enable push notifications");
              }
            } else {
              updateSetting("push_enabled", false);
              updateSetting("push_subscription", null);
            }
          }}
        />

        {/* In-app */}
        <ToggleRow
          icon={
            <Bell className="w-3.5 h-3.5 text-amber-400" />
          }
          label="IN-APP NOTIFICATIONS"
          description="SHOW ALERTS IN CLAUSEWALL"
          enabled={settings.in_app_enabled}
          onToggle={(v) => updateSetting("in_app_enabled", v)}
        />

        {/* Time picker */}
        <div className="flex items-center justify-between pt-4 mt-3 border-t border-neutral-900">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-neutral-600" />
            <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-400">
              PREFERRED TIME
            </span>
          </div>
          <input
            type="time"
            value={settings.reminder_time}
            onChange={(e) => updateSetting("reminder_time", e.target.value)}
            className="px-3 py-1.5 border border-neutral-800 bg-[#050505] text-neutral-300 font-mono text-sm focus:outline-none focus:border-neutral-600 transition-colors"
          />
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full mt-6 px-4 py-2.5 border border-amber-900/50 bg-amber-950/10 font-mono uppercase tracking-widest text-[8px] text-amber-400 hover:text-amber-300 hover:border-amber-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        aria-label="Save reminder settings"
      >
        {saving ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Save className="w-3.5 h-3.5" />
        )}
        SAVE SETTINGS
      </button>
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  description,
  enabled,
  onToggle,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-neutral-900 last:border-0">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div>
          <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-300 block">
            {label}
          </span>
          <p className="text-[7px] font-mono uppercase tracking-widest text-neutral-600 mt-0.5">
            {description}
          </p>
        </div>
      </div>
      <button
        onClick={() => onToggle(!enabled)}
        disabled={disabled}
        className={`relative w-14 h-8 border transition-colors ${enabled ? "bg-amber-950/30 border-amber-900/50" : "bg-[#050505] border-neutral-800"} ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:border-neutral-600"}`}
        role="switch"
        aria-checked={enabled}
        aria-label={`Toggle ${label}`}
      >
        <span
          className={`absolute top-1.5 w-5 h-5 border transition-transform ${enabled ? "translate-x-[22px] border-amber-500 bg-amber-500" : "translate-x-[2px] border-neutral-700 bg-neutral-700"}`}
        />
      </button>
    </div>
  );
}
