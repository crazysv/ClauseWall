"use client";

import { useRef } from "react";
import { useScroll, useReducedMotion } from "framer-motion";
import HeroIncision from "./HeroIncision";
import ClauseAutopsy from "./ClauseAutopsy";
import VitalsMonitor from "./VitalsMonitor";
import MasterBoard from "./MasterBoard";
import BrutalistCTA from "./BrutalistCTA";

export default function SurgicalCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  
  const SECTIONS_COUNT = 5; // Determines the overall scroll duration factor
  
  const shouldReduceMotion = useReducedMotion();

  const MobileSimplified = () => (
    <div className="flex flex-col min-h-screen pb-32 space-y-32 pt-24 px-6 md:hidden">
      <HeroIncision scrollYProgress={scrollYProgress} isSimplified />
      <ClauseAutopsy scrollYProgress={scrollYProgress} isSimplified />
      <VitalsMonitor scrollYProgress={scrollYProgress} isSimplified />
      <MasterBoard scrollYProgress={scrollYProgress} isSimplified />
      <BrutalistCTA isSimplified />
    </div>
  );

  if (shouldReduceMotion) {
    return (
      <div className="flex flex-col min-h-screen pb-32 space-y-32 pt-24 px-6">
        <HeroIncision scrollYProgress={scrollYProgress} isSimplified />
        <ClauseAutopsy scrollYProgress={scrollYProgress} isSimplified />
        <VitalsMonitor scrollYProgress={scrollYProgress} isSimplified />
        <MasterBoard scrollYProgress={scrollYProgress} isSimplified />
        <BrutalistCTA isSimplified />
      </div>
    );
  }

  return (
    <>
      <MobileSimplified />

      {/* Desktop Complex Sticky Version */}
      <div 
        ref={containerRef} 
        className="hidden md:block relative bg-[#0a0a0a]"
        style={{ height: `calc(100vh * ${SECTIONS_COUNT})` }}
      >
        <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
            <HeroIncision scrollYProgress={scrollYProgress} />
            <ClauseAutopsy scrollYProgress={scrollYProgress} />
            <VitalsMonitor scrollYProgress={scrollYProgress} />
            <MasterBoard scrollYProgress={scrollYProgress} />
            <BrutalistCTA scrollYProgress={scrollYProgress} />
        </div>
      </div>
    </>
  );
}
