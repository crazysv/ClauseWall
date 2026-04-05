// ============================================
// /watchdog/companies — Company Browser
// ============================================

import { createClient } from "@/lib/supabase/server";
import CompanyGrid from "@/components/watchdog/company-grid";
import type { MonitoredCompany } from "@/types";

export const metadata = {
  title: "Monitored Companies — Contract Watchdog — ClauseWall",
  description: "Browse companies being monitored for Terms of Service changes",
};

export default async function CompaniesPage() {
  const supabase = await createClient();

  const { data: companies } = await supabase
    .from("monitored_companies")
    .select("*")
    .eq("is_active", true)
    .order("name");

  // Try to get user watchlist for watched state
  let watchedIds: string[] = [];
  try {
    const userSupabase = await createClient();
    const {
      data: { user },
    } = await userSupabase.auth.getUser();
    if (user) {
      const { data: watchlist } = await userSupabase
        .from("user_watchlist")
        .select("company_id")
        .eq("user_id", user.id);
      watchedIds = (watchlist || []).map(
        (w: { company_id: string }) => w.company_id,
      );
    }
  } catch {
    // Not logged in — fine
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Monitored Companies</h1>
          <p className="text-muted-foreground">
            {((companies as MonitoredCompany[]) || []).length} companies
            monitored across India
          </p>
        </div>
        <CompanyGrid
          companies={(companies as MonitoredCompany[]) || []}
          watchedIds={watchedIds}
        />
      </div>
    </div>
  );
}
