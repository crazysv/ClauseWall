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
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Shield className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Evidence Chain Builder</h1>
                <p className="text-sm text-muted-foreground">
                  Build court-admissible evidence bundles with cryptographic integrity
                </p>
              </div>
            </div>
          </div>
          <Link href="/evidence/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Case
            </Button>
          </Link>
        </div>

        {/* Cases list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-16 border border-white/5 rounded-xl bg-white/[0.01]">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No evidence cases yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Create your first case to start building court-admissible evidence chains
            </p>
            <Link href="/evidence/new">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Evidence Case
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
