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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="card-impact border-2 border-foreground shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] bg-background p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b-2 border-foreground">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-500" />
          <h3 className="text-xl font-black uppercase tracking-wider text-foreground">
            Achievements
          </h3>
        </div>
        <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground bg-muted px-3 py-1 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(10,10,10,1)]">
          {unlocked}/{total} unlocked
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-4 bg-muted border-2 border-foreground mb-6 overflow-hidden shadow-[inset_2px_2px_0px_0px_rgba(10,10,10,0.1)] p-0.5">
        <motion.div
          className="h-full bg-amber-500 border-r-2 border-foreground"
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
            className="group relative"
          >
            {/* Badge */}
            <div
              className={`relative flex flex-col items-center p-3 border-2 transition-transform hover:-translate-y-1 ${
                achievement.unlocked
                  ? "border-foreground bg-amber-100 shadow-[4px_4px_0px_0px_rgba(245,158,11,1)]"
                  : "border-muted-foreground/30 bg-muted/50 grayscale opacity-70"
              }`}
            >
              {/* Icon */}
              <div className="text-3xl mb-2 drop-shadow-md">
                {achievement.unlocked ? (
                  achievement.icon
                ) : (
                  <Lock className="w-6 h-6 text-muted-foreground" />
                )}
              </div>

              {/* Name */}
              <p
                className={`text-[10px] text-center font-black uppercase tracking-wider leading-tight ${
                  achievement.unlocked
                    ? "text-amber-900"
                    : "text-muted-foreground"
                }`}
              >
                {achievement.name}
              </p>

              {/* Progress bar (if not unlocked and has progress) */}
              {!achievement.unlocked && achievement.progress > 0 && (
                <div className="w-full h-1.5 bg-background border border-muted-foreground/30 mt-2 overflow-hidden">
                  <div
                    className="h-full bg-muted-foreground/50"
                    style={{
                      width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>

            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-3 bg-background border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 pointer-events-none">
              <p className="text-xs font-black uppercase text-foreground mb-1 flex items-center gap-1">
                {achievement.icon} {achievement.name}
              </p>
              <p className="text-[10px] font-bold text-muted-foreground">
                {achievement.description}
              </p>
              {!achievement.unlocked && achievement.target > 1 && (
                <p className="text-[10px] font-bold text-foreground mt-2 uppercase tracking-wider border-t-2 border-muted pt-1">
                  Progress: {achievement.progress}/{achievement.target}
                </p>
              )}
              {achievement.unlocked && (
                <p className="text-[10px] font-black text-green-700 mt-2 uppercase tracking-wider bg-green-100 border-2 border-green-700 px-1 inline-block">
                  UNLOCKED
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
