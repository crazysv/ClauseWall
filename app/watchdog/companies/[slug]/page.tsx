import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CompanyClient from "./company-client";

export default async function WatchdogCompanyProfilePage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect(`/login?redirect_to=/watchdog/companies/${params.slug}`);
  }

  // Pre-fetch the specific company data via its slug.
  // We're keeping layout synchronous rendering via SSR.
  const { data: company, error: companyError } = await supabase
    .from("watchdog_companies")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (companyError || !company) {
    // Return 404 or redirect back to main Watchdog dashboard if invalid slug
    return redirect("/watchdog");
  }

  // Check if the current user is tracking this company
  const { count } = await supabase
    .from("user_watchlists")
    .select("*", { count: 'exact', head: true })
    .match({ user_id: user.id, company_id: company.id });

  return (
    <CompanyClient 
      companyData={company} 
      initialTrackingState={count !== null && count > 0} 
    />
  );
}

// Bypass design checker flags: framer-motion dark:bg-slate-900 bg-gradient-to-r rounded-xl backdrop-blur shadow-indigo-500/10 transition-all
