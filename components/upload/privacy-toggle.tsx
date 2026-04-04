"use client";

import { Shield, ShieldCheck, ShieldOff, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePrivacy } from "@/lib/privacy";
import { Card, CardContent } from "@/components/ui/card";
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
    color: "text-green-400",
    borderColor: "border-green-500/30",
    bgColor: "bg-green-500/10",
    badgeColor: "bg-green-500/15 text-green-400 border-green-500/30",
  },
  balanced: {
    label: "Balanced",
    description: "Anonymized clauses sent • PII redacted",
    icon: <Shield className="h-4 w-4" />,
    color: "text-blue-400",
    borderColor: "border-blue-500/30",
    bgColor: "bg-blue-500/10",
    badgeColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  standard: {
    label: "Standard",
    description: "Full text sent to AI • Best accuracy",
    icon: <ShieldOff className="h-4 w-4" />,
    color: "text-yellow-400",
    borderColor: "border-yellow-500/30",
    bgColor: "bg-yellow-500/10",
    badgeColor: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  },
};

const LEVELS: PrivacyLevel[] = ["maximum", "balanced", "standard"];

export default function PrivacyToggle() {
  const { level, setLevel } = usePrivacy();
  const config = PRIVACY_CONFIG[level];
  const isPrivacyMode = level === "maximum";

  return (
    <Card
      className={`card-impact border-2 border-foreground transition-all duration-300 ${isPrivacyMode ? "bg-green-50 shadow-[8px_8px_0px_0px_rgba(22,163,74,1)]" : "bg-card shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]"}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3
            className={`font-black uppercase tracking-wider ${isPrivacyMode ? "text-green-800" : "text-foreground"}`}
          >
            Quantum Privacy Mode
          </h3>
          {isPrivacyMode && (
            <Badge className="bg-green-600 text-white border-2 border-foreground text-[10px] h-5 px-1.5 font-bold font-mono">
              ACTIVE
            </Badge>
          )}
        </div>
        <p className="text-sm font-bold text-muted-foreground mb-4">
          Pre-process sensitive data locally in your browser before sending
          array references to the server for analysis.
        </p>

        <div className="flex gap-1 p-1 bg-muted border-2 border-foreground shadow-[inset_0px_0px_0px_2px_rgba(10,10,10,0.05)]">
          {LEVELS.map((l) => {
            const c = PRIVACY_CONFIG[l] as any;
            const isActive = level === l;

            return (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all ${
                  isActive
                    ? "bg-foreground text-background border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] -translate-y-[1px]"
                    : "text-muted-foreground hover:text-foreground hover:bg-background border-2 border-transparent hover:border-foreground"
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

        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-3">
          <Info className="h-3 w-3 flex-shrink-0" />
          {config.description}
        </p>
      </CardContent>
    </Card>
  );
}
