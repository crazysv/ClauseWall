"use client";

import { Copy, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import type { RTIApplication } from "@/types/authority";

interface Props {
  rti: RTIApplication;
}

export default function RTIPreview({ rti }: Props) {
  const copyText = () => {
    navigator.clipboard.writeText(rti.full_text);
    toast.success("RTI application copied to clipboard!");
  };

  return (
    <Card className="border-emerald-500/20 bg-emerald-500/5">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-400" />
            <div>
              <h3 className="font-semibold text-sm">RTI Application</h3>
              <p className="text-xs text-foreground">
                To: {rti.recipient_authority}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={copyText}
            className="gap-1"
          >
            <Copy className="h-3 w-3" /> Copy
          </Button>
        </div>

        <div className="bg-background border-2 border-foreground card-impact/80 rounded-none p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto border border-foreground border-2">
          {rti.full_text}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-foreground">
          <span>📝 Questions: {rti.questions.length}</span>
          <span>💰 Fee: ₹{rti.fee_amount}</span>
          <span>📅 Date: {new Date(rti.date).toLocaleDateString("en-IN")}</span>
        </div>
      </CardContent>
    </Card>
  );
}
