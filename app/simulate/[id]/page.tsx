"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { RelatedActions } from "@/components/shared/related-actions";
import { motion } from "framer-motion";
import {
  Gamepad2,
  FileText,
  Loader2,
  XCircle,
  ArrowLeft,
  IndianRupee,
  Clock,
  Lock,
  AlertTriangle,
  TrendingUp,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { getStateName, getDocumentTypeLabel } from "@/lib/utils/constants";
import { toast } from "sonner";
import type { Document, SimulatorData } from "@/types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";

// ── Helpers ──

function formatINR(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatINRFull(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

// ── Client-side calculation engine ──

function calculateCostAtMonth(
  month: number,
  data: SimulatorData,
): {
  totalSpent: number;
  depositRefund: number;
  penalty: number;
  netCost: number;
} {
  let totalSpent = 0;

  // Upfront costs (month 0)
  for (const cost of data.upfront_costs) {
    totalSpent += cost.amount;
  }

  // Monthly costs up to exit month
  for (let m = 1; m <= month; m++) {
    for (const mc of data.monthly_costs) {
      let amount = mc.amount;
      if (mc.escalation_percent > 0 && mc.escalation_frequency_months > 0) {
        const escalations = Math.floor(m / mc.escalation_frequency_months);
        amount =
          mc.amount * Math.pow(1 + mc.escalation_percent / 100, escalations);
      }
      totalSpent += amount;
    }
  }

  // Exit costs
  for (const ec of data.exit_costs) {
    totalSpent += ec.amount;
  }

  // Penalty
  let penalty = 0;
  if (month < data.lock_in.months && data.penalties.early_exit_during_lockin) {
    penalty = data.penalties.early_exit_during_lockin.amount;
  } else if (
    month < data.contract_duration_months &&
    data.penalties.early_exit_after_lockin
  ) {
    penalty = data.penalties.early_exit_after_lockin.amount;
  }
  totalSpent += penalty;

  // Deposit refund
  let depositRefund = 0;
  if (
    month >= data.contract_duration_months &&
    data.deposit_refund.refundable_if_full_term
  ) {
    depositRefund =
      data.deposit_refund.total_deposit - data.deposit_refund.deductions;
  } else if (
    month < data.contract_duration_months &&
    data.deposit_refund.refundable_if_early_exit
  ) {
    depositRefund =
      data.deposit_refund.total_deposit - data.deposit_refund.deductions;
  }
  depositRefund = Math.max(0, depositRefund);

  const netCost = totalSpent - depositRefund;

  return { totalSpent, depositRefund, penalty, netCost };
}

function calculateFairCostAtMonth(month: number, data: SimulatorData): number {
  let total = 0;
  for (const cost of data.upfront_costs) {
    total += cost.fair_amount;
  }
  for (let m = 1; m <= month; m++) {
    for (const mc of data.monthly_costs) {
      total += mc.fair_amount;
    }
  }
  for (const ec of data.exit_costs) {
    total += ec.fair_amount;
  }
  // Fair contract returns deposit
  const fairDeposit = data.upfront_costs.find((c) =>
    c.label.toLowerCase().includes("deposit"),
  );
  if (fairDeposit && month >= data.contract_duration_months) {
    total -= fairDeposit.fair_amount;
  }
  return total;
}

// ── Chart Tooltip ──

function ChartTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border-2 border-foreground card-impact border border-foreground border-2 rounded-none p-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <p className="text-xs text-foreground mb-1">Month {label}</p>
      {payload.map((p, i) => (
        <p
          key={i}
          className={`text-sm font-bold ${p.dataKey === "contract" ? "text-red-400" : "text-green-400"}`}
        >
          {p.dataKey === "contract" ? "This Contract" : "Fair Contract"}:{" "}
          {formatINR(p.value)}
        </p>
      ))}
    </div>
  );
}

// ── Main Page ──

export default function SimulatorPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [data, setData] = useState<SimulatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sliderMonth, setSliderMonth] = useState(6);
  const [copied, setCopied] = useState(false);
  const [showAllMonths, setShowAllMonths] = useState(false);

  const supabase = createClient();

  const fetchSimulation = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: doc, error: docError } = await supabase
        .from("documents")
        .select("*")
        .eq("id", documentId)
        .single();

      if (docError || !doc) {
        setError("Document not found");
        setLoading(false);
        return;
      }
      setDocument(doc as Document);

      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Failed");
      setData(json as SimulatorData);
      setSliderMonth(
        Math.min(
          Math.floor((json.contract_duration_months || 11) / 2),
          json.contract_duration_months || 11,
        ),
      );
    } catch (err) {
      console.error("[ClauseWall] Simulator failed:", err);
      setError("Failed to generate simulation.");
    } finally {
      setLoading(false);
    }
  }, [documentId, supabase]);

  useEffect(() => {
    fetchSimulation();
  }, [fetchSimulation]);

  // Chart data
  const chartData = useMemo(() => {
    if (!data) return [];
    const points = [];
    for (let m = 0; m <= data.contract_duration_months; m++) {
      const c = calculateCostAtMonth(m, data);
      const f = calculateFairCostAtMonth(m, data);
      points.push({ month: m, contract: c.netCost, fair: f });
    }
    return points;
  }, [data]);

  // Slider calculation
  const sliderResult = useMemo(() => {
    if (!data) return null;
    return calculateCostAtMonth(sliderMonth, data);
  }, [data, sliderMonth]);

  // Copy
  const handleCopy = useCallback(() => {
    if (!data || !document) return;
    const lines = [
      "🎮 CONTRACT SIMULATOR — ClauseWall",
      "",
      `Contract: ${document.original_filename || "Contract"}`,
      `Duration: ${data.contract_duration_months} months`,
      "",
      `This Contract Total: ${formatINRFull(data.worst_case_total)}`,
      `Fair Contract Total: ${formatINRFull(data.fair_contract_total)}`,
      `Overpaying: ${formatINRFull(data.overpayment_vs_fair)}`,
      "",
      data.summary,
      "",
      "Simulated by ClauseWall — AI Contract Intelligence for India",
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    toast.success("Simulation copied!");
    setTimeout(() => setCopied(false), 2000);
  }, [data, document]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        <div className="relative">
          <Loader2 className="h-16 w-16 text-cyan-500 animate-spin" />
          <div className="absolute inset-0 h-16 w-16 bg-cyan-500/20 blur-xl rounded-full animate-pulse" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Building Your Simulation</h2>
          <p className="text-foreground max-w-md">
            Extracting financial data, calculating monthly costs, projecting
            scenarios...
          </p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <XCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-400 text-center">
          {error || "Something went wrong"}
        </p>
        <div className="flex gap-3">
          <Button onClick={fetchSimulation} variant="outline">
            Try Again
          </Button>
          <Link href={`/results/${documentId}`}>
            <Button variant="outline">Back to Results</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const totalUpfront = data.upfront_costs.reduce((s, c) => s + c.amount, 0);
  const totalMonthly = data.monthly_costs.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="relative px-4 sm:px-6 lg:px-8 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl">
        {/* Back */}
        <button
          onClick={() => router.push(`/results/${documentId}`)}
          className="flex items-center gap-2 text-sm text-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Results
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-foreground text-sm mb-2">
            <FileText className="h-4 w-4" />
            <span>{document.original_filename || "Contract"}</span>
            <span>•</span>
            <span>{getDocumentTypeLabel(document.document_type)}</span>
            <span>•</span>
            <span>{getStateName(document.jurisdiction)}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-none bg-cyan-500/10 border border-cyan-500/20">
              <Gamepad2 className="h-7 w-7 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                Contract Simulator
              </h1>
              <p className="text-sm text-foreground mt-0.5">
                See exactly what this contract costs you
              </p>
            </div>
          </div>
        </div>

        {/* ── Cost Overview ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="bg-red-500/5 border-red-500/20">
            <CardContent className="p-5 text-center">
              <p className="text-xs text-foreground mb-1">
                This Contract
              </p>
              <p className="text-2xl font-bold text-red-400">
                {formatINR(data.worst_case_total)}
              </p>
              <p className="text-[10px] text-foreground mt-1">
                worst case total cost
              </p>
            </CardContent>
          </Card>
          <Card className="bg-green-500/5 border-green-500/20">
            <CardContent className="p-5 text-center">
              <p className="text-xs text-foreground mb-1">
                Fair Contract
              </p>
              <p className="text-2xl font-bold text-green-400">
                {formatINR(data.fair_contract_total)}
              </p>
              <p className="text-[10px] text-foreground mt-1">
                what it should cost
              </p>
            </CardContent>
          </Card>
          <Card className="bg-orange-500/5 border-orange-500/20">
            <CardContent className="p-5 text-center">
              <p className="text-xs text-foreground mb-1">
                You&apos;re Overpaying
              </p>
              <p className="text-2xl font-bold text-orange-400">
                {formatINR(data.overpayment_vs_fair)}
              </p>
              <p className="text-[10px] text-foreground mt-1">
                money you could save
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── Interactive Slider ── */}
        <Card className="bg-background border-2 border-foreground card-impact/50 border-foreground border-2 mb-8">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
              <Clock className="h-5 w-5 text-cyan-400" />
              What If I Leave At Month...
            </h2>
            <p className="text-xs text-foreground mb-5">
              Drag the slider to see your cost at any point
            </p>

            {/* Slider */}
            <div className="relative mb-6">
              {/* Danger zone backgrounds */}
              <div className="absolute top-0 left-0 right-0 h-2 rounded-full bg-background border-2 border-foreground card-impact overflow-hidden">
                {data.danger_zones.map((z, i) => {
                  const left =
                    (z.month_start / data.contract_duration_months) * 100;
                  const width =
                    ((z.month_end - z.month_start + 1) /
                      data.contract_duration_months) *
                    100;
                  return (
                    <div
                      key={i}
                      className={`absolute top-0 h-full ${z.severity === "critical" ? "bg-red-500/30" : "bg-yellow-500/20"}`}
                      style={{ left: `${left}%`, width: `${width}%` }}
                    />
                  );
                })}
              </div>

              <input
                type="range"
                min={1}
                max={data.contract_duration_months}
                value={sliderMonth}
                onChange={(e) => setSliderMonth(parseInt(e.target.value))}
                className="w-full h-2 appearance-none cursor-pointer rounded-full bg-transparent relative z-10
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 
                  [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white 
                  [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-grab
                  [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-cyan-400 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white"
              />

              {/* Labels */}
              <div className="flex justify-between mt-2 text-xs text-foreground">
                <span>Month 1</span>
                <span className="text-cyan-400 font-bold">
                  Month {sliderMonth}
                </span>
                <span>Month {data.contract_duration_months}</span>
              </div>
            </div>

            {/* Slider Result */}
            {sliderResult && (
              <motion.div
                key={sliderMonth}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-3"
              >
                <div className="p-3 rounded-none bg-muted">
                  <p className="text-xs text-foreground mb-0.5">
                    Total Spent
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {formatINR(sliderResult.totalSpent)}
                  </p>
                </div>
                <div className="p-3 rounded-none bg-muted">
                  <p className="text-xs text-foreground mb-0.5">
                    Penalty
                  </p>
                  <p
                    className={`text-lg font-bold ${sliderResult.penalty > 0 ? "text-red-400" : "text-green-400"}`}
                  >
                    {sliderResult.penalty > 0
                      ? formatINR(sliderResult.penalty)
                      : "None"}
                  </p>
                </div>
                <div className="p-3 rounded-none bg-muted">
                  <p className="text-xs text-foreground mb-0.5">
                    Deposit Back
                  </p>
                  <p
                    className={`text-lg font-bold ${sliderResult.depositRefund > 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    {sliderResult.depositRefund > 0
                      ? formatINR(sliderResult.depositRefund)
                      : "₹0"}
                  </p>
                </div>
                <div className="p-3 rounded-none bg-cyan-500/10 border border-cyan-500/20">
                  <p className="text-xs text-cyan-400 mb-0.5">Net Cost</p>
                  <p className="text-lg font-bold text-cyan-300">
                    {formatINR(sliderResult.netCost)}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Lock-in warning */}
            {sliderMonth < data.lock_in.months && (
              <div className="mt-3 flex items-center gap-2 p-3 rounded-none bg-red-500/5 border border-red-500/20">
                <Lock className="h-4 w-4 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">
                  ⚠️ Month {sliderMonth} is within the{" "}
                  <strong>{data.lock_in.months}-month lock-in</strong>. Leaving
                  now triggers{" "}
                  {data.penalties.early_exit_during_lockin
                    ? formatINR(
                        data.penalties.early_exit_during_lockin.amount,
                      ) + " penalty"
                    : "penalties"}
                  .
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Cost Chart ── */}
        <Card className="bg-background border-2 border-foreground card-impact/50 border-foreground border-2 mb-8">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
              Cost Over Time
            </h2>
            <div className="h-64 sm:h-80 min-h-[16rem]">
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                minHeight={0}
              >
                <AreaChart
                  data={chartData}
                  margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="contractGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fairGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    stroke="#374151"
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    tickFormatter={(v) => `M${v}`}
                  />
                  <YAxis
                    stroke="#374151"
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    tickFormatter={(v) => formatINR(v)}
                    width={65}
                  />
                  <Tooltip content={<ChartTooltipContent />} />

                  {/* Danger zone highlights */}
                  {data.danger_zones.map((z, i) => (
                    <ReferenceArea
                      key={i}
                      x1={z.month_start}
                      x2={z.month_end}
                      fill={z.severity === "critical" ? "#ef4444" : "#eab308"}
                      fillOpacity={0.06}
                    />
                  ))}

                  {/* Slider position */}
                  <ReferenceLine
                    x={sliderMonth}
                    stroke="#06b6d4"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                  />

                  <Area
                    type="monotone"
                    dataKey="fair"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fill="url(#fairGrad)"
                    name="Fair Contract"
                  />
                  <Area
                    type="monotone"
                    dataKey="contract"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fill="url(#contractGrad)"
                    name="This Contract"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-3 justify-center">
              <span className="flex items-center gap-1.5 text-xs text-foreground">
                <span className="w-3 h-0.5 bg-red-500 rounded" /> This Contract
              </span>
              <span className="flex items-center gap-1.5 text-xs text-foreground">
                <span className="w-3 h-0.5 bg-green-500 rounded" /> Fair
                Contract
              </span>
              <span className="flex items-center gap-1.5 text-xs text-foreground">
                <span className="w-3 h-0.5 bg-cyan-500 rounded border-dashed" />{" "}
                Your Exit
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ── Upfront Costs ── */}
        <Card className="bg-background border-2 border-foreground card-impact/50 border-foreground border-2 mb-8">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-red-400" />
              Day 1 — What You Pay Upfront
            </h2>
            <div className="space-y-2">
              {data.upfront_costs.map((cost, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-none bg-white/[0.03]"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {cost.label}
                      </p>
                      {cost.issue && (
                        <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px]">
                          Issue
                        </Badge>
                      )}
                    </div>
                    {cost.issue && (
                      <p className="text-xs text-red-400/70 mt-0.5">
                        {cost.issue}
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-bold text-foreground">
                      {formatINR(cost.amount)}
                    </p>
                    {cost.fair_amount !== cost.amount && (
                      <p className="text-xs text-green-400">
                        Fair: {formatINR(cost.fair_amount)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between p-3 rounded-none bg-red-500/5 border border-red-500/15">
                <p className="text-sm font-bold text-foreground">
                  Total Upfront
                </p>
                <p className="text-lg font-bold text-red-400">
                  {formatINR(totalUpfront)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Monthly Costs ── */}
        <Card className="bg-background border-2 border-foreground card-impact/50 border-foreground border-2 mb-8">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-400" />
              Monthly Recurring Costs
            </h2>
            <div className="space-y-2">
              {data.monthly_costs.map((cost, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-none bg-white/[0.03]"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {cost.label}
                    </p>
                    {cost.escalation_percent > 0 && (
                      <p className="text-xs text-yellow-400/70 mt-0.5">
                        {cost.escalation_percent}% escalation every{" "}
                        {cost.escalation_frequency_months} months
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-bold text-foreground">
                      {formatINR(cost.amount)}/mo
                    </p>
                    {cost.fair_amount !== cost.amount && (
                      <p className="text-xs text-green-400">
                        Fair: {formatINR(cost.fair_amount)}/mo
                      </p>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between p-3 rounded-none bg-yellow-500/5 border border-yellow-500/15">
                <p className="text-sm font-bold text-foreground">
                  Total Monthly
                </p>
                <p className="text-lg font-bold text-yellow-400">
                  {formatINR(totalMonthly)}/mo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Danger Zones ── */}
        {data.danger_zones.length > 0 && (
          <Card className="bg-background border-2 border-foreground card-impact/50 border-red-500/20 mb-8">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                Danger Zones
              </h2>
              <div className="space-y-2">
                {data.danger_zones.map((zone, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-none border ${zone.severity === "critical" ? "bg-red-500/5 border-red-500/20" : "bg-yellow-500/5 border-yellow-500/20"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        className={`text-[10px] ${zone.severity === "critical" ? "bg-red-500/15 text-red-400 border-red-500/30" : "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"}`}
                      >
                        Month {zone.month_start}–{zone.month_end}
                      </Badge>
                      <span
                        className={`text-sm font-medium ${zone.severity === "critical" ? "text-red-300" : "text-yellow-300"}`}
                      >
                        {zone.label}
                      </span>
                    </div>
                    <p className="text-xs text-foreground">
                      {zone.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Scenario Comparison ── */}
        {data.scenarios.length > 0 && (
          <Card className="bg-background border-2 border-foreground card-impact/50 border-foreground border-2 mb-8">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-purple-400" />
                Scenario Comparison
              </h2>
              <div className="space-y-2">
                {data.scenarios.map((s, i) => {
                  const isFair = s.label.toLowerCase().includes("fair");
                  const isWorst =
                    s.net_cost ===
                    Math.max(...data.scenarios.map((sc) => sc.net_cost));
                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-between p-3 rounded-none ${isFair ? "bg-green-500/5 border border-green-500/20" : isWorst ? "bg-red-500/5 border border-red-500/20" : "bg-white/[0.03]"}`}
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {s.label}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-foreground">
                          {s.penalty > 0 && (
                            <span className="text-red-400">
                              Penalty: {formatINR(s.penalty)}
                            </span>
                          )}
                          {s.deposit_returned > 0 && (
                            <span className="text-green-400">
                              Deposit back: {formatINR(s.deposit_returned)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-lg font-bold ${isFair ? "text-green-400" : isWorst ? "text-red-400" : "text-foreground"}`}
                        >
                          {formatINR(s.net_cost)}
                        </p>
                        {isFair && (
                          <p className="text-[10px] text-green-400">
                            SHOULD BE ✓
                          </p>
                        )}
                        {isWorst && (
                          <p className="text-[10px] text-red-400">WORST CASE</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Summary ── */}
        <Card className="bg-background border-2 border-foreground card-impact/50 border-foreground border-2 mb-8">
          <CardContent className="p-6">
            <p className="text-sm text-foreground leading-relaxed">
              {data.summary}
            </p>
          </CardContent>
        </Card>

        {/* ── Actions ── */}
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="gap-2" onClick={handleCopy}>
            {copied ? (
              <Check className="h-4 w-4 text-green-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copied!" : "Copy Breakdown"}
          </Button>
        </div>

        {/* Related Actions */}
        <RelatedActions documentId={documentId} currentPage="simulate" />
      </div>
    </div>
  );
}
