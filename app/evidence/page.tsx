"use client";

import { useState, useEffect } from "react";
import { EvidenceCaseCard } from "@/components/evidence/evidence-case-card";
import type { EvidenceCase } from "@/types/evidence";
import { Plus, Shield, Loader2 } from "lucide-react";
import Link from "next/link";

export default function EvidenceListPage() {
  const [cases, setCases] = useState<EvidenceCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCases() {
      try {
        const res = await fetch("/api/evidence/cases");
        if (res.ok) {
          const data = await res.json();
          setCases(data.cases || []);
        }
      } catch (e) {
        console.error("Failed to fetch cases:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchCases();
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-neutral-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-900">
          <div className="flex items-center gap-4">
            <div className="p-2.5 border border-cyan-900/50 bg-cyan-950/10">
              <Shield className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xs font-mono uppercase tracking-widest text-neutral-200">
                EVIDENCE_CHAIN_BUILDER
              </h1>
              <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 mt-0.5">
                BUILD COURT-ADMISSIBLE EVIDENCE BUNDLES WITH CRYPTOGRAPHIC INTEGRITY
              </p>
            </div>
          </div>
          <Link
            href="/evidence/new"
            className="flex items-center gap-2 px-4 py-2 border border-cyan-900/50 bg-cyan-950/10 font-mono uppercase tracking-widest text-[8px] text-cyan-400 hover:text-cyan-300 hover:border-cyan-800 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            NEW CASE
          </Link>
        </div>

        {/* Cases list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-amber-500/50" />
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-neutral-800 bg-[#050505]">
            <Shield className="h-12 w-12 mx-auto text-neutral-800 mb-6" />
            <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-400 mb-2">
              NO EVIDENCE CASES YET
            </h3>
            <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 mb-8 leading-relaxed">
              CREATE YOUR FIRST CASE TO START BUILDING COURT-ADMISSIBLE EVIDENCE CHAINS
            </p>
            <Link
              href="/evidence/new"
              className="inline-flex items-center gap-2 px-6 py-3 border border-cyan-900/50 bg-cyan-950/10 font-mono uppercase tracking-widest text-[8px] text-cyan-400 hover:text-cyan-300 hover:border-cyan-800 transition-colors"
            >
              <Plus className="h-4 w-4" />
              CREATE EVIDENCE CASE
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {cases.map((c) => (
              <EvidenceCaseCard key={c.id} evidenceCase={c} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
