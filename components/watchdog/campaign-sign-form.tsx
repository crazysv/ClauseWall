"use client";

import { useState } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function CampaignSignForm({
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
      toast.error("Please enter your display name");
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
        throw new Error(data.error || "Failed to sign");
      }

      setSigned(true);
      toast.success("You've signed the campaign!");
      onSigned?.();
    } catch (error) {
      toast.error((error as Error).message || "Failed to sign campaign");
    } finally {
      setLoading(false);
    }
  };

  if (signed) {
    return (
      <Card className="bg-emerald-50 border-emerald-200 rounded-xl shadow-sm dark:shadow-slate-900/20">
        <CardContent className="p-4 md:p-6 lg:p-8 text-center">
          <CheckCircle className="h-10 w-10 text-emerald-600 mx-auto mb-4" />
          <p className="font-black text-emerald-900 text-lg">Thank you for signing!</p>
          <p className="text-sm font-medium text-emerald-700/80 mt-2">
            Your name has been added to the collective objection.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 rounded-xl">
      <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50 dark:bg-slate-800/50">
        <CardTitle className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span className="text-xl">✍️</span> Sign this Campaign
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        <Input
          aria-label="Your display name"
          placeholder="Your display name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-amber-500 font-medium h-11"
        />
        <Input
          aria-label="Email address for campaign updates"
          placeholder="Email (optional — for updates)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-amber-500 font-medium h-11"
        />
        <Button
          onClick={handleSign}
          disabled={loading || !name.trim()}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-11 shadow-sm dark:shadow-slate-900/20 gap-2 rounded-xl transition-colors"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            "Sign Campaign"
          )}
        </Button>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center leading-relaxed px-4">
          By signing, your display name will be visible on the public campaign page.
        </p>
      </CardContent>
    </Card>
  );
}
