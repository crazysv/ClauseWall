"use client";

import { motion, MotionValue, useTransform } from "framer-motion";

export default function MasterBoard({ 
  scrollYProgress, 
  isSimplified = false 
}: { 
  scrollYProgress?: MotionValue<number>;
  isSimplified?: boolean;
}) {
  if (isSimplified || !scrollYProgress) {
    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-3xl font-bold">Collective Defense Grid</h2>
        <p className="text-neutral-400">Your document doesn't exist in a vacuum. ClauseWall compares your contract against thousands of others, identifying structural patterns of abuse across the industry. When one user finds a loophole, everyone's defense gets stronger.</p>
        <div className="grid grid-cols-2 gap-4 mt-8 opacity-50">
           {/* Static fallback grid */}
           {Array(6).fill(null).map((_, i) => (
             <div key={i} className="h-24 border border-neutral-800 bg-[#111] rounded-sm" />
           ))}
        </div>
      </div>
    );
  }

  // Active from 0.6 to 0.8, fade out at 0.85
  const opacity = useTransform(scrollYProgress, [0.55, 0.6, 0.8, 0.85], [0, 1, 1, 0]);
  const pointerEvents = useTransform(scrollYProgress, (v) => v > 0.55 && v < 0.85 ? "auto" : "none");

  // Main container scales down
  const mainScale = useTransform(scrollYProgress, [0.6, 0.7], [1.5, 0.4]);
  
  // Background grid fades in securely
  const gridOpacity = useTransform(scrollYProgress, [0.65, 0.75], [0, 1]);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ opacity, pointerEvents: pointerEvents as any }}
    >
      
      {/* Background Grid of Documents */}
      <motion.div 
        className="absolute inset-0 z-0 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 p-8 opacity-20"
        style={{ opacity: gridOpacity }}
      >
         {Array(48).fill(null).map((_, idx) => (
            <div key={idx} className="aspect-[3/4] border border-neutral-800 bg-[#0a0a0a] rounded-sm relative overflow-hidden">
                {/* Randomly "flagged" docs */}
                {idx % 7 === 0 && <div className="absolute inset-0 bg-red-900/20 mix-blend-screen" />}
            </div>
         ))}
      </motion.div>

      {/* Main Focus Document */}
      <motion.div 
        className="relative z-10 w-full max-w-2xl aspect-video bg-[#050505] border shadow-2xl flex items-center justify-center border-red-900/50"
        style={{ scale: mainScale }}
      >
          <div className="text-center p-8">
             <div className="w-16 h-16 mx-auto bg-red-600/20 rounded-full flex items-center justify-center mb-4 border border-red-500/50">
                <span className="w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(220,38,38,1)]" />
             </div>
             <h3 className="text-white font-black text-2xl tracking-tight mb-2">Subject 001</h3>
             <p className="text-neutral-500 font-mono text-xs max-w-xs mx-auto">
               Correlating predatory clauses with global database. Finding 14,233 similar structural abuses in employment bonds.
             </p>
          </div>
      </motion.div>

    </motion.div>
  );
}
