"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Building2, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { JurisdictionResult } from "@/types/authority";
import {
  INDIAN_STATES,
  JURISDICTION_TO_STATE_CODE,
} from "@/lib/authority/constants";
import JurisdictionResultView from "./jurisdiction-result";

export default function AuthorityFinder() {
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
    } catch (err) {
      console.error("Authority routing failed:", err);
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
      <Card className="card-impact p-8 rounded-none">
        <CardContent className="p-0">
          <div className="flex items-center gap-3 border-b-4 border-black pb-4 mb-6">
            <div className="p-3 bg-blue-100 border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Building2 className="h-6 w-6 text-blue-600 stroke-[3px]" />
            </div>
            <h2 className="font-black text-2xl uppercase tracking-widest">
              Route Your Dispute
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-black uppercase tracking-widest">
                Document Type
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full border-4 border-black p-3 bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all"
              >
                {DOC_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black uppercase tracking-widest">
                State / Jurisdiction
              </label>
              <select
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="w-full border-4 border-black p-3 bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all"
              >
                {JURISDICTIONS.map((j) => (
                  <option key={j.value} value={j.value}>
                    {j.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black uppercase tracking-widest">
                Claim Amount (₹, optional)
              </label>
              <input
                type="number"
                value={claimAmount}
                onChange={(e) => setClaimAmount(e.target.value)}
                placeholder="e.g. 500000"
                className="w-full border-4 border-black p-3 bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all placeholder:font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black uppercase tracking-widest">
                Counterparty Type
              </label>
              <select
                value={counterpartyType}
                onChange={(e) => setCounterpartyType(e.target.value)}
                className="w-full border-4 border-black p-3 bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all"
              >
                {COUNTERPARTIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            onClick={handleSearch}
            disabled={loading}
            className="w-full mt-8 btn-impact btn-impact-primary py-6"
            id="authority-finder-search"
          >
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
            ) : (
              <Search className="h-6 w-6 mr-2 stroke-[3px]" />
            )}
            {loading ? "ROUTING..." : "FIND JURISDICTION"}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <JurisdictionResultView result={result} />
        </motion.div>
      )}
    </div>
  );
}
