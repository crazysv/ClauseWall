"use client";

import { motion, MotionValue, useTransform, useMotionValueEvent } from "framer-motion";
import { useRef } from "react";

export default function VitalsMonitor({ 
  scrollYProgress, 
  isSimplified = false 
}: { 
  scrollYProgress?: MotionValue<number>;
  isSimplified?: boolean;
}) {
  const beamRef = useRef<HTMLDivElement>(null);
  const span1Ref = useRef<HTMLSpanElement>(null);
  const redact1Ref = useRef<HTMLSpanElement>(null);
  const span2Ref = useRef<HTMLSpanElement>(null);
  const redact2Ref = useRef<HTMLSpanElement>(null);

  if (isSimplified || !scrollYProgress) {
    return (
      <div className="flex flex-col gap-6 bg-[#0a0a0a] border border-[#262626] p-8">
        <h2 className="text-3xl font-bold flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
           Live Threat Monitoring
        </h2>
        <p className="text-neutral-400">ClauseWall constantly scans documents as you read them, instantly blacking out deceptive clauses and highlighting critical risks.</p>
      </div>
    );
  }

  // Active from 0.4 to 0.6
  const opacity = useTransform(scrollYProgress, [0.35, 0.4, 0.6, 0.65], [0, 1, 1, 0]);
  const pointerEvents = useTransform(scrollYProgress, (v) => v > 0.35 && v < 0.65 ? "auto" : "none");

  // Text scrolls up to simulate live reading
  const textY = useTransform(scrollYProgress, [0.4, 0.6], ["20%", "-40%"]);

  // Scanning beam opacity
  const beamOpacity = useTransform(scrollYProgress, [0.4, 0.45, 0.55, 0.6], [0, 1, 1, 0]);

  // Native intersection tracking linked to scroll progress securely
  useMotionValueEvent(scrollYProgress, "change", () => {
     if (!beamRef.current) return;
     const beamBox = beamRef.current.getBoundingClientRect();
     
     // Clause 1 check
     if (span1Ref.current && redact1Ref.current) {
        if (span1Ref.current.getBoundingClientRect().top <= beamBox.top + 10) {
           redact1Ref.current.style.width = "100%";
        } else {
           redact1Ref.current.style.width = "0%";
        }
     }
     
     // Clause 2 check
     if (span2Ref.current && redact2Ref.current) {
        if (span2Ref.current.getBoundingClientRect().top <= beamBox.top + 10) {
           redact2Ref.current.style.width = "100%";
        } else {
           redact2Ref.current.style.width = "0%";
        }
     }
  });

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ opacity, pointerEvents: pointerEvents as any }}
    >
      <div className="w-full max-w-4xl mx-auto px-4 relative h-[60vh] overflow-hidden bg-[#050505] border border-neutral-900 shadow-2xl">
        
        {/* Header HUD */}
        <div className="absolute top-0 left-0 w-full p-4 border-b border-neutral-900 bg-black/80 backdrop-blur-sm z-20 flex justify-between items-center">
            <div className="flex items-center gap-3">
               <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
               <span className="text-red-500 font-mono text-xs tracking-widest uppercase">Live Scan Active</span>
            </div>
            <span className="text-neutral-600 font-mono text-xs select-none">SEQ // 00492.X</span>
        </div>

        {/* Center Scanning Beam */}
        <motion.div 
           ref={beamRef}
           className="absolute top-1/2 left-0 w-full h-[2px] bg-cyan-500 z-10 shadow-[0_0_15px_rgba(6,182,212,0.8)]"
           style={{ opacity: beamOpacity }}
        />

        {/* Scrolling Text */}
        <motion.div className="absolute top-1/2 left-0 w-full px-8 md:px-16" style={{ y: textY }}>
            <div className="text-neutral-500 font-mono text-sm md:text-base leading-loose max-w-2xl mx-auto space-y-6">
                <p>3.1 User grants Corporation a perpetual, worldwide, royalty-free license to use, reproduce, modify, and distribute any Content.</p>
                
                <p className="relative inline-block text-white">
                  3.2 In the event of termination, the User <span ref={span1Ref} className="text-white relative inline-block">
                    forfeits any right to refund or compensation
                    {/* Redaction block natively driven by beam intersection */}
                    <span 
                        ref={redact1Ref}
                        className="absolute inset-0 bg-red-600 z-10 mix-blend-multiply transition-[width] duration-300 ease-out"
                        style={{ width: "0%" }}
                    />
                  </span> for services not rendered.
                </p>

                <p>4.1 Governing Law. This Agreement shall be governed by the laws of the State, without regard to its conflict of law provisions.</p>
                
                <p className="relative inline-block text-white">
                  5.1 Limitation of Liability. The Corporation shall <span ref={span2Ref} className="text-white relative inline-block">
                    not be liable for any direct, indirect, incidental, or consequential damages
                    {/* Redaction block natively driven by beam intersection */}
                    <span 
                        ref={redact2Ref}
                        className="absolute inset-0 bg-red-600 z-10 mix-blend-multiply transition-[width] duration-300 ease-out"
                        style={{ width: "0%" }}
                    />
                  </span> resulting from the use of the platform.
                </p>
                <p>5.2 Force Majeure. Neither party shall be held liable for any delay or failure in performance of any part of this Agreement.</p>
            </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
