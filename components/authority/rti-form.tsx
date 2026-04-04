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

export default function RTIForm({
  defaultContext,
  defaultAuthority,
  defaultAddress,
}: Props) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [authority, setAuthority] = useState(defaultAuthority || "");
  const [authorityAddress, setAuthorityAddress] = useState(
    defaultAddress || "",
  );
  const [context, setContext] = useState(defaultContext || "");
  const [loading, setLoading] = useState(false);
  const [rti, setRti] = useState<RTIApplication | null>(null);

  const handleGenerate = async () => {
    if (!name || !context) {
      toast.error("Please fill in your name and dispute context.");
      return;
    }
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
    <div className="space-y-8">
      <Card className="card-impact p-8 rounded-none">
        <CardContent className="p-0">
          <div className="flex items-center gap-3 mb-6 border-b-4 border-black pb-4">
            <div className="p-3 bg-emerald-100 border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <FileText className="h-6 w-6 text-emerald-600 stroke-[3px]" />
            </div>
            <div>
              <h2 className="font-black text-2xl uppercase tracking-widest">
                RTI Generator
              </h2>
              <p className="text-sm font-bold text-muted-foreground mt-1">
                Generate a formal Right to Information application. Cost: ₹10
                only. Response within 30 days guaranteed by law.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-black uppercase tracking-widest">
                Your Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full border-4 border-black p-3 bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all placeholder:font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black uppercase tracking-widest">
                Your Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Full address"
                className="w-full border-4 border-black p-3 bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all placeholder:font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black uppercase tracking-widest">
                Target Authority
              </label>
              <input
                type="text"
                value={authority}
                onChange={(e) => setAuthority(e.target.value)}
                placeholder="e.g. Department of Consumer Affairs"
                className="w-full border-4 border-black p-3 bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all placeholder:font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black uppercase tracking-widest">
                Authority Address
              </label>
              <input
                type="text"
                value={authorityAddress}
                onChange={(e) => setAuthorityAddress(e.target.value)}
                placeholder="Authority address"
                className="w-full border-4 border-black p-3 bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all placeholder:font-medium"
              />
            </div>
          </div>

          <div className="mt-8 space-y-2">
            <label className="text-sm font-black uppercase tracking-widest">
              Dispute Context *
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={4}
              placeholder="Describe what information you need and why..."
              className="w-full border-4 border-black p-3 bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all placeholder:font-medium resize-none"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full mt-8 btn-impact bg-emerald-600 hover:bg-emerald-700 py-6 text-white"
            id="rti-generate"
          >
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
            ) : (
              <FileText className="h-6 w-6 mr-2 stroke-[3px]" />
            )}
            {loading ? "GENERATING..." : "GENERATE RTI APPLICATION"}
          </Button>
        </CardContent>
      </Card>

      {/* RTI Preview */}
      {rti && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 pt-8 border-t-4 border-black"
        >
          <Card className="card-impact rounded-none">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b-4 border-black">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 stroke-[3px]" />
                  <h3 className="font-black text-xl uppercase tracking-widest">
                    RTI Ready
                  </h3>
                </div>
                <Button
                  onClick={copyToClipboard}
                  className="btn-impact bg-white text-black hover:bg-gray-100 dark:bg-zinc-800 dark:text-white border-2 px-6"
                >
                  <Copy className="h-5 w-5 mr-2 stroke-[3px]" /> COPY TEXT
                </Button>
              </div>

              <div className="bg-gray-100 dark:bg-black border-4 border-black font-mono text-sm leading-relaxed p-6 whitespace-pre-wrap max-h-[600px] overflow-y-auto shadow-inner">
                {rti.full_text}
              </div>

              <div className="mt-6 p-4 bg-amber-100 dark:bg-amber-900/30 border-4 border-amber-500 font-bold text-sm tracking-wide shadow-[4px_4px_0px_0px_rgba(245,158,11,1)]">
                <div className="flex items-center justify-between">
                  <span className="uppercase tracking-widest text-amber-900 dark:text-amber-200">
                    Filing Fee: ₹{rti.fee_amount}
                  </span>
                  <span className="text-amber-800 dark:text-amber-300">
                    Methods: {rti.fee_methods.join(", ")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
