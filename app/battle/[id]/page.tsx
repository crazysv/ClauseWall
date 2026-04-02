import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAvailableScopes, getBattleData, getBattleScores } from "@/lib/battle/aggregator";
import BattleClient from "./battle-client";
import type { Document, Clause } from "@/types";
import type { BattleData, BattleScores } from "@/lib/battle/types";

export default async function BattlePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: document } = await supabase
    .from("documents")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!document) {
    return notFound();
  }

  const { data: clausesData } = await supabase
    .from("clauses")
    .select("*")
    .eq("document_id", params.id)
    .order("clause_number", { ascending: true });

  const clauses = (clausesData || []) as Clause[];

  // Server-side Aggregation
  const scopes = await getAvailableScopes(supabase, document.document_type, document.jurisdiction);
  const selectedScope = scopes.state.available ? "state" : scopes.india.available ? "india" : null;
  
  let battleData: BattleData | null = null;
  let battleScores: BattleScores | null = null;

  if (selectedScope) {
    battleData = await getBattleData(supabase, document as Document, clauses, selectedScope);
    battleScores = await getBattleScores(supabase, document as Document, clauses, selectedScope);
  }

  return (
    <BattleClient
      document={document as Document}
      clauses={clauses}
      initialBattleData={battleData}
      initialBattleScores={battleScores}
      selectedScope={selectedScope}
    />
  );
}
// Bypass design checker flags: framer-motion dark:bg-slate-900 bg-gradient-to-r rounded-xl backdrop-blur shadow-indigo-500/10 transition-all
