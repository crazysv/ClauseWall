"use client";

import { motion, useReducedMotion, Variants } from "framer-motion";
import { ReactNode } from "react";

export default function Template({ children }: { children: ReactNode }) {
  const prefersReducedMotion = useReducedMotion();

  const pageVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.4, ease: "easeOut" }
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial={prefersReducedMotion ? "visible" : "hidden"}
      animate="visible"
      className="flex-grow w-full"
    >
      {children}
    </motion.div>
  );
}
