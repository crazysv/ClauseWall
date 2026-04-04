"use client";

import { useState } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <Card className="bg-green-500/5 border-green-500/20">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-3" />
          <p className="font-semibold text-green-400">Thank you for signing!</p>
          <p className="text-sm text-muted-foreground mt-1">
            Your name has been added to the collective objection.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-background border-2 border-foreground card-impact/50 border-foreground border-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">✍️ Sign this Campaign</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Your display name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-background border-2 border-foreground card-impact/50 border-foreground border-2"
        />
        <Input
          placeholder="Email (optional — for updates)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-background border-2 border-foreground card-impact/50 border-foreground border-2"
        />
        <Button
          onClick={handleSign}
          disabled={loading || !name.trim()}
          className="w-full bg-amber-600 hover:bg-amber-700 gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Sign Campaign"
          )}
        </Button>
        <p className="text-[10px] text-muted-foreground text-center">
          By signing, your display name will be visible on the campaign page.
        </p>
      </CardContent>
    </Card>
  );
}
