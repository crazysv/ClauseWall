"use client";

import { motion } from "framer-motion";
import { ShieldAlert, Scale, Pencil, ScanSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function HeroMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative w-full max-w-2xl mx-auto mt-16 z-10"
    >
      {/* Redacted File Structural Container */}
      <div className="relative bg-[#050505] border-2 border-neutral-800 rounded-md shadow-2xl overflow-hidden">
        
        {/* Stark Red Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-[#dc2626]" />

        {/* Header Strip */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#0a0a0a] z-10 relative mt-1">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold font-mono tracking-widest text-[#dc2626] uppercase">
              [ Analysis Engine Active ]
            </span>
          </div>
          <span className="text-[10px] font-mono text-neutral-500 tracking-wider">
            CW-ID: 9X4-B
          </span>
        </div>

        {/* Content Wrapper */}
        <div className="p-6 relative z-10 bg-[#0a0a0a]">
          
          {/* Tagline / Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-4"
          >
            <div className="flex items-center gap-2 bg-[#dc2626] text-white px-2 py-1 rounded-sm">
              <ShieldAlert className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">
                Dangerous Clause
              </span>
            </div>
            <span className="text-xs font-bold font-mono text-neutral-400 bg-neutral-900 px-3 py-1 rounded-sm border border-neutral-800">
              Risk: 84/100
            </span>
          </motion.div>

          {/* Predatory Clause Text */}
          <motion.div
            className="relative p-5 bg-[#0a0a0a] border border-neutral-800 rounded-sm border-l-4 border-l-[#dc2626] mb-4 shadow-inner shadow-black/50"
            initial={{ backgroundColor: "#0a0a0a", borderColor: "#262626", borderLeftColor: "#dc2626" }}
            whileHover={{ backgroundColor: "#0f0f0f", borderColor: "#404040", borderLeftColor: "#ef4444" }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-sm text-neutral-300 leading-relaxed font-serif italic tracking-wide">
              "The Tenant shall pay a <span className="text-[#dc2626] font-bold bg-red-500/10 px-1 py-0.5 rounded-sm">security deposit equivalent to 10 months' rent</span>. This deposit will be forfeited entirely if the Tenant terminates the agreement during the 12-month lock-in period."
            </p>
          </motion.div>

          {/* Legal Citation Alert */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2, duration: 0.4 }}
            className="flex gap-4 p-4 rounded-sm border border-neutral-800 mb-6 bg-neutral-900/50"
          >
            <div className="mt-0.5">
              <Scale className="w-5 h-5 text-neutral-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#dc2626] mb-1">
                Violates Model Tenancy Act, 2021
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                By law, security deposits for residential properties cannot exceed 2 months' rent. This clause is extortionate and legally unenforceable in most Indian states.
              </p>
            </div>
          </motion.div>

          {/* Action Chips */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.4 }}
            className="flex flex-wrap items-center gap-3 pt-4 border-t border-neutral-800"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-black cursor-pointer hover:bg-neutral-900 transition-colors border border-neutral-800">
              <Pencil className="w-3.5 h-3.5 text-neutral-300" />
              <span className="text-xs font-bold text-neutral-300">Rewrite Fairly</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-black cursor-pointer hover:bg-neutral-900 transition-colors border border-neutral-800">
              <ScanSearch className="w-3.5 h-3.5 text-neutral-300" />
              <span className="text-xs font-bold text-neutral-300">Deep Dive</span>
            </div>
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
}
