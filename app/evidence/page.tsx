"use client";

import { useState, useEffect } from "react";
import { EvidenceCaseCard } from "@/components/evidence/evidence-case-card";
import type { EvidenceCase } from "@/types/evidence";
import { Plus, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Shield className="h-8 w-8 text-white stroke-[3px]" />
              </div>
              <div>
                <h1 className="text-3xl font-black uppercase tracking-widest text-foreground">Evidence Chain Builder</h1>
                <p className="text-sm font-bold text-muted-foreground mt-1 tracking-wide">
                  Build court-admissible evidence bundles with cryptographic integrity
                </p>
              </div>
            </div>
          </div>
          <Link href="/evidence/new">
            <Button className="btn-impact bg-blue-600 hover:bg-blue-700 text-white px-6">
              <Plus className="h-5 w-5 mr-2 stroke-[3px]" />
              NEW CASE
            </Button>
          </Link>
        </div>

        {/* Cases list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-20 border-4 border-black border-dashed bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <Shield className="h-16 w-16 mx-auto text-black dark:text-white opacity-20 mb-6 stroke-[3px]" />
            <h3 className="text-2xl font-black uppercase tracking-widest text-foreground mb-2">No evidence cases yet</h3>
            <p className="text-sm font-bold text-muted-foreground mb-8">
              Create your first case to start building court-admissible evidence chains
            </p>
            <Link href="/evidence/new">
              <Button className="btn-impact bg-blue-600 hover:bg-blue-700 text-white px-8 py-6">
                <Plus className="h-6 w-6 mr-2 stroke-[3px]" />
                CREATE EVIDENCE CASE
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cases.map((c) => (
              <EvidenceCaseCard key={c.id} evidenceCase={c} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
