"use client";

import { motion } from "framer-motion";
import { Mic, Volume2, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function BhashaHighlight() {
  return (
    <section className="py-24 px-4 md:px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* Left: Content */}
        <div className="order-2 md:order-1">
          <Badge className="bg-transparent text-amber-500 border-2 border-amber-500 uppercase tracking-widest text-[10px] mb-6 font-bold px-3 py-1 rounded-sm">
            [ Bhasha Engine ]
          </Badge>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
            Law Doesn't Speak <span className="text-amber-500">English.</span><br />
            It Speaks Your Language.
          </h2>
          <p className="text-[#a3a3a3] text-lg leading-relaxed mb-8 max-w-lg font-medium">
            Understand your contract in Hindi or 8+ regional languages. Ask questions with your voice, and get spoken answers back. Legal defense should never be blocked by a language barrier.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-[#0a0a0a] border border-neutral-800 flex items-center justify-center rounded-sm shadow-inner shadow-black/80">
                <Globe className="h-4 w-4 text-amber-500" />
              </div>
              <span className="font-bold text-neutral-200">Native Regional Translation</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-[#0a0a0a] border border-neutral-800 flex items-center justify-center rounded-sm shadow-inner shadow-black/80">
                <Volume2 className="h-4 w-4 text-amber-500" />
              </div>
              <span className="font-bold text-neutral-200">Audio Playback of Clauses</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-[#0a0a0a] border border-neutral-800 flex items-center justify-center rounded-sm shadow-inner shadow-black/80">
                <Mic className="h-4 w-4 text-amber-500" />
              </div>
              <span className="font-bold text-neutral-200">Voice-Activated Queries</span>
            </div>
          </div>
        </div>

        {/* Right: Visual */}
        <div className="order-1 md:order-2 relative">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative bg-[#050505] border-2 border-neutral-800 rounded-md p-6 shadow-2xl"
          >
            {/* Mock Audio Player */}
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-neutral-800">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 border border-amber-500/50 flex items-center justify-center bg-black rounded-sm shadow-inner shadow-black/80">
                  <Volume2 className="h-5 w-5 text-amber-500 ml-0.5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#e5e5e5]">Playing Analysis...</div>
                  <div className="text-xs text-[#737373]">Hindi (India)</div>
                </div>
              </div>
              <div className="flex gap-1 items-end h-8">
                {[1, 2, 3, 2, 4, 3, 2, 4, 5, 3, 2].map((h, i) => (
                  <motion.div 
                    key={i}
                    animate={{ height: [`${h * 4}px`, `${h * 8}px`, `${h * 4}px`] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
                    className="w-1 bg-amber-500 rounded-none"
                  />
                ))}
              </div>
            </div>

            {/* Simulated Hindi Translation */}
            <div className="space-y-4">
              <div className="p-4 bg-[#0a0a0a] border border-neutral-800 rounded-sm shadow-inner shadow-black/80">
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-2 block border-b border-neutral-800 pb-2">Translated Output</span>
                <p className="text-sm text-neutral-200 leading-relaxed block font-medium mt-2">
                  "यह क्लॉज़ स्पष्ट रूप से मॉडल टेनेंसी एक्ट का उल्लंघन करता है। मकान मालिक आपसे 10 महीने का डिपॉजिट नहीं मांग सकता।"
                </p>
              </div>
            </div>

          </motion.div>
        </div>

      </div>
    </section>
  );
}
