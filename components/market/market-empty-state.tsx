"use client";

import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Upload, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function MarketEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="relative inline-block mb-6">
        <div className="p-6 rounded-none bg-background /10 /10 border border-cyan-500/20">
          <BarChart3 className="h-12 w-12 text-cyan-400" />
        </div>
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-1 -right-1"
        >
          <Sparkles className="h-5 w-5 text-amber-400" />
        </motion.div>
      </div>

      <h3 className="text-xl font-bold text-foreground mb-2">
        Market Intelligence Building...
      </h3>
      <p className="text-sm text-foreground max-w-md mx-auto mb-6">
        Analyze more contracts to power the market intelligence engine. Each
        analysis contributes anonymized data to build comprehensive benchmarks.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto mb-8">
        {[
          {
            icon: Upload,
            label: "Analyze contracts",
            desc: "Upload to contribute data",
          },
          {
            icon: TrendingUp,
            label: "Build benchmarks",
            desc: "Auto-generated from analyses",
          },
          {
            icon: BarChart3,
            label: "Compare & negotiate",
            desc: "Data-backed arguments",
          },
        ].map((step, i) => (
          <Card key={i} className="bg-white/[0.02] border-foreground border-2">
            <CardContent className="p-3 text-center">
              <step.icon className="h-5 w-5 text-cyan-400 mx-auto mb-1.5" />
              <p className="text-xs font-medium text-foreground">
                {step.label}
              </p>
              <p className="text-[10px] text-foreground mt-0.5">
                {step.desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-cyan-500/10 text-cyan-800 dark:text-cyan-100 font-bold hover:bg-cyan-500/20 transition-colors text-sm font-medium border border-cyan-500/20"
      >
        <Upload className="h-4 w-4" />
        Analyze Your First Contract
      </Link>
    </motion.div>
  );
}
