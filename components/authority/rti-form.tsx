"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Loader2, Copy, Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import type { RTIApplication } from "@/types/authority";

interface Props {
  defaultContext?: string;
  defaultAuthority?: string;
  defaultAddress?: string;
}

export function RTIForm({ defaultContext, defaultAuthority, defaultAddress }: Props) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [authority, setAuthority] = useState(defaultAuthority || "");
  const [authorityAddress, setAuthorityAddress] = useState(defaultAddress || "");
  const [context, setContext] = useState(defaultContext || "");
  const [loading, setLoading] = useState(false);
  const [rti, setRti] = useState<RTIApplication | null>(null);

  const handleGenerate = async () => {
    if (!name || !context) { toast.error("Please fill in your name and dispute context."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/authority/rti/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicant_name: name,
          applicant_address: address,
          target_authority: authority || "Public Information Officer",
          target_address: authorityAddress,
          dispute_context: context,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRti(data.rti);
        toast.success("RTI application generated!");
      }
    } catch (err) {
      toast.error("Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (rti?.full_text) {
      navigator.clipboard.writeText(rti.full_text);
      toast.success("RTI application copied!");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white dark:bg-slate-900/[0.02]">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-emerald-400" />
            <h2 className="font-semibold">RTI Application Generator</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Generate a formal Right to Information application. Cost: ₹10 only. Response within 30 days guaranteed by law.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Your Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Your Address</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address" className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Target Authority</label>
              <input type="text" value={authority} onChange={(e) => setAuthority(e.target.value)} placeholder="e.g. Department of Consumer Affairs" className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Authority Address</label>
              <input type="text" value={authorityAddress} onChange={(e) => setAuthorityAddress(e.target.value)} placeholder="Authority address" className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>

          <div className="mt-4">
            <label className="text-xs text-muted-foreground mb-1 block">Dispute Context *</label>
            <textarea value={context} onChange={(e) => setContext(e.target.value)} rows={4} placeholder="Describe what information you need and why..." className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none resize-none" />
          </div>

          <Button onClick={handleGenerate} disabled={loading} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 gap-2" id="rti-generate">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            {loading ? "Generating RTI..." : "Generate RTI Application"}
          </Button>
        </CardContent>
      </Card>

      {/* RTI Preview */}
      {rti && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <h3 className="font-semibold">RTI Application Ready</h3>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-1">
                    <Copy className="h-3 w-3" /> Copy
                  </Button>
                </div>
              </div>

              <div className="bg-slate-900/80 rounded-xl p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto border border-white/5">
                {rti.full_text}
              </div>

              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span>Fee: ₹{rti.fee_amount}</span>
                <span>Methods: {rti.fee_methods.join(", ")}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
