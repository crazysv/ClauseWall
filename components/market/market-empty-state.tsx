"use client";

import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Upload, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export function MarketEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-8 md:py-6 md:py-8 lg:py-12 lg:py-16"
    >
      <div className="relative inline-block mb-6">
        <div className="p-6 rounded-2xl bg-teal-50 border border-teal-100 shadow-sm dark:shadow-slate-900/20">
          <BarChart3 className="h-12 w-12 text-teal-600" />
        </div>
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-1 -right-1"
        >
          <Sparkles className="h-6 w-6 text-amber-500 drop-shadow-sm dark:shadow-slate-900/20" />
        </motion.div>
      </div>

      <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 mb-2">
        Market Intelligence Building...
      </h3>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
        Analyze more contracts to power the market intelligence engine.
        Each analysis contributes anonymized data to build comprehensive benchmarks.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto mb-8">
        {[
          { icon: Upload, label: "Analyze contracts", desc: "Upload to contribute data" },
          { icon: TrendingUp, label: "Build benchmarks", desc: "Auto-generated from analyses" },
          { icon: BarChart3, label: "Compare & negotiate", desc: "Data-backed arguments" },
        ].map((step, i) => (
          <Card key={i} className="bg-white dark:bg-card border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 rounded-xl">
            <CardContent className="p-4 text-center">
              <step.icon className="h-6 w-6 text-teal-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{step.label}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">{step.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-2 px-4 md:px-6 py-3 rounded-xl bg-teal-600 text-white hover:bg-teal-700 shadow-sm dark:shadow-slate-900/20 transition-colors text-sm font-black tracking-tight border border-teal-700"
      >
        <Upload className="h-4 w-4" />
        Analyze Your First Contract
      </Link>
    </motion.div>
  );
}
