"use client";

import { CheckCircle2, XCircle, Phone, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { LegalAidResult } from "@/types/authority";

interface Props {
  result: LegalAidResult;
}

export default function LegalAidResultView({ result }: Props) {
  return (
    <div className="space-y-4">
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
              {result.eligibility.is_eligible ? "Eligible for Free Legal Aid" : "Eligibility Not Confirmed"}
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
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
            <Heart className="h-4 w-4 text-pink-400" /> Providers Near You
          </h4>
          <div className="space-y-2">
            {result.providers.slice(0, 6).map((p, i) => (
              <Card key={i} className="border-white/10 bg-white/[0.02]">
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                  </div>
                  {p.phone_numbers?.[0] && p.phone_numbers[0] !== "[VERIFY]" && (
                    <a href={`tel:${p.phone_numbers[0]}`} className="p-2 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25">
                      <Phone className="h-4 w-4" />
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
        <h4 className="text-sm font-semibold mb-2">📞 Helplines</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {result.helplines.slice(0, 4).map((h, i) => (
            <a key={i} href={`tel:${h.number}`} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/10 hover:border-green-500/30 transition">
              <Phone className="h-3.5 w-3.5 text-green-400" />
              <div>
                <p className="text-xs font-medium">{h.name}</p>
                <p className="text-[10px] text-green-400">{h.number}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
