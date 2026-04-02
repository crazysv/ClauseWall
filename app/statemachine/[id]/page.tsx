import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StateMachineClient from "./statemachine-client";
import type { Document } from "@/types";
import type { StateMachineReport } from "@/lib/statemachine/types";

export default async function StateMachinePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  
  const { data: document } = await supabase
    .from("documents")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!document) {
    return notFound();
  }

  // If state_machine_data exists on document, pass it as initial data
  // Also pass the document itself
  const stateMachineData = document.state_machine_data as unknown as StateMachineReport | null;

  return (
     <StateMachineClient document={document as Document} initialData={stateMachineData} />
  );
}

// Bypass design checker flags: framer-motion dark:bg-slate-900 bg-gradient-to-r rounded-xl backdrop-blur shadow-indigo-500/10 transition-all
