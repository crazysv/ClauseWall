"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Building2, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { JurisdictionResult } from "@/types/authority";
import { INDIAN_STATES, JURISDICTION_TO_STATE_CODE } from "@/lib/authority/constants";
import { JurisdictionResultView } from "./jurisdiction-result";

export function AuthorityFinder() {
  const [documentType, setDocumentType] = useState("rental");
  const [jurisdiction, setJurisdiction] = useState("maharashtra");
  const [claimAmount, setClaimAmount] = useState("");
  const [counterpartyType, setCounterpartyType] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JurisdictionResult | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/authority/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_type: documentType,
          jurisdiction,
          claim_amount: claimAmount ? parseInt(claimAmount) : undefined,
          counterparty_type: counterpartyType || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) setResult(data.result);
    } catch {
        // Silently handled
      } finally {
      setLoading(false);
    }
  };

  const DOC_TYPES = [
    { value: "rental", label: "Rental Agreement" },
    { value: "employment", label: "Employment Contract" },
    { value: "loan", label: "Loan Agreement" },
    { value: "tos", label: "Terms of Service" },
    { value: "service", label: "Service Agreement" },
    { value: "sale", label: "Sale Agreement / Property" },
    { value: "insurance", label: "Insurance Policy" },
    { value: "freelance", label: "Freelance Contract" },
    { value: "other", label: "Other" },
  ];

  const COUNTERPARTIES = [
    { value: "", label: "Auto-detect" },
    { value: "company", label: "Company" },
    { value: "bank", label: "Bank" },
    { value: "nbfc", label: "NBFC / Fintech" },
    { value: "insurance", label: "Insurance Company" },
    { value: "builder", label: "Builder / Developer" },
    { value: "employer", label: "Employer" },
    { value: "landlord", label: "Landlord" },
    { value: "government", label: "Government" },
    { value: "individual", label: "Individual" },
  ];

  const JURISDICTIONS = Object.entries(JURISDICTION_TO_STATE_CODE)
    .filter(([k]) => k !== "general")
    .map(([k]) => ({
      value: k,
      label: k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    }));

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card className="border-white/10 bg-white dark:bg-slate-900/[0.02]">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-indigo-400" />
            <h2 className="font-semibold">Find Your Legal Authority</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Document Type</label>
              <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                {DOC_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">State / Jurisdiction</label>
              <select value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                {JURISDICTIONS.map((j) => (
                  <option key={j.value} value={j.value}>{j.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Claim Amount (₹, optional)</label>
              <input type="number" value={claimAmount} onChange={(e) => setClaimAmount(e.target.value)} placeholder="e.g. 500000" className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Counterparty Type</label>
              <select value={counterpartyType} onChange={(e) => setCounterpartyType(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                {COUNTERPARTIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <Button onClick={handleSearch} disabled={loading} className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 gap-2" id="authority-finder-search">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {loading ? "Finding Authority..." : "Find the Right Authority"}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <JurisdictionResultView result={result} />
        </motion.div>
      )}
    </div>
  );
}
