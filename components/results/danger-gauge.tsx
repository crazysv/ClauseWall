"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useCountUp } from "@/hooks/use-count-up";

export function DangerGauge({ score }: { score: number }) {
  const prefersReducedMotion = useReducedMotion();
  // Clamp score
  const safeScore = Math.min(Math.max(score, 0), 100);
  const animatedScore = useCountUp(safeScore, prefersReducedMotion ? 0 : 1.5, 0.2);

  const getScoreData = (s: number) => {
    if (s <= 30) {
      return { 
        stroke: "stroke-emerald-500", 
        text: "text-emerald-500",
        label: "Low Risk",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
      };
    }
    if (s <= 60) {
      return { 
        stroke: "stroke-amber-500", 
        text: "text-amber-500",
        label: "Medium Risk",
        badge: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
      };
    }
    if (s <= 80) {
      return { 
        stroke: "stroke-rose-500", 
        text: "text-rose-500",
        label: "Dangerous",
        badge: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
      };
    }
    return { 
      stroke: "stroke-purple-600", 
      text: "text-purple-600",
      label: "Critical Condition",
      badge: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
    };
  };

  const data = getScoreData(safeScore);

  // SVG parameters
  const size = 180;
  const strokeWidth = 8;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-4">
      {/* Gauge Container with subtle shadow */}
      <div className="relative flex items-center justify-center drop-shadow-xl">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background Ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            className="stroke-slate-100"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated Foreground Ring */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            className={`${data.stroke} transition-colors duration-500`}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: prefersReducedMotion ? 0 : 1.5, ease: "easeOut" }}
          />
        </svg>

        {/* Center Score Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            className={`text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl sm:text-lg md:text-xl lg:text-2xl md:text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl lg:text-4xl text-balance md:text-5xl text-balance font-black tracking-tighter ${data.text}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={
              prefersReducedMotion ? { opacity: 1, scale: 1 } : 
              { opacity: 1, scale: safeScore > 60 ? [1, 1.05, 1] : 1 }
            }
            transition={{
              duration: prefersReducedMotion ? 0 : 0.5,
              delay: prefersReducedMotion ? 0 : 0.2,
              ...(safeScore > 60 && !prefersReducedMotion ? { scale: { repeat: Infinity, duration: 2 } } : {})
            }}
          >
            {animatedScore}
          </motion.span>
          <span className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-widest">
            Risk Score
          </span>
        </div>
      </div>

      {/* Risk Label Pill */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <Badge variant="outline" className={`px-4 py-1.5 rounded-full shadow-sm dark:shadow-slate-900/20 text-sm font-bold border ${data.badge} transition-colors duration-500`}>
          {data.label}
        </Badge>
      </motion.div>
    </div>
  );
}
