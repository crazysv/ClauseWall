// ============================================
// /watchdog — Main Dashboard
// ============================================

import { createAdminClient } from "@/lib/supabase/admin";
import { Rss, Building2, AlertTriangle, Trophy, Shield } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import ChangeFeed from "@/components/watchdog/change-feed";
import AlertPanel from "@/components/watchdog/alert-panel";

export const metadata = {
  title: "Contract Watchdog — ClauseWall",
  description: "Automated ToS & Privacy Policy change monitoring for Indian companies",
};

export default async function WatchdogPage() {
  const supabase = createAdminClient();

  // Get stats
  const [companiesRes, changesRes] = await Promise.all([
    supabase.from("monitored_companies").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("tos_changes").select("id", { count: "exact", head: true }),
  ]);

  const companyCount = companiesRes.count || 0;
  const changeCount = changesRes.count || 0;

  // Get critical changes count
  const { count: criticalCount } = await supabase
    .from("tos_changes")
    .select("id", { count: "exact", head: true })
    .gt("critical_count", 0);

  // Get campaign count
  const { count: campaignCount } = await supabase
    .from("optout_campaigns")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  const stats = [
    { label: "Monitored Companies", value: companyCount, icon: Building2, color: "text-blue-400", href: "/watchdog/companies" },
    { label: "Changes Detected", value: changeCount, icon: Rss, color: "text-purple-400", href: "#feed" },
    { label: "Critical Changes", value: criticalCount || 0, icon: AlertTriangle, color: "text-red-400", href: "#feed" },
    { label: "Active Campaigns", value: campaignCount || 0, icon: Shield, color: "text-amber-400", href: "/watchdog/campaigns" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Shield className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Contract Watchdog</h1>
              <p className="text-sm text-muted-foreground">
                Automated ToS & Privacy Policy change monitoring
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.label} href={stat.href}>
                <Card className="bg-gray-900/50 border-gray-800 hover:border-white/10 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`${stat.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick nav */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Link href="/watchdog/companies" className="text-sm bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-2 hover:border-white/10 transition-colors flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Browse Companies
          </Link>
          <Link href="/watchdog/leaderboard" className="text-sm bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-2 hover:border-white/10 transition-colors flex items-center gap-2">
            <Trophy className="h-4 w-4" /> ToS Leaderboard
          </Link>
          <Link href="/watchdog/campaigns" className="text-sm bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-2 hover:border-white/10 transition-colors flex items-center gap-2">
            <Shield className="h-4 w-4" /> Campaigns
          </Link>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2" id="feed">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Rss className="h-5 w-5 text-purple-400" />
              Recent Changes
            </h2>
            <ChangeFeed limit={15} />
          </div>
          <div>
            <AlertPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
