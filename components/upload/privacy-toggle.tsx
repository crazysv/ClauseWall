"use client";

import { Shield, ShieldCheck, ShieldOff, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePrivacy } from "@/lib/privacy";
import type { PrivacyLevel } from "@/lib/privacy";

const PRIVACY_CONFIG: Record<
  PrivacyLevel,
  {
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    borderColor: string;
    bgColor: string;
    badgeColor: string;
  }
> = {
  maximum: {
    label: "Maximum Privacy",
    description: "ML only • No data sent • Works offline",
    icon: <ShieldCheck className="h-4 w-4" />,
    color: "text-emerald-700",
    borderColor: "border-emerald-300",
    bgColor: "bg-emerald-50",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  balanced: {
    label: "Balanced",
    description: "Anonymized clauses sent • PII redacted",
    icon: <Shield className="h-4 w-4" />,
    color: "text-indigo-700",
    borderColor: "border-indigo-300",
    bgColor: "bg-indigo-50",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  standard: {
    label: "Standard",
    description: "Full text sent to AI • Best accuracy",
    icon: <ShieldOff className="h-4 w-4" />,
    color: "text-amber-700",
    borderColor: "border-amber-300",
    bgColor: "bg-amber-50",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

const LEVELS: PrivacyLevel[] = ["maximum", "balanced", "standard"];

export function PrivacyToggle() {
  const { level, setLevel } = usePrivacy();
  const config = PRIVACY_CONFIG[level];

  return (
    <div className="space-y-3 w-full mt-2">
      <div className="flex items-center justify-between ml-0.5">
        <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
          <Shield className="h-4 w-4 text-indigo-500" />
          Data Privacy Protocol
        </label>
        <Badge variant="outline" className={`text-[9px] uppercase font-black tracking-widest gap-1 shadow-sm dark:shadow-slate-900/20 ${config.badgeColor}`}>
          {config.icon}
          {config.label}
        </Badge>
      </div>

      <div className="flex gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-inner">
        {LEVELS.map((l) => {
          const c = PRIVACY_CONFIG[l];
          const isActive = level === l;

          return (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-bold tracking-wide uppercase transition-all shadow-sm ${
                isActive
                  ? `${c.bgColor} ${c.color} ${c.borderColor} border-2`
                  : "text-slate-500 hover:text-slate-700 hover:bg-white border-2 border-transparent shadow-none"
              }`}
            >
              {c.icon}
              <span className="hidden sm:inline">{c.label}</span>
              <span className="sm:hidden">
                {l === "maximum" ? "Max" : l === "balanced" ? "Bal" : "Std"}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium ml-0.5 flex items-center gap-1.5">
        <Info className="h-4 w-4 flex-shrink-0 text-indigo-400" />
        {config.description}
      </p>
    </div>
  );
}