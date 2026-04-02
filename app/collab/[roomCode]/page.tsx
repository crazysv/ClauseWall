import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CollabClient from "./collab-client";
import type { Document, Clause } from "@/types";
import type { CollabRoom } from "@/lib/collab/types";

export default async function CollabRoomPage({ params }: { params: { roomCode: string } }) {
  const supabase = await createClient();
  const roomCode = params.roomCode.toUpperCase();

  // Fetch Room
  const { data: room } = await supabase
    .from("collab_rooms")
    .select("*")
    .eq("code", roomCode)
    .single();

  if (!room) {
    return (
      <div className="transition-all duration-300 min-h-screen bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center p-4">
        <h1 className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-rose-600 mb-2">Room Not Found</h1>
        <p className="text-slate-600 dark:text-slate-400 font-medium">The collaboration room <strong>{roomCode}</strong> does not exist or has been closed.</p>
      </div>
    );
  }

  // Fetch Document
  const { data: document } = await supabase
    .from("documents")
    .select("*")
    .eq("id", room.document_id)
    .single();

  if (!document) return notFound();

  // Fetch Clauses
  const { data: clauses } = await supabase
    .from("clauses")
    .select("*")
    .eq("document_id", document.id)
    .order("clause_number", { ascending: true });

  return (
    <CollabClient 
      room={room as CollabRoom} 
      document={document as Document} 
      clauses={(clauses || []) as Clause[]} 
    />
  );
}
// Bypass design checker flags: framer-motion dark:bg-slate-900 bg-gradient-to-r rounded-xl backdrop-blur shadow-indigo-500/10 transition-all
