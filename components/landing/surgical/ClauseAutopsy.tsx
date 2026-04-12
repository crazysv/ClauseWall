"use client";

import { motion, MotionValue, useTransform, useMotionValueEvent, useMotionValue } from "framer-motion";
import { useRef, useLayoutEffect } from "react";

function SVGConnector({ 
  sourceRef, 
  targetRef,
  scrollYProgress
}: { 
  sourceRef: React.RefObject<HTMLElement | null>;
  targetRef: React.RefObject<HTMLElement | null>;
  scrollYProgress?: MotionValue<number>;
}) {
  const glowPathRef = useRef<SVGPathElement>(null);
  const corePathRef = useRef<SVGPathElement>(null);

  const updatePath = () => {
    const source = sourceRef.current;
    const target = targetRef.current;
    
    if (source && target && glowPathRef.current && corePathRef.current) {
      const sourceRect = source.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      
      const isTargetLeft = targetRect.left < sourceRect.left;
      const startX = isTargetLeft ? sourceRect.left : sourceRect.right;
      const startY = sourceRect.top + sourceRect.height / 2;
      const endX = isTargetLeft ? targetRect.right : targetRect.left;
      const endY = targetRect.top + targetRect.height / 2;

      const cp1X = startX + (isTargetLeft ? -50 : 50);
      const cp1Y = startY;
      const cp2X = endX + (isTargetLeft ? 50 : -50);
      const cp2Y = endY;

      const pathStr = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
      
      // Native DOM update bypasses React rendering entirely for high-frequency paints
      glowPathRef.current.setAttribute("d", pathStr);
      corePathRef.current.setAttribute("d", pathStr);
    }
  };

  useLayoutEffect(() => {
    updatePath();
    window.addEventListener("resize", updatePath);
    return () => window.removeEventListener("resize", updatePath);
  }, []);

  // Unconditionally call hook to preserve React rules, using dummy value if missing
  const dummyScroll = useMotionValue(0);
  const activeScroll = scrollYProgress || dummyScroll;
  useMotionValueEvent(activeScroll, "change", updatePath);

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
      {/* Glow path */}
      <path 
        ref={glowPathRef}
        fill="none" 
        stroke="rgba(220, 38, 38, 0.2)" 
        strokeWidth="6" 
        strokeLinecap="round" 
      />
      {/* Core line */}
      <motion.path 
        ref={corePathRef}
        fill="none" 
        stroke="rgba(220, 38, 38, 0.8)" 
        strokeWidth="1.5" 
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
    </svg>
  );
}

export default function ClauseAutopsy({ 
  scrollYProgress, 
  isSimplified = false 
}: { 
  scrollYProgress?: MotionValue<number>;
  isSimplified?: boolean;
}) {
  const span1Ref = useRef<HTMLSpanElement>(null);
  const note1Ref = useRef<HTMLDivElement>(null);

  const span2Ref = useRef<HTMLSpanElement>(null);
  const note2Ref = useRef<HTMLDivElement>(null);

  if (isSimplified || !scrollYProgress) {
    return (
      <div className="flex flex-col gap-8">
        <h2 className="text-3xl font-bold">Deep Contract Dissection</h2>
        <div className="bg-[#0e0e0e] border border-red-900/50 p-6 rounded-md shadow-2xl relative overflow-hidden">
          <div className="absolute left-0 top-6 w-1 h-8 bg-red-600" />
          <h3 className="text-red-500 font-mono text-xs uppercase tracking-widest mb-2 pl-2">Autopsy Note</h3>
          <p className="text-white font-bold text-lg mb-2">Predatory Clause Flagged</p>
          <p className="text-neutral-400 text-sm leading-relaxed">"The User waives all rights to participate in a class action lawsuit." This strips your collective bargaining power. ClauseWall automatically flags this within milliseconds.</p>
        </div>
      </div>
    );
  }

  // Fade in at 0.2, active until 0.4, fade out at 0.45
  const opacity = useTransform(scrollYProgress, [0.15, 0.2, 0.4, 0.45], [0, 1, 1, 0]);
  const pointerEvents = useTransform(scrollYProgress, (v) => v > 0.15 && v < 0.45 ? "auto" : "none");

  // Move notes up slightly as you scroll
  const noteY1 = useTransform(scrollYProgress, [0.2, 0.4], [50, -50]);
  const noteY2 = useTransform(scrollYProgress, [0.25, 0.4], [50, -50]);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ opacity, pointerEvents: pointerEvents as any }}
    >
      <SVGConnector sourceRef={span1Ref} targetRef={note1Ref} scrollYProgress={scrollYProgress} />
      <SVGConnector sourceRef={span2Ref} targetRef={note2Ref} scrollYProgress={scrollYProgress} />

      <div className="w-full max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 items-center h-full relative z-10">
        
        <motion.div className="col-span-1" style={{ y: noteY1 }} ref={note1Ref}>
          <div className="bg-[#0e0e0e] border border-red-900/50 p-6 shadow-2xl backdrop-blur-md relative pointer-events-auto">
            <div className="absolute -left-2 top-6 w-4 h-[2px] bg-red-600" />
            <h3 className="text-red-500 font-mono text-xs uppercase tracking-widest mb-3">Autopsy Trace 01</h3>
            <p className="text-white font-bold text-lg mb-2">Class Action Waiver</p>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Companies sneak this in to prevent massive lawsuits. By signing, you agree to fight them alone in private arbitration.
            </p>
          </div>
        </motion.div>

        <div className="col-span-1 text-center flex justify-center">
             <div className="max-w-sm text-left text-neutral-500 font-mono text-sm leading-loose border-l border-neutral-800 pl-6">
                ...arising from the Corporation's own negligence. The User <span ref={span1Ref} className="text-red-500 bg-red-950/30 px-1 py-0.5 outline outline-1 outline-red-500/50">waives all rights to participate</span> in a class action lawsuit. Arbitration shall be <span ref={span2Ref} className="text-amber-500 bg-amber-950/30 px-1 py-0.5 outline outline-1 outline-amber-500/50">binding and conducted in a venue solely chosen by the Corporation</span>...
             </div>
        </div>

        <motion.div className="col-span-1" style={{ y: noteY2 }} ref={note2Ref}>
          <div className="bg-[#0e0e0e] border border-amber-900/50 p-6 shadow-2xl backdrop-blur-md relative mt-32 pointer-events-auto">
             <div className="absolute -right-2 top-6 w-4 h-[2px] bg-amber-600" />
            <h3 className="text-amber-500 font-mono text-xs uppercase tracking-widest mb-3">Autopsy Trace 02</h3>
            <p className="text-white font-bold text-lg mb-2">Forced Arbitration</p>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Forces you to settle disputes outside of court, usually with an arbitrator paid by the company you are fighting.
            </p>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
