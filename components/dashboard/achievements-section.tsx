"use client";

import { motion } from "framer-motion";
import { Trophy, Lock } from "lucide-react";
import type { Achievement } from "@/types";
import { getUnlockedCount, getTotalAchievements } from "@/lib/stats/achievements";

interface AchievementsSectionProps {
  achievements: Achievement[];
}

export default function AchievementsSection({ achievements }: AchievementsSectionProps) {
  const unlocked = getUnlockedCount(achievements);
  const total = getTotalAchievements();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-xl border border-gray-800 bg-gray-900/50 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="font-semibold text-white">Achievements</h3>
        </div>
        <span className="text-sm text-gray-400">
          {unlocked}/{total} unlocked
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-800 rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full"
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
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.05 }}
            className="group relative"
          >
            {/* Badge */}
            <div
              className={`relative flex flex-col items-center p-3 rounded-xl border transition-all ${
                achievement.unlocked
                  ? "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10"
                  : "border-gray-800 bg-gray-900/30 opacity-50"
              }`}
            >
              {/* Icon */}
              <div className="text-2xl mb-1.5">
                {achievement.unlocked ? (
                  achievement.icon
                ) : (
                  <Lock className="w-5 h-5 text-gray-600" />
                )}
              </div>

              {/* Name */}
              <p
                className={`text-[10px] text-center font-medium leading-tight ${
                  achievement.unlocked ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {achievement.name}
              </p>

              {/* Progress bar (if not unlocked and has progress) */}
              {!achievement.unlocked && achievement.progress > 0 && (
                <div className="w-full h-0.5 bg-gray-800 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-gray-600 rounded-full"
                    style={{
                      width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>

            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2.5 bg-gray-900 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none">
              <p className="text-xs font-medium text-white mb-0.5">
                {achievement.icon} {achievement.name}
              </p>
              <p className="text-[10px] text-gray-400">{achievement.description}</p>
              {!achievement.unlocked && achievement.target > 1 && (
                <p className="text-[10px] text-gray-500 mt-1">
                  Progress: {achievement.progress}/{achievement.target}
                </p>
              )}
              {achievement.unlocked && (
                <p className="text-[10px] text-amber-400 mt-1">✅ Unlocked!</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}