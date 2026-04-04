// ============================================
// /watchdog/companies/[slug] — Company Detail
// ============================================

import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TosScoreBadge from "@/components/watchdog/tos-score-badge";
import TrendIndicator from "@/components/watchdog/trend-indicator";
import TosTimeline from "@/components/watchdog/tos-timeline";
import WatchlistToggle from "@/components/watchdog/watchlist-toggle";
import type { MonitoredCompany, TosChange } from "@/types";

const SECTOR_LABELS: Record<string, string> = {
  ride_hailing: "Ride-hailing",
  food_delivery: "Food Delivery",
  ecommerce: "E-commerce",
  payments: "Payments",
  social: "Social",
  streaming: "Streaming",
  travel: "Travel",
  banking: "Banking",
  telecom: "Telecom",
  edtech: "EdTech",
  government: "Government",
  other: "Other",
};

const SECTOR_ICONS: Record<string, string> = {
  ride_hailing: "🚗",
  food_delivery: "🍔",
  ecommerce: "🛒",
  payments: "💳",
  social: "💬",
  streaming: "🎬",
  travel: "✈️",
  banking: "🏦",
  telecom: "📱",
  edtech: "📚",
  government: "🏛️",
  other: "📋",
};

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: company } = await supabase
    .from("monitored_companies")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!company) notFound();

  const typedCompany = company as MonitoredCompany;

  const { data: changes } = await supabase
    .from("tos_changes")
    .select("*")
    .eq("company_id", typedCompany.id)
    .eq("is_published", true)
    .order("detected_at", { ascending: false })
    .limit(50);

  const tosUrls = typedCompany.tos_urls as Array<{
    label: string;
    url: string;
    type: string;
  }>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-none bg-muted flex items-center justify-center text-2xl">
              {SECTOR_ICONS[typedCompany.sector] || "📋"}
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1">{typedCompany.name}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className="border-foreground border-2 text-xs"
                >
                  {SECTOR_LABELS[typedCompany.sector] || typedCompany.sector}
                </Badge>
                <a
                  href={`https://${typedCompany.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:underline"
                >
                  {typedCompany.website}
                </a>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TosScoreBadge score={typedCompany.current_tos_score} size="lg" />
            <WatchlistToggle companyId={typedCompany.id} isWatching={false} />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-background/50 border-foreground border-2">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{typedCompany.total_changes}</p>
              <p className="text-xs text-muted-foreground">Total Changes</p>
            </CardContent>
          </Card>
          <Card className="bg-background/50 border-foreground border-2">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-400">
                {typedCompany.pro_company_changes}
              </p>
              <p className="text-xs text-muted-foreground">Pro-Company</p>
            </CardContent>
          </Card>
          <Card className="bg-background/50 border-foreground border-2">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-400">
                {typedCompany.pro_consumer_changes}
              </p>
              <p className="text-xs text-muted-foreground">Pro-Consumer</p>
            </CardContent>
          </Card>
          <Card className="bg-background/50 border-foreground border-2">
            <CardContent className="p-4 text-center">
              <TrendIndicator trend={typedCompany.score_trend} />
              <p className="text-xs text-muted-foreground mt-1">Trend</p>
            </CardContent>
          </Card>
        </div>

        {/* Monitored URLs */}
        <Card className="bg-background/50 border-foreground border-2 mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">📄 Monitored Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tosUrls.map((tos, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-foreground border-2 last:border-0"
                >
                  <div>
                    <span className="text-sm font-medium">{tos.label}</span>
                    <Badge
                      variant="outline"
                      className="ml-2 text-[10px] border-foreground border-2"
                    >
                      {tos.type}
                    </Badge>
                  </div>
                  <a
                    href={tos.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline truncate max-w-[200px]"
                  >
                    {new URL(tos.url).hostname}
                  </a>
                </div>
              ))}
            </div>
            {typedCompany.last_scraped_at && (
              <p className="text-[10px] text-muted-foreground mt-3">
                Last scraped:{" "}
                {new Date(typedCompany.last_scraped_at).toLocaleString("en-IN")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Change history */}
        <div>
          <h2 className="text-lg font-semibold mb-4">📜 Change History</h2>
          <TosTimeline changes={(changes as TosChange[]) || []} />
        </div>
      </div>
    </div>
  );
}
