"use client";

import { useState } from "react";
import { Copy, Mail, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import type { ComplaintDraft } from "@/types/authority";

interface Props {
  draft: ComplaintDraft;
  authorityEmail?: string | null;
}

export default function ComplaintEmailPreview({
  draft,
  authorityEmail,
}: Props) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(draft.body);
    setCopied(true);
    toast.success("Complaint copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const openEmail = () => {
    if (!authorityEmail) {
      toast.error("No email available for this authority");
      return;
    }
    const params = new URLSearchParams({
      subject: draft.subject,
      body: draft.body.substring(0, 1500),
    });
    window.open(`mailto:${authorityEmail}?${params.toString()}`, "_self");
  };

  return (
    <Card className="border-blue-500/20 bg-blue-500/5">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            <div>
              <h3 className="font-semibold text-sm">Complaint Draft</h3>
              <p className="text-xs text-muted-foreground">
                To: {draft.authority_name}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="gap-1"
            >
              {copied ? (
                <CheckCircle2 className="h-3 w-3 text-green-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
            {authorityEmail && (
              <Button
                size="sm"
                onClick={openEmail}
                className="gap-1 bg-blue-600 hover:bg-blue-700"
              >
                <Mail className="h-3 w-3" /> Send Email
              </Button>
            )}
          </div>
        </div>

        <div className="mb-3 p-2 rounded-lg bg-white/[0.03] border border-white/5">
          <p className="text-xs text-muted-foreground">Subject:</p>
          <p className="text-sm font-medium">{draft.subject}</p>
        </div>

        <div className="bg-gray-900/80 rounded-lg p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto border border-white/5">
          {draft.body}
        </div>

        {draft.attachments_needed.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              📎 Attach these documents:
            </p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {draft.attachments_needed.map((a, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-blue-400">•</span> {a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
