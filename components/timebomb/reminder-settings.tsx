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
    } catch {
        // Silently handled
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
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-card p-6 shadow-sm dark:shadow-slate-900/20">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-40 bg-slate-100 dark:bg-slate-800 rounded" />
          <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded" />
          <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded" />
          <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-card p-6 shadow-sm dark:shadow-slate-900/20">
      <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2 mb-6">
        <Bell className="w-5 h-5 text-indigo-500" />
        Reminder Settings
      </h4>

      <div className="space-y-4">
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
          icon={<Mail className="w-5 h-5 text-emerald-500" />}
          label="Email Reminders"
          description="Receive deadline alerts via email"
          enabled={settings.email_enabled}
          onToggle={(v) => updateSetting("email_enabled", v)}
        />

        {/* Push */}
        <ToggleRow
          icon={<Smartphone className="w-5 h-5 text-purple-500" />}
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
          icon={<Bell className="w-5 h-5 text-amber-500" />}
          label="In-App Notifications"
          description="Show notifications in ClauseWall"
          enabled={settings.in_app_enabled}
          onToggle={(v) => updateSetting("in_app_enabled", v)}
        />

        {/* Time picker */}
        <div className="flex items-center justify-between pt-4 pb-2 border-t border-slate-100 mt-2">
          <div className="flex items-center gap-2 mt-1">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Preferred time</span>
          </div>
          <input
            type="time"
            value={settings.reminder_time}
            onChange={(e) => updateSetting("reminder_time", e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold focus:outline-none focus:border-indigo-500/50 shadow-inner"
          />
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full mt-6 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
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
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 shadow-sm dark:shadow-slate-900/20 flex-shrink-0">
          {icon}
        </div>
        <div>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight block">{label}</span>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onToggle(!enabled)}
        disabled={disabled}
        className={`relative w-[42px] h-6 rounded-full transition-colors flex-shrink-0 border ${ enabled ? "bg-emerald-500 border-emerald-600" : "bg-slate-200 border-slate-300 dark:border-slate-600" } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        role="switch"
        aria-checked={enabled}
        aria-label={`Toggle ${label}`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white dark:bg-slate-900 transition-transform ${ enabled ? "translate-x-5" : "translate-x-0.5" }`}
        />
      </button>
    </div>
  );
}
