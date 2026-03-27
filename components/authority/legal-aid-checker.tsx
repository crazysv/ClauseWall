"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Loader2, CheckCircle2, XCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { LegalAidResult } from "@/types/authority";
import { JURISDICTION_TO_STATE_CODE, LEGAL_AID_CATEGORY_LABELS } from "@/lib/authority/constants";

export default function LegalAidChecker() {
  const [income, setIncome] = useState("");
  const [category, setCategory] = useState("");
  const [state, setState] = useState("maharashtra");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LegalAidResult | null>(null);

  const handleCheck = async () => {
    setLoading(true);
    try {
      const stateCode = JURISDICTION_TO_STATE_CODE[state] || "";
      const res = await fetch("/api/authority/legal-aid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          annual_income: income ? parseInt(income) : undefined,
          category: category || undefined,
          state: stateCode,
          gender: gender || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) setResult(data.result);
    } catch (err) {
      console.error("Legal aid check failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const CATEGORIES = [
    { value: "", label: "Select if applicable" },
    ...Object.entries(LEGAL_AID_CATEGORY_LABELS).map(([k, v]) => ({ value: k, label: v })),
  ];

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/[0.02]">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="h-5 w-5 text-pink-400" />
            <h2 className="font-semibold">Free Legal Aid Checker</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Under the Legal Services Authorities Act 1987, eligible persons can get FREE legal representation.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Annual Income (₹)</label>
              <input type="number" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="e.g. 200000" className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-pink-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-pink-500 focus:outline-none">
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-pink-500 focus:outline-none">
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">State</label>
              <select value={state} onChange={(e) => setState(e.target.value)} className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-pink-500 focus:outline-none">
                {Object.entries(JURISDICTION_TO_STATE_CODE).filter(([k]) => k !== "general").map(([k]) => (
                  <option key={k} value={k}>{k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
          </div>

          <Button onClick={handleCheck} disabled={loading} className="w-full mt-4 bg-pink-600 hover:bg-pink-700 gap-2" id="legal-aid-check">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
            {loading ? "Checking..." : "Check Eligibility"}
          </Button>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Eligibility */}
          <Card className={`border ${result.eligibility.is_eligible ? "border-green-500/30 bg-green-500/5" : "border-amber-500/30 bg-amber-500/5"}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                {result.eligibility.is_eligible ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-amber-400" />
                )}
                <h3 className="font-semibold text-sm">
                  {result.eligibility.is_eligible ? "You are eligible for FREE legal aid!" : "Eligibility not confirmed"}
                </h3>
              </div>
              {result.eligibility.reasons.map((r, i) => (
                <p key={i} className="text-xs text-muted-foreground mt-1">• {r}</p>
              ))}
            </CardContent>
          </Card>

          {/* Providers */}
          {result.providers.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Available Providers</h3>
              <div className="space-y-2">
                {result.providers.slice(0, 8).map((p, i) => (
                  <Card key={i} className="border-white/10 bg-white/[0.02]">
                    <CardContent className="p-3">
                      <p className="text-sm font-medium">{p.name}</p>
                      {p.description && <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>}
                      {p.phone_numbers?.[0] && p.phone_numbers[0] !== "[VERIFY]" && (
                        <a href={`tel:${p.phone_numbers[0]}`} className="text-xs text-blue-400 flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3" /> {p.phone_numbers[0]}
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Helplines */}
          <div>
            <h3 className="text-sm font-semibold mb-3">📞 National Helplines</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {result.helplines.map((h, i) => (
                <a key={i} href={`tel:${h.number}`} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/10 hover:border-blue-500/30 transition-colors">
                  <Phone className="h-4 w-4 text-green-400" />
                  <div>
                    <p className="text-sm font-medium">{h.name}</p>
                    <p className="text-xs text-green-400">{h.number} • {h.hours}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
