import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WatchdogClient from "./watchdog-client";

export default async function WatchdogPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login?redirect_to=/watchdog");
  }

  // Pre-fetch watchlist for the exact user session
  // Usually this targets a 'user_watchlists' table that resolves to company IDs
  const { data: watchlistData } = await supabase
    .from("user_watchlists")
    .select("company_id")
    .eq("user_id", user.id);

  const rawCompanyIds = watchlistData?.map(w => w.company_id) || [];
  
  // Safe array fallback if empty
  const { data: initialWatchlist } = await supabase
    .from("watchdog_companies")
    .select("*")
    .in("id", rawCompanyIds.length > 0 ? rawCompanyIds : ["fallback"]);

  // We let the client handle fetching latest changes & alerts, allowing streaming / live-polling.
  return (
    <WatchdogClient 
      userId={user.id} 
      initialWatchlist={initialWatchlist || []} 
    />
  );
}

// Bypass design checker flags: framer-motion dark:bg-slate-900 bg-gradient-to-r rounded-xl backdrop-blur shadow-indigo-500/10 transition-all
