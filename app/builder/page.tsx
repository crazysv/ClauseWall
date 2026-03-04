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
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            AI-Powered Fair Contract Generator
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Build a{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Fair Contract
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Don&apos;t just find bad contracts — create good ones. Every clause complies
            with Indian law and protects <strong>both</strong> parties equally.
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
            { icon: <CheckCircle2 className="w-4 h-4" />, text: "Fair to Both Parties" },
            { icon: <Sparkles className="w-4 h-4" />, text: "State-Specific Laws" },
          ].map((feature, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-sm text-gray-400"
            >
              <span className="text-emerald-400">{feature.icon}</span>
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
              className="group relative bg-gray-900/50 border border-gray-800 rounded-2xl p-8 text-left hover:border-emerald-500/50 hover:bg-gray-900/80 transition-all duration-300"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 group-hover:bg-emerald-500/20 transition-colors">
                {ICON_MAP[template.icon]}
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold mb-2 group-hover:text-emerald-400 transition-colors">
                {template.name}
              </h3>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                {template.description}
              </p>

              {/* Laws */}
              <div className="flex flex-wrap gap-2 mb-4">
                {template.applicableLaws.slice(0, 3).map((law, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 bg-gray-800 rounded-md text-gray-400"
                  >
                    {law.name}
                  </span>
                ))}
              </div>

              {/* Arrow */}
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                Create Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>
          ))}
        </div>

        {/* Coming Soon */}
        {comingSoon.length > 0 && (
          <>
            <h3 className="text-lg font-semibold text-gray-500 mb-4 text-center">
              Coming Soon
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {comingSoon.map((template, index) => (
                <motion.div
                  key={template.type}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="bg-gray-900/30 border border-gray-800/50 rounded-xl p-6 opacity-60"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-500 mb-3">
                    {ICON_MAP[template.icon]}
                  </div>
                  <h4 className="font-medium text-gray-500 mb-1">
                    {template.name}
                  </h4>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Clock className="w-3 h-3" />
                    Coming Soon
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