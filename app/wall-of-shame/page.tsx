import { createClient } from "@/lib/supabase/server";
import ShameClient from "./shame-client";
import type { FlaggedEntity } from "@/types";

export default async function WallOfShamePage() {
  const supabase = await createClient();

  const { data: entities, error } = await supabase
    .from("flagged_entities")
    .select("*")
    .order("total_flags", { ascending: false });

  if (error) {
  }

  return <ShameClient initialEntities={(entities as FlaggedEntity[]) || []} />;
}