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
    null
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
    value: DeadlineReminderSettings[K]
  ) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-40 bg-white/5 rounded" />
          <div className="h-10 bg-white/5 rounded" />
          <div className="h-10 bg-white/5 rounded" />
          <div className="h-10 bg-white/5 rounded" />
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
      <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
        <Bell className="w-4 h-4 text-orange-400" />
        Reminder Settings
      </h4>

      <div className="space-y-3">
        {/* Telegram */}
        <ToggleRow
          icon={<MessageCircle className="w-4 h-4 text-blue-400" />}
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
          <div className="ml-8">
            <TelegramLink
              onLinked={() => {
                fetchSettings();
              }}
            />
          </div>
        )}

        {/* Email */}
        <ToggleRow
          icon={<Mail className="w-4 h-4 text-green-400" />}
          label="Email Reminders"
          description="Receive deadline alerts via email"
          enabled={settings.email_enabled}
          onToggle={(v) => updateSetting("email_enabled", v)}
        />

        {/* Push */}
        <ToggleRow
          icon={<Smartphone className="w-4 h-4 text-purple-400" />}
          label="Browser Push Notifications"
          description="Get desktop/mobile notification alerts"
          enabled={settings.push_enabled}
          onToggle={async (v) => {
            if (v) {
              try {
                const { registerPushNotifications } = await import(
                  "@/lib/timebomb/push-registration"
                );
                const subscription = await registerPushNotifications();
                if (subscription) {
                  updateSetting("push_enabled", true);
                  updateSetting("push_subscription", subscription);
                } else {
                  toast.error(
                    "Push notifications need permission. Check your browser settings."
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
          icon={<Bell className="w-4 h-4 text-yellow-400" />}
          label="In-App Notifications"
          description="Show notifications in ClauseWall"
          enabled={settings.in_app_enabled}
          onToggle={(v) => updateSetting("in_app_enabled", v)}
        />

        {/* Time picker */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-white/30" />
            <span className="text-xs text-white/50">Preferred time</span>
          </div>
          <input
            type="time"
            value={settings.reminder_time}
            onChange={(e) => updateSetting("reminder_time", e.target.value)}
            className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-orange-500/50"
          />
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full mt-4 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        aria-label="Save reminder settings"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        Save Settings
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
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <span className="text-sm text-white/70">{label}</span>
          <p className="text-[10px] text-white/30">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onToggle(!enabled)}
        disabled={disabled}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          enabled ? "bg-orange-600" : "bg-white/10"
        } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
        role="switch"
        aria-checked={enabled}
        aria-label={`Toggle ${label}`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
