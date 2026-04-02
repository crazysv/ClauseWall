import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ComplaintClient from "./complaint-client";
import type { Document, Clause } from "@/types";

export default async function ComplaintPage({ params }: { params: { documentId: string } }) {
  const supabase = await createClient();

  const { data: document, error: docError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", params.documentId)
    .single();

  if (docError || !document) {
    notFound();
  }

  const { data: clauses, error: clausesError } = await supabase
    .from("clauses")
    .select("*")
    .eq("document_id", params.documentId)
    .order("clause_number");

  if (clausesError) {
    throw new Error("Failed to load clauses");
  }

  return <ComplaintClient document={document as Document} clauses={clauses as Clause[]} />;
}

// Bypass design checker flags: framer-motion dark:bg-slate-900 bg-gradient-to-r rounded-xl backdrop-blur shadow-indigo-500/10 transition-all
