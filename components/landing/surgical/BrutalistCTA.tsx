"use client";

import { motion, MotionValue, useTransform } from "framer-motion";
import Link from "next/link";
import { Upload } from "lucide-react";

export default function BrutalistCTA({ 
  scrollYProgress, 
  isSimplified = false 
}: { 
  scrollYProgress?: MotionValue<number>;
  isSimplified?: boolean;
}) {
  if (isSimplified || !scrollYProgress) {
    return (
      <div className="flex flex-col items-center justify-center text-center mt-32 border-t border-[#262626] pt-16">
        <h2 className="text-4xl md:text-5xl font-black mb-6">Build Your Wall.</h2>
        <Link href="/upload">
           <button className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 font-bold rounded-sm flex items-center gap-3 transition-colors shadow-[0_0_20px_rgba(220,38,38,0.3)]">
             <Upload className="w-5 h-5" />
             Submit Evidence For Analysis
           </button>
        </Link>
      </div>
    );
  }

  // Active from 0.8 to 1.0
  const opacity = useTransform(scrollYProgress, [0.75, 0.85], [0, 1]);
  const pointerEvents = useTransform(scrollYProgress, (v) => v > 0.75 ? "auto" : "none");
  const yOffset = useTransform(scrollYProgress, [0.75, 1], [100, 0]);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center bg-black pointer-events-none"
      style={{ opacity, pointerEvents: pointerEvents as any }}
    >
      <motion.div className="text-center w-full max-w-4xl px-4" style={{ y: yOffset }}>
        <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-white mb-12 font-display">
          Build Your <span className="text-red-600 border-b-4 border-red-600 pb-2">Wall.</span>
        </h2>
        <div className="flex justify-center">
            <Link href="/upload" className="pointer-events-auto">
              <button className="bg-red-600 hover:bg-red-500 text-white px-10 py-6 font-bold text-xl md:text-2xl rounded-sm flex items-center justify-center gap-4 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_60px_rgba(220,38,38,0.4)] shadow-[0_0_20px_rgba(220,38,38,0.15)]">
                <Upload className="w-6 h-6" />
                Submit Evidence
              </button>
            </Link>
        </div>
        <p className="text-neutral-600 font-mono text-sm mt-8 uppercase tracking-widest">
            Scan your first contract for free. No credit card required.
        </p>
      </motion.div>
    </motion.div>
  );
}
