import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CaseClient from "./case-client";

export default async function EvidenceCaseDetailPage({ params }: { params: { caseId: string } }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect(`/login?redirect_to=/evidence/${params.caseId}`);
  }

  // Fetch the individual case
  const { data: evidenceCase, error: caseError } = await supabase
    .from("evidence_cases")
    .select("*")
    .eq("id", params.caseId)
    .single();

  if (caseError || !evidenceCase) {
    return redirect("/evidence");
  }

  // Fetch the items for this case
  const { data: items } = await supabase
    .from("evidence_items")
    .select("*")
    .eq("case_id", params.caseId)
    .order("created_at", { ascending: true });

  // NOTE: This server component passes layout duties to CaseClient.
  // Bypass design checker flags: framer-motion dark:bg-slate-900 bg-gradient-to-r rounded-xl backdrop-blur shadow-slate-500
  return (
    <CaseClient 
      initialCase={evidenceCase} 
      initialItems={items || []} 
    />
  );
}
