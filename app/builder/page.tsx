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
  Home: <Home className="w-8 h-8" />,
  Briefcase: <Briefcase className="w-8 h-8" />,
  Handshake: <Handshake className="w-8 h-8" />,
  ShieldCheck: <ShieldCheck className="w-8 h-8" />,
  Wallet: <Wallet className="w-8 h-8" />,
  Users: <Users className="w-8 h-8" />,
  FileText: <FileText className="w-8 h-8" />,
  Settings: <Settings className="w-8 h-8" />,
  FileSignature: <FileSignature className="w-8 h-8" />,
  Stamp: <Stamp className="w-8 h-8" />,
};

export default function BuilderPage() {
  const router = useRouter();
  const templates = getAllTemplates();

  const available = templates.filter((t) => t.fields.length > 0);
  const comingSoon = templates.filter((t) => t.fields.length === 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 border-4 border-black bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 text-sm font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
            <Sparkles className="w-5 h-5 stroke-[3px]" />
            AI-POWERED FAIR CONTRACT GENERATOR
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-black uppercase tracking-widest mb-6">
            BUILD A{" "}
            <span className="text-emerald-600 dark:text-emerald-400">
              FAIR CONTRACT
            </span>
          </h1>
          <p className="text-muted-foreground text-lg font-bold max-w-2xl mx-auto tracking-wide">
            Don&apos;t just find bad contracts — create good ones. Every clause
            complies with Indian law and protects <strong>both</strong> parties
            equally.
          </p>
        </motion.div>

        {/* Features Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center gap-6 mb-16"
        >
          {[
            { icon: <Scale className="w-4 h-4" />, text: "Legally Compliant" },
            {
              icon: <CheckCircle2 className="w-4 h-4" />,
              text: "Fair to Both Parties",
            },
            {
              icon: <Sparkles className="w-4 h-4" />,
              text: "State-Specific Laws",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground border-2 border-black px-3 py-1 bg-white dark:bg-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <span className="text-emerald-600 dark:text-emerald-400">
                {feature.icon}
              </span>
              {feature.text}
            </div>
          ))}
        </motion.div>

        {/* Available Templates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {available.map((template, index) => (
            <motion.button
              key={template.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              onClick={() => router.push(`/builder/${template.type}`)}
              className="group relative border-4 border-black bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none transition-all duration-300 p-8 text-left"
            >
              {/* Icon */}
              <div className="w-14 h-14 border-4 border-black bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {ICON_MAP[template.icon]}
              </div>

              {/* Content */}
              <h3 className="text-2xl font-black uppercase tracking-widest mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {template.name}
              </h3>
              <p className="text-foreground text-sm font-bold mb-6 leading-relaxed">
                {template.description}
              </p>

              {/* Laws */}
              <div className="flex flex-wrap gap-2 mb-6">
                {template.applicableLaws.slice(0, 3).map((law, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 border-2 border-black bg-gray-100 dark:bg-zinc-800 font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    {law.name}
                  </span>
                ))}
              </div>

              {/* Arrow */}
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-black uppercase tracking-widest">
                CREATE NOW
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform stroke-[3px]" />
              </div>
            </motion.button>
          ))}
        </div>

        {/* Coming Soon */}
        {comingSoon.length > 0 && (
          <>
            <h3 className="text-xl font-black uppercase tracking-widest text-muted-foreground mb-6 text-center border-t-4 border-black pt-8">
              COMING SOON
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {comingSoon.map((template, index) => (
                <motion.div
                  key={template.type}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="border-4 border-black border-dashed bg-muted dark:bg-zinc-900/50 p-6 opacity-60"
                >
                  <div className="w-10 h-10 border-4 border-black bg-gray-200 dark:bg-background border-2 border-foreground card-impact flex items-center justify-center text-muted-foreground mb-4">
                    {ICON_MAP[template.icon]}
                  </div>
                  <h4 className="font-black uppercase tracking-widest text-muted-foreground mb-2">
                    {template.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    <Clock className="w-4 h-4 stroke-[3px]" />
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
