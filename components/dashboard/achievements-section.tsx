"use client";

import { motion } from "framer-motion";
import { Trophy, Lock } from "lucide-react";
import type { Achievement } from "@/types";
import { getUnlockedCount, getTotalAchievements } from "@/lib/stats/achievements";

interface AchievementsSectionProps {
  achievements: Achievement[];
}

export function AchievementsSection({ achievements }: AchievementsSectionProps) {
  const unlocked = getUnlockedCount(achievements);
  const total = getTotalAchievements();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-indigo-500" />
          <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg">Achievements</h3>
        </div>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100">
          {unlocked}/{total} unlocked
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mb-8 overflow-hidden shadow-inner">
        <motion.div
          className="h-full bg-indigo-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(unlocked / total) * 100}%` }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
        {achievements.map((achievement, index) => (
          <motion.div
            key={achievement.code}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.05 }}
            className="group relative flex flex-col items-center"
          >
            {/* Badge */}
            <div
              className={`relative flex flex-col items-center justify-center w-16 h-16 rounded-2xl border-2 transition-all hover:scale-105 hover:shadow-md cursor-help ${ achievement.unlocked ? "border-indigo-200 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-300 shadow-sm dark:shadow-slate-900/20" : "border-slate-100 bg-slate-50 dark:bg-slate-800 opacity-60 grayscale hover:grayscale-0 hover:opacity-100" }`}
            >
              {/* Icon */}
              <div className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl drop-shadow-sm dark:shadow-slate-900/20">
                {achievement.unlocked ? (
                  achievement.icon
                ) : (
                  <Lock className="w-6 h-6 text-slate-400" />
                )}
              </div>
            </div>

            {/* Name */}
            <p
              className={`text-[11px] text-center font-bold leading-tight mt-3 mb-1 max-w-full truncate px-1 ${
                achievement.unlocked ? "text-slate-700" : "text-slate-400"
              }`}
            >
              {achievement.unlocked ? achievement.name : "Locked"}
            </p>

            {/* Progress bar (if not unlocked and has progress) */}
            {!achievement.unlocked && achievement.progress > 0 && (
              <div className="w-12 h-1 bg-slate-200 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-indigo-400 rounded-full"
                  style={{
                    width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%`,
                  }}
                />
              </div>
            )}

            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-3 bg-white dark:bg-card border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 pointer-events-none">
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-900 border-b border-r border-slate-200 dark:border-slate-700 rotate-45" />
              <p className="text-xs font-black text-slate-800 dark:text-slate-200 mb-1 flex items-center justify-center gap-1.5">
                <span>{achievement.icon}</span> <span>{achievement.name}</span>
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium text-center leading-relaxed mb-0.5">{achievement.description}</p>
              {!achievement.unlocked && achievement.target > 1 && (
                <p className="text-[10px] text-indigo-600 font-bold text-center mt-2 bg-indigo-50 rounded-md py-1">
                  Progress: {achievement.progress}/{achievement.target}
                </p>
              )}
              {achievement.unlocked && (
                <p className="text-[10px] text-emerald-600 font-bold text-center mt-2 bg-emerald-50 rounded-md py-1">✅ Unlocked!</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}