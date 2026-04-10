"use client";

import { motion } from "framer-motion";
import { Shield, MessageSquare, Target, Pencil, Zap, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function FeatureBento() {
  return (
    <section className="py-24 px-4 md:px-6 max-w-6xl mx-auto">
      <div className="text-center mb-16 max-w-2xl mx-auto">
        <h2 className="text-4xl md:text-6xl font-black tracking-tight text-[#e5e5e5] mb-4">
          This is <span className="text-[#dc2626]">Ammunition.</span><br />
          Not Just Advice.
        </h2>
        <p className="text-[#a3a3a3] text-lg font-medium leading-relaxed">
          Generic AI hallucinates legal advice. ClauseWall uses deterministic rules mapped directly to Indian statutes to give you undeniable leverage.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Large Feature: Clause by Clause Scoring */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="md:col-span-2 col-span-1 bg-[#0a0a0a] border border-neutral-800 rounded-md p-8 relative overflow-hidden group hover:border-[#dc2626] transition-colors shadow-inner shadow-black/50"
        >
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="w-12 h-12 rounded-sm border-2 border-[#dc2626] flex items-center justify-center mb-6 bg-black">
              <Zap className="h-6 w-6 text-[#dc2626]" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">Deterministic Risk Scoring</h3>
              <p className="text-neutral-400 font-medium leading-relaxed max-w-md">
                Every clause is ripped apart and scored from 0-100. We don't guess — if a clause violates the Model Tenancy Act or RERA, we flag it instantly with exact citations.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Small Feature: Market Intel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="col-span-1 bg-[#050505] border border-neutral-800 rounded-md p-8 relative overflow-hidden group hover:border-neutral-600 transition-colors shadow-inner shadow-black/50"
        >
          <div className="relative z-10 flex flex-col h-full">
            <div className="w-12 h-12 rounded-sm border-2 border-neutral-700 flex items-center justify-center mb-6 bg-black">
              <Target className="h-6 w-6 text-neutral-300" />
            </div>
            <div className="mt-auto">
              <Badge className="bg-neutral-900 text-neutral-300 border border-neutral-700 uppercase tracking-widest text-[10px] mb-4 font-bold rounded-sm">
                Market Context
              </Badge>
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Are You Being Played?</h3>
              <p className="text-neutral-400 font-medium text-sm leading-relaxed">
                Compare your contract terms against 10,000+ local agreements. Know if that 6% escalation is normal for Bangalore.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Medium Feature: Playbook */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="col-span-1 bg-[#0a0a0a] border border-neutral-800 rounded-md p-8 relative group hover:border-neutral-600 transition-colors shadow-inner shadow-black/50"
        >
          <div className="w-12 h-12 rounded-sm border-2 border-neutral-700 flex items-center justify-center mb-6 bg-black">
            <MessageSquare className="h-6 w-6 text-neutral-300" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Negotiation Playbook</h3>
          <p className="text-neutral-400 font-medium text-sm leading-relaxed">
            Get step-by-step scripts on exactly what to say to your landlord or HR. Counter-responses generated for every pushback.
          </p>
        </motion.div>

        {/* Medium Feature: Rewrite */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="col-span-1 bg-[#050505] border border-neutral-800 rounded-md p-8 relative group hover:border-neutral-600 transition-colors shadow-inner shadow-black/50"
        >
           <div className="w-12 h-12 rounded-sm border-2 border-neutral-700 flex items-center justify-center mb-6 bg-black">
            <Pencil className="h-6 w-6 text-neutral-300" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Fair Rewrites</h3>
          <p className="text-neutral-400 font-medium text-sm leading-relaxed">
            For every predatory clause found, we instantly generate the legally fair alternative. Just copy, paste, and counter.
          </p>
        </motion.div>

        {/* Medium Feature: Notices */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="col-span-1 bg-[#0a0a0a] border border-neutral-800 rounded-md p-8 relative group hover:border-[#dc2626] transition-colors shadow-inner shadow-black/50"
        >
           <div className="w-12 h-12 rounded-sm border-2 border-[#dc2626] flex items-center justify-center mb-6 bg-black">
            <Scale className="h-6 w-6 text-[#dc2626]" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Legal Notices</h3>
          <p className="text-neutral-400 font-medium text-sm leading-relaxed">
            Escalation required? Auto-generate a professional, jurisdiction-specific legal notice citing the exact violations we found.
          </p>
        </motion.div>

      </div>
    </section>
  );
}
