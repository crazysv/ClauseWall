"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Shield, Scale, MapPin } from "lucide-react";

export default function TrustStats() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="w-full border-y border-neutral-800 bg-[#0a0a0a] py-6 relative z-10">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="max-w-5xl mx-auto px-4 md:px-6 flex flex-wrap items-center justify-center gap-6 md:gap-12"
      >
        <motion.div variants={itemVariants} className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-sm bg-black border border-neutral-800 flex items-center justify-center flex-shrink-0">
            <Scale className="h-4 w-4 text-[#dc2626]" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight">750+ Legal Rules</div>
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Mapped to Indian Law</div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="hidden md:block h-8 w-px bg-neutral-800" />

        <motion.div variants={itemVariants} className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-sm bg-black border border-neutral-800 flex items-center justify-center flex-shrink-0">
            <MapPin className="h-4 w-4 text-[#dc2626]" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight">Local Context</div>
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Central & State Statutes</div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="hidden md:block h-8 w-px bg-neutral-800" />

        <motion.div variants={itemVariants} className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-sm bg-black border border-neutral-800 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="h-4 w-4 text-[#dc2626]" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight">100% Free Tool</div>
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Open Source Defense</div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
