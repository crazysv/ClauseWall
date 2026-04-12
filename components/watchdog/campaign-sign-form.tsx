"use client";

import { useState } from "react";
import { Loader2, CheckCircle, TerminalSquare } from "lucide-react";
import { toast } from "sonner";

export default function CampaignSignForm({
  campaignId,
  onSigned,
}: {
  campaignId: string;
  onSigned?: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [signed, setSigned] = useState(false);

  const handleSign = async () => {
    if (!name.trim()) {
      toast.error("MISSING PARAMETER: DISPLAY_NAME REQUIRED");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/watchdog/campaigns/${campaignId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: name, email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "TRANSMISSION FAILED");
      }

      setSigned(true);
      toast.success("SIGNATURE VERIFIED / ALLIED NODE ADDED");
      onSigned?.();
    } catch (error) {
      toast.error((error as Error).message || "SYSTEM REJECTED CAMPAIGN SIGNATURE");
    } finally {
      setLoading(false);
    }
  };

  if (signed) {
    return (
      <div className="bg-emerald-950/10 border border-emerald-900/40 p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
        <CheckCircle className="h-6 w-6 text-emerald-500 mx-auto mb-4" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-400 mb-2">
          [ DEPLOYMENT VERIFIED ]
        </p>
        <p className="font-mono text-[11px] text-neutral-400 leading-relaxed max-w-[250px] mx-auto">
          YOUR NODE HAS BEEN ADDED TO THE COLLECTIVE OBJECTION MANIFEST.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] border border-neutral-900 relative">
      <div className="border-b border-neutral-900 bg-[#050505] p-3 flex items-center justify-between">
        <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
           <TerminalSquare className="h-3 w-3" />
           [ COMMAND: AUTHORIZE SIGNATURE ]
        </h3>
        <span className="h-1.5 w-1.5 bg-amber-500 animate-pulse" />
      </div>
      
      <div className="p-6 md:p-8 space-y-5">
        <div>
          <label className="block text-[9px] font-mono uppercase tracking-widest text-neutral-500 mb-2">
            PUBLIC IDENTIFIER (REQUIRED)
          </label>
          <input
            placeholder="ENTER DISPLAY_NAME"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#050505] border border-neutral-800 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 text-neutral-300 font-mono text-[11px] px-3 py-2.5 outline-none transition-all placeholder:text-neutral-700"
          />
        </div>
        
        <div>
          <label className="block text-[9px] font-mono uppercase tracking-widest text-neutral-500 mb-2">
            SYS.CONTACT_PATH (OPTIONAL)
          </label>
          <input
            placeholder="ENTER EMAIL_ADDRESS"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#050505] border border-neutral-800 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 text-neutral-300 font-mono text-[11px] px-3 py-2.5 outline-none transition-all placeholder:text-neutral-700"
          />
        </div>

        <button
          onClick={handleSign}
          disabled={loading || !name.trim()}
          className="w-full relative mt-4 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-amber-500/10 border border-amber-500/50 group-hover:bg-amber-500/20 transition-colors" />
          <div className="relative py-3 flex items-center justify-center gap-2">
             {loading ? (
               <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
             ) : (
               <span className="font-mono text-[10px] uppercase tracking-widest text-amber-500 group-hover:text-amber-400 transition-colors">
                 [ EXECUTE APPEND ]
               </span>
             )}
          </div>
        </button>
        
        <p className="text-[9px] font-mono text-neutral-600 text-center uppercase tracking-widest pt-2">
          WARNING: PUBLIC IDENTIFIER WILL BE EXPOSED IN OPEN LOG.
        </p>
      </div>
    </div>
  );
}
