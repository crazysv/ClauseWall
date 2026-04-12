"use client";

import { Shield, ShieldCheck, ShieldOff, Info } from "lucide-react";
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
  }
> = {
  maximum: {
    label: "Maximum Privacy",
    description: "ML only • No data sent • Works offline",
    icon: <ShieldCheck className="h-4 w-4" />,
    color: "text-emerald-500",
    borderColor: "border-emerald-900/50",
    bgColor: "bg-emerald-950/20",
  },
  balanced: {
    label: "Balanced",
    description: "Anonymized clauses sent • PII redacted",
    icon: <Shield className="h-4 w-4" />,
    color: "text-cyan-500",
    borderColor: "border-cyan-900/50",
    bgColor: "bg-cyan-950/20",
  },
  standard: {
    label: "Standard",
    description: "Full text sent to AI • Best accuracy",
    icon: <ShieldOff className="h-4 w-4" />,
    color: "text-amber-500",
    borderColor: "border-amber-900/50",
    bgColor: "bg-amber-950/20",
  },
};

const LEVELS: PrivacyLevel[] = ["maximum", "balanced", "standard"];

export default function PrivacyToggle() {
  const { level, setLevel } = usePrivacy();
  const config = PRIVACY_CONFIG[level];
  const isPrivacyMode = level === "maximum";

  return (
    <div
      className={`border transition-all duration-300 rounded-sm relative overflow-hidden ${
        isPrivacyMode
          ? "bg-[#0a0a0a] border-emerald-900/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
          : "bg-[#0a0a0a] border-neutral-800"
      }`}
    >
      {isPrivacyMode && (
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
      )}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3
            className={`font-mono text-[11px] uppercase tracking-widest flex items-center gap-2 ${
              isPrivacyMode ? "text-emerald-500" : "text-neutral-500"
            }`}
          >
            {isPrivacyMode ? <ShieldCheck className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
            Quantum Privacy Mode
          </h3>
          {isPrivacyMode && (
            <span className="bg-[#0e0e0e] text-emerald-500 border border-emerald-900/30 text-[9px] px-2 py-0.5 rounded-sm font-mono uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ACTIVE
            </span>
          )}
        </div>
        <p className="text-xs font-medium text-neutral-400 mb-4 leading-relaxed">
          Pre-process sensitive data locally in your browser before sending
          array references to the server for analysis.
        </p>

        <div className="flex gap-1 p-1 bg-[#050505] border border-neutral-900 rounded-sm">
          {LEVELS.map((l) => {
            const c = PRIVACY_CONFIG[l] as any;
            const isActive = level === l;

            return (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-[9px] sm:text-[10px] font-mono uppercase tracking-widest rounded transition-all ${
                  isActive
                    ? `bg-[#0e0e0e] shadow-[0_2px_10px_rgba(0,0,0,0.5)] border ${c.borderColor} ${c.color}`
                    : "text-neutral-500 hover:text-neutral-300 hover:bg-[#111] border border-transparent"
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

        <p className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 flex items-center gap-1.5 mt-4 pt-4 border-t border-neutral-900/50">
          <Info className="h-3.5 w-3.5 flex-shrink-0" />
          {config.description}
        </p>
      </div>
    </div>
  );
}
