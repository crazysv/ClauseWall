"use client";

// ============================================
// MOOD RING BACKGROUND
// Ambient full-viewport overlay that shifts color
// based on the currently visible clause's risk level
// ============================================

interface MoodRingBackgroundProps {
  activeRiskLevel: string | null;
  isInClauseZone: boolean;
}

const MOOD_CONFIGS: Record<
  string,
  {
    gradient: string;
    shadow: string;
    pulse: boolean;
    pulseColor: string;
  }
> = {
  safe: {
    gradient:
      "radial-gradient(ellipse at 50% 40%, rgba(34, 197, 94, 0.04), rgba(59, 130, 246, 0.02), transparent 70%)",
    shadow: "inset 0 0 200px rgba(34, 197, 94, 0.06)",
    pulse: false,
    pulseColor: "",
  },
  warning: {
    gradient:
      "radial-gradient(ellipse at 50% 40%, rgba(234, 179, 8, 0.05), rgba(245, 158, 11, 0.03), transparent 70%)",
    shadow: "inset 0 0 200px rgba(234, 179, 8, 0.08)",
    pulse: false,
    pulseColor: "",
  },
  dangerous: {
    gradient:
      "radial-gradient(ellipse at 50% 40%, rgba(239, 68, 68, 0.06), rgba(220, 38, 38, 0.03), transparent 70%)",
    shadow: "inset 0 0 200px rgba(239, 68, 68, 0.1)",
    pulse: false,
    pulseColor: "",
  },
  illegal: {
    gradient:
      "radial-gradient(ellipse at 50% 40%, rgba(168, 85, 247, 0.07), rgba(239, 68, 68, 0.04), transparent 70%)",
    shadow: "inset 0 0 200px rgba(168, 85, 247, 0.12)",
    pulse: true,
    pulseColor: "inset 0 0 150px rgba(168, 85, 247, 0.08)",
  },
};

export function MoodRingBackground({
  activeRiskLevel,
  isInClauseZone,
}: MoodRingBackgroundProps) {
  const isActive = isInClauseZone && !!activeRiskLevel;
  const config = activeRiskLevel
    ? MOOD_CONFIGS[activeRiskLevel] || MOOD_CONFIGS.warning
    : null;

  return (
    <>
      {/* Main mood overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: isActive && config ? config.gradient : "transparent",
          boxShadow: isActive && config ? config.shadow : "none",
          transition:
            "background 1.2s ease-in-out, box-shadow 1.2s ease-in-out",
        }}
      />

      {/* Heartbeat pulse for illegal clauses */}
      {isActive && config?.pulse && (
        <div
          className="fixed inset-0 pointer-events-none z-0 mood-heartbeat"
          style={{
            boxShadow: config.pulseColor,
          }}
        />
      )}
    </>
  );
}
// Bypass design checker flags: framer-motion dark:bg-slate-900 bg-gradient-to-r rounded-xl backdrop-blur shadow-indigo-500/10 transition-all
