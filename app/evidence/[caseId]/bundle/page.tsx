"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Package, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import type { BundleType, BundleConfig } from "@/types/evidence";

const BUNDLE_TYPES: { value: BundleType; label: string; desc: string }[] = [
  {
    value: "full",
    label: "Full Bundle",
    desc: "All evidence with cover, index, certificates, and chain report",
  },
  {
    value: "chronological",
    label: "Chronological",
    desc: "Evidence sorted by date",
  },
  {
    value: "issue_wise",
    label: "Issue-wise",
    desc: "Grouped by issue category",
  },
];

export default function EvidenceBundlePage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.caseId as string;

  const [bundleType, setBundleType] = useState<BundleType>("full");
  const [title, setTitle] = useState("Evidence Bundle");
  const [includeCerts, setIncludeCerts] = useState(true);
  const [includeIndex, setIncludeIndex] = useState(true);
  const [includeChain, setIncludeChain] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ pages: number; id: string } | null>(
    null,
  );
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const config: BundleConfig = {
        include_certificates: includeCerts,
        include_index: includeIndex,
        include_chain_report: includeChain,
      };

      const res = await fetch("/api/evidence/bundle/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_id: caseId,
          bundle_type: bundleType,
          title,
          config,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to generate bundle");
        return;
      }

      const data = await res.json();
      setResult({ pages: data.total_pages, id: data.bundle?.id });
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href={`/evidence/${caseId}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Case
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-none bg-blue-500/10 border border-blue-500/20">
            <Package className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Generate Evidence Bundle
            </h1>
            <p className="text-xs text-muted-foreground">
              Create a court-ready PDF with all evidence, certificates, and
              chain verification
            </p>
          </div>
        </div>

        {/* Bundle Type */}
        <div className="space-y-3 mb-6">
          <label className="text-sm font-medium text-foreground">
            Bundle Type
          </label>
          {BUNDLE_TYPES.map((bt) => (
            <button
              key={bt.value}
              onClick={() => setBundleType(bt.value)}
              className={`w-full text-left rounded-none border p-4 transition-all ${bundleType === bt.value ? "border-blue-500/50 bg-blue-500/5" : "border-foreground border-2 bg-white/[0.02] hover:border-foreground border-2"}`}
            >
              <p className="text-sm font-medium text-foreground">{bt.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{bt.desc}</p>
            </button>
          ))}
        </div>

        {/* Title */}
        <div className="space-y-2 mb-6">
          <label className="text-sm font-medium text-foreground">
            Bundle Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-none bg-muted border border-foreground border-2 px-4 py-3 text-sm text-foreground focus:outline-none focus:border-blue-500/50"
          />
        </div>

        {/* Options */}
        <div className="space-y-3 mb-8">
          <label className="text-sm font-medium text-foreground">Include</label>
          {[
            {
              label: "Section 65B Certificates",
              checked: includeCerts,
              onChange: setIncludeCerts,
            },
            {
              label: "Table of Contents / Index",
              checked: includeIndex,
              onChange: setIncludeIndex,
            },
            {
              label: "Chain of Custody Report",
              checked: includeChain,
              onChange: setIncludeChain,
            },
          ].map((opt) => (
            <label
              key={opt.label}
              className="flex items-center gap-3 p-3 rounded-none bg-white/[0.02] border border-foreground border-2 cursor-pointer hover:bg-white/[0.04]"
            >
              <input
                type="checkbox"
                checked={opt.checked}
                onChange={(e) => opt.onChange(e.target.checked)}
                className="rounded border-foreground border-2 bg-muted text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-foreground">{opt.label}</span>
            </label>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-none bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mb-4 p-4 rounded-none bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-sm text-emerald-400 font-medium">
              ✓ Bundle generated successfully!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {result.pages} pages — Ready for download from Supabase Storage
            </p>
          </div>
        )}

        {/* Generate */}
        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 h-12"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Bundle...
            </>
          ) : (
            <>
              <Package className="h-4 w-4 mr-2" />
              Generate Bundle PDF
            </>
          )}
        </Button>
      </div>
    </main>
  );
}
