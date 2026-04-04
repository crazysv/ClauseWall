"use client";

import { Wallet, CreditCard, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { FeeCalculationResult } from "@/types/authority";

interface Props {
  result: FeeCalculationResult;
  claimAmount?: number;
}

export default function FeeBreakdown({ result, claimAmount }: Props) {
  return (
    <Card className="border-foreground border-2 bg-white/[0.02]">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold">Filing Fee</h3>
        </div>

        {/* Fee Breakdown */}
        <div className="space-y-2 mb-3">
          {result.breakdown.map((item, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span className="text-muted-foreground">{item.item}</span>
              <span
                className={
                  item.amount === 0
                    ? "text-green-400 font-medium"
                    : "font-medium"
                }
              >
                {item.amount === 0
                  ? "FREE"
                  : `₹${item.amount.toLocaleString("en-IN")}`}
              </span>
            </div>
          ))}
          <div className="border-t border-foreground border-2 pt-2 flex justify-between text-sm font-semibold">
            <span>Total</span>
            <span
              className={result.fee === 0 ? "text-green-400" : "text-amber-400"}
            >
              {result.fee === 0
                ? "FREE"
                : `₹${result.fee.toLocaleString("en-IN")}`}
            </span>
          </div>
        </div>

        {/* Payment Methods */}
        {result.payment_methods.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <CreditCard className="h-3 w-3" /> Payment methods:
            </div>
            <div className="flex flex-wrap gap-1">
              {result.payment_methods.map((m, i) => (
                <span
                  key={i}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Fee Waiver */}
        {result.waiver_available && (
          <div className="flex items-start gap-2 p-2 rounded-none bg-green-500/5 border border-green-500/10">
            <AlertCircle className="h-3.5 w-3.5 text-green-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-green-300/70">
              {result.waiver_conditions}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
