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
    <div className="border-4 border-black bg-white dark:bg-zinc-900 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <h4 className="text-lg font-black uppercase tracking-widest text-foreground flex items-center gap-3 mb-6 border-b-4 border-black pb-4">
        <Bell className="w-6 h-6 text-orange-500 stroke-[3px]" />
        REMINDER SETTINGS
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
          icon={<Bell className="w-5 h-5 text-yellow-600 dark:text-yellow-400 stroke-[3px]" />}
          label="IN-APP NOTIFICATIONS"
          description="SHOW ALERTS IN CLAUSEWALL"
          enabled={settings.in_app_enabled}
          onToggle={(v) => updateSetting("in_app_enabled", v)}
        />

        {/* Time picker */}
        <div className="flex items-center justify-between pt-6 mt-4 border-t-4 border-black">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-muted-foreground stroke-[3px]" />
            <span className="text-xs font-black uppercase tracking-widest text-foreground">PREFERRED TIME</span>
          </div>
          <input
            type="time"
            value={settings.reminder_time}
            onChange={(e) => updateSetting("reminder_time", e.target.value)}
            className="px-4 py-2 border-4 border-black bg-white dark:bg-black text-black dark:text-white font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:-translate-y-1 focus:shadow-none transition-all"
          />
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full mt-8 px-6 py-4 border-4 border-black bg-orange-500 hover:bg-orange-600 font-black uppercase tracking-widest text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        aria-label="Save reminder settings"
      >
        {saving ? (
          <Loader2 className="w-5 h-5 animate-spin stroke-[3px]" />
        ) : (
          <Save className="w-5 h-5 stroke-[3px]" />
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
    <div className="flex items-center justify-between gap-4 py-4 border-b-2 border-black/10 dark:border-white/10 last:border-0 border-dashed">
      <div className="flex items-start gap-4">
        <div className="mt-1">{icon}</div>
        <div>
          <span className="text-sm font-black uppercase tracking-widest text-foreground block">{label}</span>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onToggle(!enabled)}
        disabled={disabled}
        className={`relative w-14 h-8 border-4 transition-all ${
          enabled ? "bg-orange-500 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "bg-gray-200 dark:bg-zinc-800 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:-translate-y-1 hover:shadow-none"}`}
        role="switch"
        aria-checked={enabled}
        aria-label={`Toggle ${label}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 border-2 border-black bg-white transition-transform ${
            enabled ? "translate-x-[22px]" : "translate-x-[2px]"
          }`}
        />
      </button>
    </div>
  );
}
