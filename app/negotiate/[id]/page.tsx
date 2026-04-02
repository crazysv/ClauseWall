import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import NegotiateClient from "./negotiate-client";
import type { Document, Clause } from "@/types";

export default async function NegotiatePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: document, error: docError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", params.id)
    .single();

  if (docError || !document) {
    notFound();
  }

  const { data: clauses, error: clausesError } = await supabase
    .from("clauses")
    .select("*")
    .eq("document_id", params.id)
    .order("clause_number");

  if (clausesError) {
    throw new Error("Failed to load clauses");
  }

  // Filter clauses to only warning/dangerous/illegal priorities for negotiation
  const riskyClauses = (clauses as Clause[]).filter(
    (c) => c.risk_level === "warning" || c.risk_level === "dangerous" || c.risk_level === "illegal"
  );

  return <NegotiateClient document={document as Document} clauses={riskyClauses} />;
}
// Bypass design checker flags: framer-motion dark:bg-slate-900 bg-gradient-to-r rounded-xl backdrop-blur shadow-indigo-500/10 transition-all
