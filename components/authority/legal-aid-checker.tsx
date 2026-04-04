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
      <Card className="card-impact p-8 rounded-none">
        <CardContent className="p-0">
          <div className="flex items-center gap-3 mb-6 border-b-4 border-black pb-4">
            <div className="p-3 bg-pink-100 border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Heart className="h-6 w-6 text-pink-600 stroke-[3px]" />
            </div>
            <div>
              <h2 className="font-black text-2xl uppercase tracking-widest">Free Legal Aid Checker</h2>
              <p className="text-sm font-bold text-muted-foreground mt-1">
                Under the Legal Services Authorities Act 1987, eligible persons can get FREE legal representation.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-black uppercase tracking-widest">Annual Income (₹)</label>
              <input type="number" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="e.g. 200000" className="w-full border-4 border-black p-3 bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all placeholder:font-medium" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black uppercase tracking-widest">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border-4 border-black p-3 bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all">
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black uppercase tracking-widest">Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full border-4 border-black p-3 bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all">
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black uppercase tracking-widest">State</label>
              <select value={state} onChange={(e) => setState(e.target.value)} className="w-full border-4 border-black p-3 bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all">
                {Object.entries(JURISDICTION_TO_STATE_CODE).filter(([k]) => k !== "general").map(([k]) => (
                  <option key={k} value={k}>{k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
          </div>

          <Button onClick={handleCheck} disabled={loading} className="w-full mt-8 btn-impact bg-pink-600 hover:bg-pink-700 text-white py-6" id="legal-aid-check">
            {loading ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <Heart className="h-6 w-6 mr-2 stroke-[3px]" />}
            {loading ? "CHECKING..." : "CHECK ELIGIBILITY"}
          </Button>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Eligibility */}
          <Card className={`border-4 rounded-none ${result.eligibility.is_eligible ? "border-green-600 bg-green-50 dark:bg-green-900/20 shadow-[4px_4px_0px_0px_rgba(22,163,74,1)]" : "border-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-[4px_4px_0px_0px_rgba(245,158,11,1)]"}`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                {result.eligibility.is_eligible ? (
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400 stroke-[3px]" />
                ) : (
                  <XCircle className="h-8 w-8 text-amber-600 dark:text-amber-400 stroke-[3px]" />
                )}
                <h3 className="font-black text-lg uppercase tracking-widest">
                  {result.eligibility.is_eligible ? "You are eligible for FREE legal aid!" : "Eligibility not confirmed"}
                </h3>
              </div>
              {result.eligibility.reasons.map((r, i) => (
                <p key={i} className="text-sm font-bold text-muted-foreground mt-2 flex gap-2"><span className="text-pink-600 dark:text-pink-400 mt-1">▶</span> {r}</p>
              ))}
            </CardContent>
          </Card>

          {/* Providers */}
          {result.providers.length > 0 && (
            <div className="pt-4 border-t-4 border-black">
              <h3 className="text-lg font-black uppercase tracking-widest mb-4">Available Providers</h3>
              <div className="space-y-4">
                {result.providers.slice(0, 8).map((p, i) => (
                  <Card key={i} className="card-impact bg-white dark:bg-zinc-900 rounded-none border-2">
                    <CardContent className="p-4">
                      <p className="font-bold text-base uppercase tracking-widest">{p.name}</p>
                      {p.description && <p className="text-sm font-medium text-muted-foreground mt-1 mb-2">{p.description}</p>}
                      {p.phone_numbers?.[0] && p.phone_numbers[0] !== "[VERIFY]" && (
                        <a href={`tel:${p.phone_numbers[0]}`} className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 flex items-center gap-2 mt-2 w-max bg-blue-50 dark:bg-blue-900/30 px-3 py-1 border-2 border-transparent hover:border-blue-500 transition-colors">
                          <Phone className="h-4 w-4 stroke-[3px]" /> {p.phone_numbers[0]}
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Helplines */}
          <div className="pt-4 border-t-4 border-black">
            <h3 className="text-lg font-black uppercase tracking-widest mb-4 flex items-center gap-2"><Phone className="h-6 w-6 stroke-[3px]" /> NATIONAL HELPLINES</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.helplines.map((h, i) => (
                <a key={i} href={`tel:${h.number}`} className="flex items-center gap-4 p-4 border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none transition-all bg-green-50 dark:bg-green-900/20 group">
                  <div className="p-2 border-2 border-black bg-green-400">
                    <Phone className="h-6 w-6 text-black stroke-[3px] group-hover:animate-bounce" />
                  </div>
                  <div>
                    <p className="font-bold text-base uppercase tracking-widest">{h.name}</p>
                    <p className="text-sm font-black text-green-700 dark:text-green-400">{h.number} • {h.hours}</p>
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
