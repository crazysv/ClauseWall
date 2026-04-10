"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  Upload,
  ArrowRight,
  ChevronRight,
  Chrome,
  Globe,
  Zap
} from "lucide-react";
import HeroMockup from "@/components/landing/hero-mockup";
import TrustStats from "@/components/landing/trust-stats";
import FeatureBento from "@/components/landing/feature-bento";
import BhashaHighlight from "@/components/landing/bhasha-highlight";

export default function HomePage() {
  return (
    <main className="w-full bg-[#0a0a0a] min-h-screen text-[#e5e5e5] selection:bg-red-500/30 font-sans">
      
      {/* Removed Ambient Glow to maintain stark editorial canvas */}

      {/* 1. Hero Section */}
      <section className="relative pt-32 pb-16 px-4 md:px-6 z-10">
        <div className="max-w-4xl mx-auto text-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-sm border border-[#dc2626] text-[#dc2626] text-xs font-bold uppercase tracking-widest mb-8"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>India's First Defensive Legal Engine</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-6xl md:text-8xl lg:text-[7rem] font-black tracking-tighter leading-none text-white mb-6 font-display"
          >
            Never Sign <br className="hidden md:block" />
            <span className="text-[#dc2626]">Blindly</span> Again.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10 font-medium"
          >
            ClauseWall analyzes your lease, employment bond, or loan in seconds. We find hidden traps, cite exactly which Indian laws they violate, and give you the legal ammunition to push back.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/upload" className="w-full sm:w-auto">
              <div className="flex items-center justify-center gap-2 bg-[#dc2626] text-white px-8 py-4 rounded-md font-bold transition-colors hover:bg-red-700">
                <Upload className="w-5 h-5" />
                Analyze Your Document
                <ArrowRight className="w-5 h-5" />
              </div>
            </Link>
            <Link href="#reveal" className="w-full sm:w-auto">
              <div className="flex items-center justify-center gap-2 bg-transparent text-[#e5e5e5] px-8 py-4 rounded-md font-bold border-2 border-neutral-800 hover:border-neutral-600 transition-colors">
                See How It Works
              </div>
            </Link>
          </motion.div>

        </div>
      </section>

      {/* 2. Hero Mockup Reveal */}
      <section id="reveal" className="px-4 mb-20">
        <HeroMockup />
      </section>

      {/* 3. Trust Stats Strip */}
      <TrustStats />

      {/* 4. Tier 1 Core Capabilities (Bento) */}
      <FeatureBento />

      {/* 5. Tier 2 Bhasha Engine */}
      <div className="border-t border-[#262626] bg-[#050505]">
        <BhashaHighlight />
      </div>

      {/* 6. Ecosystem Section (De-emphasized) */}
      <section className="py-20 px-4 md:px-6 border-t border-[#262626] bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto bg-[#111111] border border-[#262626] rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 shadow-xl">
          <div className="flex-shrink-0 w-20 h-20 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex items-center justify-center">
            <Chrome className="w-10 h-10 text-blue-500" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-bold text-[#e5e5e5] mb-2">Browser Extension</h3>
            <p className="text-[#a3a3a3] leading-relaxed max-w-lg mx-auto md:mx-0">
              Auto-scan Terms of Service on any website. Our extension highlights dangerous privacy policies and aggressive legal clauses in real-time as you browse.
            </p>
          </div>
          <div className="flex-shrink-0">
            <button className="flex items-center gap-2 bg-[#262626] text-[#e5e5e5] px-6 py-3 rounded-lg font-semibold hover:bg-[#404040] transition-colors">
              <Globe className="w-4 h-4" />
              Get Extension
            </button>
          </div>
        </div>
      </section>

      {/* 7. Final Action Escalation */}
      <section className="py-32 px-4 md:px-6 bg-[#0a0a0a] border-t border-[#1a1a1a] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-xl h-px bg-[#dc2626]" />
        
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <Shield className="w-16 h-16 text-[#dc2626] mx-auto mb-6" />
          <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6">
            Build Your Wall. <br />
            Sign with Power.
          </h2>
          <p className="text-[#a3a3a3] text-lg max-w-xl mx-auto mb-10">
            Lakhs of Indians sign predatory agreements every year. Don't be a statistic. Drop your PDF now and see exactly what they're hiding.
          </p>
          
          <div className="flex justify-center">
            <Link href="/upload">
              <div className="flex items-center justify-center gap-3 bg-[#dc2626] text-white px-10 py-5 rounded-md font-bold text-lg transition-colors hover:bg-red-700">
                <Upload className="w-6 h-6" />
                Upload Your Contract — It's Free
                <ChevronRight className="w-6 h-6" />
              </div>
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
