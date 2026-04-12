"use client";

import { motion } from "framer-motion";
import { Trophy, Lock } from "lucide-react";
import type { Achievement } from "@/types";
import {
  getUnlockedCount,
  getTotalAchievements,
} from "@/lib/stats/achievements";

interface AchievementsSectionProps {
  achievements: Achievement[];
}

export default function AchievementsSection({
  achievements,
}: AchievementsSectionProps) {
  const unlocked = getUnlockedCount(achievements);
  const total = getTotalAchievements();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-[#0a0a0a] border border-neutral-900 p-6 h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-neutral-900">
        <div className="flex items-center gap-3">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
            [ CIVIC_REPUTATION_MATRIX ]
          </h3>
        </div>
        <span className="text-[9px] font-mono uppercase tracking-widest text-amber-500 bg-amber-500/10 border border-amber-900/50 px-2 py-0.5">
          {unlocked}/{total} UNLOCKED
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-neutral-900 mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-amber-500"
          initial={{ width: 0 }}
          animate={{ width: `${(unlocked / total) * 100}%` }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {achievements.map((achievement, index) => (
          <motion.div
            key={achievement.code}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.05 }}
            className="group relative"
          >
            {/* Badge */}
            <div
              className={`relative flex flex-col items-center p-3 border transition-colors ${
                achievement.unlocked
                  ? "border-amber-900/50 bg-amber-950/20 hover:bg-amber-900/30"
                  : "border-neutral-900 bg-[#050505] grayscale opacity-50"
              }`}
            >
              {/* Icon */}
              <div className="text-2xl mb-3">
                {achievement.unlocked ? (
                  achievement.icon
                ) : (
                  <Lock className="w-5 h-5 text-neutral-700" />
                )}
              </div>

              {/* Name */}
              <p
                className={`text-[8px] text-center font-mono uppercase tracking-widest leading-tight ${
                  achievement.unlocked
                    ? "text-amber-500"
                    : "text-neutral-600"
                }`}
              >
                {achievement.name}
              </p>

              {/* Progress bar (if not unlocked and has progress) */}
              {!achievement.unlocked && achievement.progress > 0 && (
                <div className="w-full h-[2px] bg-neutral-900 mt-2 overflow-hidden">
                  <div
                    className="h-full bg-neutral-600"
                    style={{
                      width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>

            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-[#050505] border border-neutral-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 pointer-events-none shadow-2xl">
              <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-300 mb-1 flex items-center gap-1.5 border-b border-neutral-900 pb-2">
                <span className="text-lg">{achievement.icon}</span> {achievement.name}
              </p>
              <p className="text-[10px] font-mono text-neutral-500 leading-relaxed pt-1">
                {achievement.description}
              </p>
              {!achievement.unlocked && achievement.target > 1 && (
                <p className="text-[8px] font-mono text-neutral-400 mt-2 uppercase tracking-widest border-t border-neutral-900 pt-1.5 flex justify-between">
                  <span>PROGRESS</span>
                  <span className="text-white">{achievement.progress}/{achievement.target}</span>
                </p>
              )}
              {achievement.unlocked && (
                <p className="text-[8px] font-mono mt-2 uppercase tracking-widest text-amber-500 bg-amber-500/10 border border-amber-900/50 px-1.5 py-0.5 inline-block">
                  AUTHORIZATION_GRANTED
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
