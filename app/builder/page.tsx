"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  Briefcase,
  Handshake,
  ShieldCheck,
  Wallet,
  Users,
  FileText,
  ArrowRight,
  Sparkles,
  Scale,
  CheckCircle2,
  Clock,
  Settings,
  FileSignature,
  Stamp,
} from "lucide-react";
import { getAllTemplates } from "@/lib/builder/template-fields";
import { ContractTemplateType } from "@/types";

const ICON_MAP: Record<string, React.ReactNode> = {
  Home: <Home className="w-5 h-5" />,
  Briefcase: <Briefcase className="w-5 h-5" />,
  Handshake: <Handshake className="w-5 h-5" />,
  ShieldCheck: <ShieldCheck className="w-5 h-5" />,
  Wallet: <Wallet className="w-5 h-5" />,
  Users: <Users className="w-5 h-5" />,
  FileText: <FileText className="w-5 h-5" />,
  Settings: <Settings className="w-5 h-5" />,
  FileSignature: <FileSignature className="w-5 h-5" />,
  Stamp: <Stamp className="w-5 h-5" />,
};

export default function BuilderPage() {
  const router = useRouter();
  const templates = getAllTemplates();

  const available = templates.filter((t) => t.fields.length > 0);
  const comingSoon = templates.filter((t) => t.fields.length === 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-emerald-900/50 bg-emerald-950/20 text-[8px] font-mono uppercase tracking-widest text-emerald-400 mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            AI-POWERED FAIR CONTRACT GENERATOR
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-mono uppercase tracking-widest mb-5 text-neutral-100">
            BUILD A{" "}
            <span className="text-emerald-400">
              FAIR CONTRACT
            </span>
          </h1>
          <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 max-w-xl mx-auto leading-relaxed">
            DON&apos;T JUST FIND BAD CONTRACTS — CREATE GOOD ONES. EVERY CLAUSE
            COMPLIES WITH INDIAN LAW AND PROTECTS <strong className="text-neutral-300">BOTH</strong> PARTIES
            EQUALLY.
          </p>
        </motion.div>

        {/* Features Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center gap-3 mb-14"
        >
          {[
            { icon: <Scale className="w-3 h-3" />, text: "Legally Compliant" },
            {
              icon: <CheckCircle2 className="w-3 h-3" />,
              text: "Fair to Both Parties",
            },
            {
              icon: <Sparkles className="w-3 h-3" />,
              text: "State-Specific Laws",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 text-[7px] font-mono uppercase tracking-widest text-neutral-500 border border-neutral-800 px-2.5 py-1 bg-[#050505]"
            >
              <span className="text-emerald-400">
                {feature.icon}
              </span>
              {feature.text}
            </div>
          ))}
        </motion.div>

        {/* Available Templates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {available.map((template, index) => (
            <motion.button
              key={template.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              onClick={() => router.push(`/builder/${template.type}`)}
              className="group relative border border-neutral-900 bg-[#0a0a0a] hover:border-neutral-700 transition-colors p-6 text-left"
            >
              {/* Icon */}
              <div className="w-10 h-10 border border-emerald-900/50 bg-emerald-950/10 flex items-center justify-center text-emerald-400 mb-5">
                {ICON_MAP[template.icon]}
              </div>

              {/* Content */}
              <h3 className="text-[10px] font-mono uppercase tracking-widest mb-2 text-neutral-200 group-hover:text-emerald-400 transition-colors">
                {template.name}
              </h3>
              <p className="text-[8px] font-mono text-neutral-600 mb-5 leading-relaxed">
                {template.description}
              </p>

              {/* Laws */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {template.applicableLaws.slice(0, 3).map((law, i) => (
                  <span
                    key={i}
                    className="text-[7px] px-1.5 py-0.5 border border-neutral-800 bg-[#050505] font-mono uppercase tracking-widest text-neutral-500"
                  >
                    {law.name}
                  </span>
                ))}
              </div>

              {/* Arrow */}
              <div className="flex items-center gap-2 text-emerald-400 text-[8px] font-mono uppercase tracking-widest">
                CREATE NOW
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>
          ))}
        </div>

        {/* Coming Soon */}
        {comingSoon.length > 0 && (
          <>
            <h3 className="text-[9px] font-mono uppercase tracking-widest text-neutral-600 mb-6 text-center border-t border-neutral-900 pt-8">
              COMING SOON
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {comingSoon.map((template, index) => (
                <motion.div
                  key={template.type}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="border border-dashed border-neutral-800 bg-[#050505] p-5 opacity-50"
                >
                  <div className="w-8 h-8 border border-neutral-800 bg-[#0a0a0a] flex items-center justify-center text-neutral-600 mb-3">
                    {ICON_MAP[template.icon]}
                  </div>
                  <h4 className="text-[9px] font-mono uppercase tracking-widest text-neutral-600 mb-2">
                    {template.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[7px] font-mono uppercase tracking-widest text-neutral-700">
                    <Clock className="w-3 h-3" />
                    COMING SOON
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
