"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Copy,
  LogOut,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MessageSquare,
  Send,
  Scale,
  Activity,
  Plus
, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { generateSessionId, getRandomColor } from "@/lib/collab";
import { cn } from "@/lib/utils";

import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { PresenceBar } from "@/components/collab/presence-bar";
import { ClauseVote } from "@/components/collab/clause-vote";
import { ShareRoomModal } from "@/components/collab/share-room-modal";

import type { Document, Clause, VoteSummary } from "@/types";
import type { CollabRoom, CollabParticipant, CollabAnnotation, CollabVote } from "@/lib/collab/types";

interface CollabClientProps {
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;

  room: CollabRoom;
  document: Document;
  clauses: Clause[];
}

export default function CollabClient({  room, document, clauses , isLoading, error, onRetry }: CollabClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const roomCode = (room as any).room_code || "UNKNOWN";

  const [sessionId] = useState(() => typeof window !== "undefined" ? localStorage.getItem("clausewall_session_id") || generateSessionId() : generateSessionId());
  const [userName, setUserName] = useState(() => typeof window !== "undefined" ? localStorage.getItem("clausewall_user_name") || "" : "");
  const [userColor] = useState(() => typeof window !== "undefined" ? localStorage.getItem("clausewall_user_color") || getRandomColor() : getRandomColor());

  const [participants, setParticipants] = useState<CollabParticipant[]>([]);
  const [annotations, setAnnotations] = useState<Record<string, CollabAnnotation[]>>({});
  const [votes, setVotes] = useState<Record<string, VoteSummary>>({});
  const [myVotes, setMyVotes] = useState<Record<string, string>>({});
  
  const [needsName, setNeedsName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [joinState, setJoinState] = useState<"joining" | "joined" | "error">("joining");
  const [showShareModal, setShowShareModal] = useState(false);

  const [annotatingClauseId, setAnnotatingClauseId] = useState<string | null>(null);
  const [newAnnotation, setNewAnnotation] = useState("");
  
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Connection Engine
  useEffect(() => {
    if (!userName) {
      setNeedsName(true);
      setJoinState("joining");
      return;
    }

    const connectToRoom = async () => {
      try {
        localStorage.setItem("clausewall_session_id", sessionId);
        localStorage.setItem("clausewall_user_name", userName);
        localStorage.setItem("clausewall_user_color", userColor);

        // Fetch initial data
        const [annRes, voteRes] = await Promise.all([
           fetch(`/api/collab/annotations?roomId=${room.id}`),
           fetch(`/api/collab/votes?roomId=${room.id}`)
        ]);
        
        const annData = await annRes.json();
        const voteData = await voteRes.json();

        if (annData.annotations) {
          const grouped: Record<string, CollabAnnotation[]> = {};
          annData.annotations.forEach((a: CollabAnnotation) => {
             if (!grouped[a.clause_id]) grouped[a.clause_id] = [];
             grouped[a.clause_id].push(a);
          });
          setAnnotations(grouped);
        }

        if (voteData.votes) {
           const summaries: Record<string, VoteSummary> = {};
           const myV: Record<string, string> = {};
           voteData.votes.forEach((v: any) => {
              if (!summaries[v.clause_id]) {
                 summaries[v.clause_id] = { clause_id: v.clause_id, negotiate_count: 0, accept_count: 0, reject_count: 0, total_voters: 0, consensus: false, consensus_action: null };
              }
              const s = summaries[v.clause_id];
              s.total_voters++;
              if (v.vote === "negotiate") s.negotiate_count++;
              else if (v.vote === "accept") s.accept_count++;
              else if (v.vote === "reject") s.reject_count++;

              if (v.voter_id === sessionId) myV[v.clause_id] = v.vote;
           });
           setVotes(summaries);
           setMyVotes(myV);
        }

        // Realtime Subscription
        const channel = supabase.channel(`collab:${roomCode}`, { config: { presence: { key: sessionId } } });
        
        channel.on("presence", { event: "sync" }, () => {
           const state = channel.presenceState();
           const ps: CollabParticipant[] = [];
           Object.values(state).forEach((entries: any[]) => {
              if (entries.length > 0) ps.push(entries[0]);
           });
           setParticipants(ps);
        }).on("postgres_changes", { event: "INSERT", schema: "public", table: "collab_annotations", filter: `room_id=eq.${room.id}` }, (payload) => {
           const ann = payload.new as CollabAnnotation;
           setAnnotations(prev => ({ ...prev, [ann.clause_id]: [...(prev[ann.clause_id] || []), ann] }));
        }).subscribe(async (status) => {
           if (status === "SUBSCRIBED") {
              await channel.track({ user_id: sessionId, user_name: userName, user_color: userColor, role: "collaborator", joined_at: new Date().toISOString() });
           }
        });

        channelRef.current = channel;
        setJoinState("joined");
      } catch (e) {
        setJoinState("error");
      }
    };
    connectToRoom();

    return () => { channelRef.current?.unsubscribe(); };
  }, [userName, roomCode, sessionId, userColor, supabase, room.id]);


  const handleVote = async (clauseId: string, vote: "negotiate" | "accept" | "reject") => {
     setMyVotes(prev => ({ ...prev, [clauseId]: vote }));
     await fetch("/api/collab/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: room.id, clauseId, voterId: sessionId, voterName: userName, vote })
     });
  };

  const submitAnnotation = async (clauseId: string) => {
     if (!newAnnotation.trim()) return;
     await fetch("/api/collab/annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: room.id, clauseId, authorId: sessionId, authorName: userName, authorColor: userColor, content: newAnnotation.trim() })
     });
     setNewAnnotation("");
     setAnnotatingClauseId(null);
     toast.success("Note distributed to team.");
  };

  const getRiskColor = (level: string) => {
     switch (level) {
        case "safe": return "text-emerald-500 bg-emerald-50 border-emerald-200";
        case "warning": return "text-amber-500 bg-amber-50 border-amber-200";
        case "dangerous": return "text-rose-500 bg-rose-50 border-rose-200";
        case "illegal": return "text-indigo-600 bg-indigo-50 border-indigo-200";
        default: return "bg-slate-50 text-slate-500 border-slate-200";
     }
  };

  // Name Entry Wall
  if (needsName) {
     
  // Injected Premium Loading States
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col pt-10">
        <div className="container mx-auto max-w-7xl px-4 py-8 space-y-8 animate-in fade-in duration-500">
          {/* Header Skeleton */}
          <div className="flex flex-col gap-4 mb-6 relative">
            <div className="absolute -left-10 -top-10 w-40 h-40 bg-indigo-600 dark:bg-indigo-500/5 rounded-full blur-3xl" />
            <Skeleton className="h-10 w-[60%] sm:w-96 rounded-xl bg-gradient-to-r from-slate-200 to-indigo-50 dark:from-slate-800 dark:to-indigo-950/20" />
            <Skeleton className="h-5 w-64 rounded-lg" />
          </div>
          
          {/* Dashboard 4-Card Generic Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {[1,2,3,4].map((i) => (
               <div key={i} className="p-6 bg-white dark:bg-card border-none shadow-xl shadow-indigo-500/5 rounded-3xl overflow-hidden relative">
                 <div className="flex justify-between items-start mb-4">
                   <Skeleton className="h-12 w-12 rounded-xl" />
                   <Skeleton className="h-6 w-16 rounded-full" />
                 </div>
                 <Skeleton className="h-8 w-24 rounded-lg mb-2" />
                 <Skeleton className="h-4 w-32 rounded-lg" />
               </div>
            ))}
          </div>
          
          {/* Main Body Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10 mt-6">
            <div className="lg:col-span-2">
               <Skeleton className="h-[400px] w-full bg-white dark:bg-card rounded-3xl shadow-xl shadow-indigo-500/5" />
            </div>
            <div className="lg:col-span-1 flex flex-col gap-6">
               <Skeleton className="h-[188px] w-full bg-white dark:bg-card rounded-3xl shadow-xl shadow-indigo-500/5" />
               <Skeleton className="h-[188px] w-full bg-white dark:bg-card rounded-3xl shadow-xl shadow-indigo-500/5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-rose-200 bg-gradient-to-b from-white to-rose-50/30 dark:bg-rose-950/20 dark:border-rose-800 p-8 rounded-3xl shadow-2xl shadow-rose-500/10 text-center animate-in zoom-in-95 duration-500">
          <div className="mx-auto w-16 h-16 bg-rose-100 dark:bg-rose-900/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <AlertCircle className="h-8 w-8 text-rose-500 dark:text-rose-400" />
          </div>
          <h3 className="font-extrabold text-2xl text-slate-800 dark:text-slate-100 mb-2 tracking-tight">System Interruption</h3>
          <p className="text-slate-600 dark:text-slate-400 font-medium text-sm leading-relaxed mb-8">{error}</p>
          <Button onClick={onRetry} className="w-full h-12 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5">
            Synchronize & Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center p-4">
           <Card className="w-full max-w-md bg-white dark:bg-card border-slate-200 dark:border-slate-700 shadow-xl rounded-3xl p-4 md:p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <Users className="w-6 h-6" />
                 </div>
                 <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Join Team Review</h2>
                    <p className="text-sm font-bold text-slate-400">Room Code: <span className="text-indigo-600 uppercase tracking-widest">{roomCode}</span></p>
                 </div>
              </div>
              <Input 
                aria-label="Enter your operational handle"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder="Enter your operational handle..."
                className="h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold mb-4 focus:ring-1 focus:ring-indigo-500 shadow-inner rounded-xl"
                onKeyDown={e => {
                   if (e.key === "Enter" && nameInput.trim()) { setUserName(nameInput.trim()); setNeedsName(false); }
                }}
              />
              <Button onClick={() => { setUserName(nameInput.trim()); setNeedsName(false); }} disabled={!nameInput.trim()} className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold uppercase tracking-widest text-white shadow-md">
                 Connect to Room
              </Button>
           </Card>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 font-sans flex flex-col">
       <Navbar />

       <main role="main" className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Top Control Bar */}
          <div className="bg-white dark:bg-card border rounded-3xl p-4 md:p-6 shadow-sm dark:shadow-slate-900/20 flex flex-col md:flex-row items-center justify-between gap-4 border-slate-200 dark:border-slate-700 sticky top-4 z-40">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                   <Users className="w-6 h-6" />
                </div>
                <div>
                   <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 line-clamp-1">{(room as any).host_name ? `${(room as any).host_name}'s Review Room` : "Collaborative Review Room"}</h1>
                   <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 font-bold tracking-widest text-[10px] uppercase shadow-none flex items-center gap-1">
                         Code: <span className="text-slate-900 dark:text-slate-100">{roomCode}</span>
                         <Copy onClick={() => { navigator.clipboard.writeText(roomCode); toast.success("Copied to clipboard"); }} className="w-3 h-3 ml-1 cursor-pointer hover:text-indigo-600" />
                      </Badge>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Document: <span className="text-slate-600 dark:text-slate-400">{document.original_filename}</span></span>
                   </div>
                </div>
             </div>
             
             <div className="flex items-center gap-3">
                {/* Embedded Presence Block wrapping native presence logic */}
                <div className="flex -space-x-2 mr-4">
                   {participants.map((p, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-white shadow-sm dark:shadow-slate-900/20 relative group" style={{ backgroundColor: p.user_color }}>
                         {p.user_name.charAt(0).toUpperCase()}
                         <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 border border-white rounded-full translate-x-1 outline outline-2 outline-white" />
                         <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-50">
                            {p.user_name}
                         </span>
                      </div>
                   ))}
                </div>
                <Button onClick={() => setShowShareModal(true)} variant="outline" className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 font-bold rounded-xl h-10 shadow-sm dark:shadow-slate-900/20 hidden sm:flex">
                   Share Room
                </Button>
                <Button onClick={() => router.push("/dashboard")} variant="ghost" className="text-slate-500 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-10 rounded-xl px-3 group">
                   <LogOut className="w-4 h-4 mr-0 sm:mr-2 group-hover:scale-110 transition-transform" /> <span className="hidden sm:inline">Leave</span>
                </Button>
                <Button className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl h-10 font-bold shadow-md shadow-slate-900/10">
                   <Download className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Export Review</span>
                </Button>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative">
             {/* Left Column (Main Clauses & Votes) */}
             <div className="lg:col-span-3 space-y-6">
                {clauses.map(clause => {
                   const cVotes = votes[clause.id] || { negotiate_count: 0, accept_count: 0, reject_count: 0, total_voters: 0 };
                   const myVote = myVotes[clause.id];
                   const cAnnotations = annotations[clause.id] || [];

                   return (
                      <Card key={clause.id} className="bg-white dark:bg-card border rounded-3xl shadow-sm dark:shadow-slate-900/20 border-slate-200 dark:border-slate-700 overflow-hidden relative">
                         {/* Header Strip */}
                         <div className="flex items-center justify-between p-4 px-4 md:px-6 border-b border-slate-100 bg-slate-50 dark:bg-slate-800/50">
                            <div className="flex items-center gap-3">
                               <Badge className={cn("uppercase tracking-widest text-[10px] font-black shadow-none border", getRiskColor(clause.risk_level))}>
                                  {clause.risk_level} Risk
                               </Badge>
                               <span className="text-xs font-bold text-slate-400 capitalize">{clause.clause_type.replace(/_/g, " ")}</span>
                            </div>
                            <Badge variant="outline" className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 font-black text-slate-500 dark:text-slate-400 shadow-none uppercase tracking-widest text-[9px]">
                               C—{clause.clause_number}
                            </Badge>
                         </div>

                         <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
                            {/* Document Text */}
                            <div className="md:col-span-8 space-y-4">
                               <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 italic">
                                  "{clause.original_text}"
                               </p>
                               {clause.explanation && (
                                  <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                                     <Scale className="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" />
                                     <p className="text-xs font-medium leading-relaxed shadow-sm dark:shadow-slate-900/20">{clause.explanation}</p>
                                  </div>
                               )}
                            </div>

                            {/* Margin Voting & Annotation */}
                            <div className="md:col-span-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 rounded-2xl p-4 flex flex-col">
                               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                                  Team Consensus <Users className="w-3 h-3 text-slate-300" />
                               </h4>
                               
                               <ClauseVote
                                 clauseId={clause.id}
                                 roomId={room.id}
                                 voterId={sessionId}
                                 voterName={userName}
                                 currentVote={myVote}
                                 summary={cVotes}
                                 onVote={handleVote}
                               />

                               <Separator className="my-4 bg-slate-200" />
                               
                               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                                  Margin Notes <MessageSquare className="w-3 h-3 text-slate-300" />
                               </h4>

                               <div className="flex-1 space-y-3 mb-4 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                                  {cAnnotations.length === 0 ? (
                                    <p className="text-xs text-slate-400 font-medium italic text-center py-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100">No notes yet.</p>
                                  ) : (
                                     cAnnotations.map(ann => (
                                        <div key={ann.id} className="bg-white dark:bg-card p-2.5 rounded-xl shadow-sm dark:shadow-slate-900/20 border border-slate-100 relative">
                                           <div className="flex items-center gap-2 mb-1">
                                              <div className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-black text-white" style={{ backgroundColor: ann.author_color }}>
                                                 {ann.author_name.charAt(0)}
                                              </div>
                                              <span className="text-[10px] font-bold text-slate-900 dark:text-slate-100">{ann.author_name}</span>
                                           </div>
                                           <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 pl-6 leading-snug">{ann.content}</p>
                                        </div>
                                     ))
                                  )}
                               </div>

                               {annotatingClauseId === clause.id ? (
                                  <div className="flex items-center gap-2">
                                     <Input
                                        autoFocus
                                        value={newAnnotation}
                                        onChange={e => setNewAnnotation(e.target.value)}
                                        placeholder="Type note..."
                                        className="h-8 text-[11px] rounded-lg bg-white dark:bg-card border-slate-200 dark:border-slate-700 focus:border-indigo-500 shadow-inner px-2"
                                        onKeyDown={(e) => {
                                           if (e.key === "Enter") submitAnnotation(clause.id);
                                           if (e.key === "Escape") setAnnotatingClauseId(null);
                                        }}
                                     />
                                     <Button aria-label="Submit margin note" size="icon" onClick={() => submitAnnotation(clause.id)} disabled={!newAnnotation.trim()} className="h-8 w-8 rounded-lg bg-indigo-600 text-white shrink-0 shadow-sm dark:shadow-slate-900/20">
                                        <Send className="w-3 h-3" />
                                     </Button>
                                  </div>
                               ) : (
                                  <Button 
                                    onClick={() => setAnnotatingClauseId(clause.id)}
                                    variant="outline" 
                                    className="w-full h-8 text-[11px] font-bold text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 bg-white dark:bg-card hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 shadow-sm dark:shadow-slate-900/20"
                                  >
                                     <Plus className="w-3 h-3 mr-1" /> Add Margin Note
                                  </Button>
                               )}
                            </div>
                         </div>
                      </Card>
                   );
                })}
             </div>

             {/* Right Column: Activity Feed Sticky */}
             <div className="lg:col-span-1">
                <div className="sticky top-[104px]">
                   <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm dark:shadow-slate-900/20 overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 120px)' }}>
                      <div className="p-4 px-4 md:px-6 border-b border-slate-100 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                         <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                            <Activity className="w-4 h-4 text-indigo-500" /> Live Feed
                         </h3>
                         <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 uppercase tracking-widest text-[9px] shadow-none flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                         </Badge>
                      </div>
                      
                      <ScrollArea className="flex-1 p-4">
                         <div className="space-y-4 pr-3">
                            {/* Flattened chronological projection. For Stitch compliance, we project recent annotations. */}
                            {Object.entries(annotations).flatMap(([clauseId, anns]) => 
                               anns.map(a => ({ ...a, clauseId, type: 'annotation' }))
                            ).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                             .slice(0, 15)
                             .map(item => (
                               <div key={item.id} className="flex gap-3 text-sm">
                                  <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[8px] font-black text-white mt-1" style={{ backgroundColor: item.author_color }}>
                                     {item.author_name.charAt(0)}
                                  </div>
                                  <div>
                                     <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        <strong className="text-slate-900 dark:text-slate-100">{item.author_name}</strong> noted on <span className="text-xs font-bold font-mono tracking-tighter text-indigo-500 bg-indigo-50 px-1 py-0.5 rounded border border-indigo-100">C-{clauses.find(c => c.id === item.clauseId)?.clause_number}</span>
                                     </p>
                                     <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-1 italic border-l-2 border-indigo-200 pl-2 py-0.5 max-w-[200px] truncate">"{item.content}"</p>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </ScrollArea>
                   </Card>
                </div>
             </div>
          </div>
       </main>
       
       <ShareRoomModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} documentId={document.id} />
    </div>
  );
}
