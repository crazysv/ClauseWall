"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  Loader2,
  XCircle,
  MessageSquare,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { generateSessionId, getRandomColor } from "@/lib/collab";
import { toast } from "sonner";
import type { Document, Clause, CollabParticipant, CollabAnnotation, VoteSummary } from "@/types";
import PresenceBar from "@/components/collab/presence-bar";
import ClauseVote from "@/components/collab/clause-vote";
import {
  getRiskLevel,
  getStateName,
  getDocumentTypeLabel,
  RISK_COLORS,
} from "@/lib/utils/constants";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle as XC,
  Scale,
} from "lucide-react";

type JoinState = "joining" | "joined" | "error";

export default function CollabPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = (params.roomCode as string).toUpperCase();
  const supabase = createClient();

  // Session
  const [sessionId] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("clausewall_session_id") || generateSessionId()
      : generateSessionId()
  );
  const [userName, setUserName] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("clausewall_user_name") || ""
      : ""
  );
  const [userColor] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("clausewall_user_color") || getRandomColor()
      : getRandomColor()
  );

  // State
  const [joinState, setJoinState] = useState<JoinState>("joining");
  const [errorMsg, setErrorMsg] = useState("");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [participants, setParticipants] = useState<CollabParticipant[]>([]);
  const [annotations, setAnnotations] = useState<Record<string, CollabAnnotation[]>>({});
  const [votes, setVotes] = useState<Record<string, VoteSummary>>({});
  const [myVotes, setMyVotes] = useState<Record<string, string>>({});
  const [nameInput, setNameInput] = useState("");
  const [needsName, setNeedsName] = useState(false);

  // Annotation input
  const [annotatingClause, setAnnotatingClause] = useState<string | null>(null);
  const [annotationText, setAnnotationText] = useState("");

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── JOIN ROOM ──
  const joinRoom = useCallback(async (name: string) => {
    try {
      const res = await fetch("/api/collab/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Room not found");
        setJoinState("error");
        return;
      }

      setRoomId(data.room.id);

      // Save session
      localStorage.setItem("clausewall_session_id", sessionId);
      localStorage.setItem("clausewall_user_name", name);
      localStorage.setItem("clausewall_user_color", userColor);

      // Load document + clauses
      const { data: doc } = await supabase
        .from("documents")
        .select("*")
        .eq("id", data.documentId)
        .single();

      if (doc) setDocument(doc as Document);

      const { data: clauseData } = await supabase
        .from("clauses")
        .select("*")
        .eq("document_id", data.documentId)
        .order("clause_number", { ascending: true });

      if (clauseData) setClauses(clauseData as Clause[]);

      // Load annotations
      const annRes = await fetch(`/api/collab/annotations?roomId=${data.room.id}`);
      const annData = await annRes.json();
      if (annData.annotations) {
        const grouped: Record<string, CollabAnnotation[]> = {};
        for (const ann of annData.annotations) {
          if (!grouped[ann.clause_id]) grouped[ann.clause_id] = [];
          grouped[ann.clause_id].push(ann);
        }
        setAnnotations(grouped);
      }

      // Load votes
      const voteRes = await fetch(`/api/collab/votes?roomId=${data.room.id}`);
      const voteData = await voteRes.json();
      if (voteData.votes) {
        const summaries: Record<string, VoteSummary> = {};
        const myV: Record<string, string> = {};

        for (const v of voteData.votes) {
          if (!summaries[v.clause_id]) {
            summaries[v.clause_id] = {
              clause_id: v.clause_id,
              negotiate_count: 0,
              accept_count: 0,
              reject_count: 0,
              total_voters: 0,
              consensus: false,
              consensus_action: null,
            };
          }
          const s = summaries[v.clause_id];
          s.total_voters++;
          if (v.vote === "negotiate") s.negotiate_count++;
          else if (v.vote === "accept") s.accept_count++;
          else if (v.vote === "reject") s.reject_count++;

          if (v.voter_id === sessionId) {
            myV[v.clause_id] = v.vote;
          }
        }

        // Check consensus
        for (const s of Object.values(summaries)) {
          if (s.total_voters >= 2) {
            const max = Math.max(s.negotiate_count, s.accept_count, s.reject_count);
            if (max === s.total_voters) {
              s.consensus = true;
              if (max === s.negotiate_count) s.consensus_action = "negotiate";
              else if (max === s.accept_count) s.consensus_action = "accept";
              else s.consensus_action = "reject";
            }
          }
        }

        setVotes(summaries);
        setMyVotes(myV);
      }

      // Subscribe to realtime
      const channel = supabase.channel(`collab:${roomCode}`, {
        config: { presence: { key: sessionId } },
      });

      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState();
          const ps: CollabParticipant[] = [];
          for (const key of Object.keys(state)) {
            const entries = state[key] as any[];
            if (entries.length > 0) {
              ps.push(entries[0] as CollabParticipant);
            }
          }
          setParticipants(ps);
        })
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "collab_annotations",
            filter: `room_id=eq.${data.room.id}`,
          },
          (payload) => {
            const ann = payload.new as CollabAnnotation;
            setAnnotations((prev) => ({
              ...prev,
              [ann.clause_id]: [...(prev[ann.clause_id] || []), ann],
            }));
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "collab_votes",
            filter: `room_id=eq.${data.room.id}`,
          },
          () => {
            // Refetch votes on any change
            fetch(`/api/collab/votes?roomId=${data.room.id}`)
              .then((r) => r.json())
              .then((d) => {
                if (!d.votes) return;
                const summaries: Record<string, VoteSummary> = {};
                const myV: Record<string, string> = {};
                for (const v of d.votes) {
                  if (!summaries[v.clause_id]) {
                    summaries[v.clause_id] = {
                      clause_id: v.clause_id,
                      negotiate_count: 0, accept_count: 0, reject_count: 0,
                      total_voters: 0, consensus: false, consensus_action: null,
                    };
                  }
                  const s = summaries[v.clause_id];
                  s.total_voters++;
                  if (v.vote === "negotiate") s.negotiate_count++;
                  else if (v.vote === "accept") s.accept_count++;
                  else s.reject_count++;
                  if (v.voter_id === sessionId) myV[v.clause_id] = v.vote;
                }
                setVotes(summaries);
                setMyVotes(myV);
              });
          }
        )
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await channel.track({
              user_id: sessionId,
              user_name: name,
              user_color: userColor,
              role: "collaborator",
              current_clause: null,
              joined_at: new Date().toISOString(),
            });
          }
        });

      channelRef.current = channel;
      setJoinState("joined");
    } catch (err) {
      setErrorMsg("Failed to join room");
      setJoinState("error");
    }
  }, [roomCode, sessionId, userColor, supabase]);

  useEffect(() => {
    if (userName) {
      joinRoom(userName);
    } else {
      setNeedsName(true);
      setJoinState("joining");
    }

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, []);

  // ── VOTE HANDLER ──
  const handleVote = async (clauseId: string, vote: "negotiate" | "accept" | "reject") => {
    if (!roomId) return;

    setMyVotes((prev) => ({ ...prev, [clauseId]: vote }));

    await fetch("/api/collab/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId,
        clauseId,
        voterId: sessionId,
        voterName: userName,
        vote,
      }),
    });
  };

  // ── ANNOTATION HANDLER ──
  const handleAddAnnotation = async (clauseId: string) => {
    if (!roomId || !annotationText.trim()) return;

    await fetch("/api/collab/annotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId,
        clauseId,
        authorId: sessionId,
        authorName: userName,
        authorColor: userColor,
        content: annotationText.trim(),
      }),
    });

    setAnnotationText("");
    setAnnotatingClause(null);
    toast.success("Note added!");
  };

  // ── NAME INPUT ──
  if (needsName && !userName) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-sm w-full mx-4 p-6 rounded-2xl bg-gray-900 border border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-6 w-6 text-blue-400" />
            <h2 className="text-lg font-bold">Join Collaboration</h2>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Room: <span className="font-mono font-bold text-blue-400">{roomCode}</span>
          </p>
          <Input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Enter your name"
            className="mb-3 bg-gray-800 border-gray-700"
            onKeyDown={(e) => {
              if (e.key === "Enter" && nameInput.trim()) {
                setUserName(nameInput.trim());
                setNeedsName(false);
                joinRoom(nameInput.trim());
              }
            }}
          />
          <Button
            onClick={() => {
              if (nameInput.trim()) {
                setUserName(nameInput.trim());
                setNeedsName(false);
                joinRoom(nameInput.trim());
              }
            }}
            disabled={!nameInput.trim()}
            className="w-full"
          >
            Join Room
          </Button>
        </div>
      </div>
    );
  }

  if (joinState === "joining") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
        <p className="text-muted-foreground">Joining room {roomCode}...</p>
      </div>
    );
  }

  if (joinState === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <XCircle className="h-8 w-8 text-red-400" />
        <p className="text-red-400">{errorMsg}</p>
        <Button variant="outline" onClick={() => router.push("/upload")}>
          Go to Upload
        </Button>
      </div>
    );
  }

  if (!document) return null;

  const riskLevel = getRiskLevel(document.overall_risk_score);
  const riskColor = RISK_COLORS[riskLevel];

  const riskConfig: Record<string, { icon: React.ReactNode; badgeClass: string; label: string }> = {
    safe: { icon: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />, badgeClass: "bg-green-500/15 text-green-400", label: "Safe" },
    warning: { icon: <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />, badgeClass: "bg-yellow-500/15 text-yellow-400", label: "Warning" },
    dangerous: { icon: <XC className="h-3.5 w-3.5 text-red-500" />, badgeClass: "bg-red-500/15 text-red-400", label: "Dangerous" },
    illegal: { icon: <Scale className="h-3.5 w-3.5 text-purple-500" />, badgeClass: "bg-purple-500/15 text-purple-400", label: "Illegal" },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Presence Bar */}
      <PresenceBar
        participants={participants}
        currentUserId={sessionId}
        roomCode={roomCode}
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Users className="h-4 w-4" />
            <span>Collaborative Review</span>
            <span>•</span>
            <span>{getDocumentTypeLabel(document.document_type)}</span>
            <span>•</span>
            <span>{getStateName(document.jurisdiction)}</span>
          </div>
          <h1 className="text-xl font-bold">
            {document.original_filename || "Contract Analysis"}
          </h1>

          {/* Score */}
          <div className="flex items-center gap-3 mt-3">
            <div
              className="px-3 py-1 rounded-full text-sm font-bold"
              style={{ backgroundColor: riskColor + "20", color: riskColor }}
            >
              Risk Score: {document.overall_risk_score}/100
            </div>
            <span className="text-xs text-gray-500">
              {document.total_clauses} clauses
            </span>
          </div>
        </div>

        {/* Vote Summary */}
        {Object.keys(votes).length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-gray-900/50 border border-gray-800">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              Team Consensus
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2 rounded-lg bg-green-500/10">
                <p className="text-lg font-bold text-green-400">
                  {Object.values(votes).filter((v) => v.consensus_action === "accept").length}
                </p>
                <p className="text-[10px] text-gray-500">Accept</p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <p className="text-lg font-bold text-yellow-400">
                  {Object.values(votes).filter((v) => v.consensus_action === "negotiate").length}
                </p>
                <p className="text-[10px] text-gray-500">Negotiate</p>
              </div>
              <div className="p-2 rounded-lg bg-red-500/10">
                <p className="text-lg font-bold text-red-400">
                  {Object.values(votes).filter((v) => v.consensus_action === "reject").length}
                </p>
                <p className="text-[10px] text-gray-500">Reject</p>
              </div>
            </div>
          </div>
        )}

        {/* Clauses */}
        <div className="space-y-3">
          {clauses.map((clause) => {
            const risk = riskConfig[clause.risk_level] || riskConfig.warning;
            const clauseAnnotations = annotations[clause.id] || [];
            const clauseVotes = votes[clause.id] || null;
            const myVote = myVotes[clause.id] || null;
            const isAnnotating = annotatingClause === clause.id;

            return (
              <motion.div
                key={clause.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-white/5 bg-gray-900/50 p-4 space-y-3"
              >
                {/* Clause Header */}
                <div className="flex items-center gap-2 flex-wrap">
                  {risk.icon}
                  <Badge className={risk.badgeClass}>{risk.label}</Badge>
                  <span className="text-xs text-gray-500">
                    Clause {clause.clause_number}
                  </span>
                  <Badge variant="outline" className="text-[10px] border-white/10 text-gray-500">
                    {clause.clause_type}
                  </Badge>
                </div>

                {/* Text */}
                <p className="text-sm text-gray-300 leading-relaxed">
                  {clause.original_text}
                </p>

                {/* Explanation */}
                <p className="text-xs text-gray-500 leading-relaxed">
                  {clause.explanation}
                </p>

                {/* Votes */}
                <div className="pt-1">
                  <ClauseVote
                    clauseId={clause.id}
                    roomId={roomId || ""}
                    voterId={sessionId}
                    voterName={userName}
                    currentVote={myVote}
                    summary={clauseVotes}
                    onVote={handleVote}
                  />
                </div>

                {/* Annotations */}
                {clauseAnnotations.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {clauseAnnotations.map((ann) => (
                      <div key={ann.id} className="flex items-start gap-2">
                        <div
                          className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-white mt-0.5"
                          style={{ backgroundColor: ann.author_color }}
                        >
                          {ann.author_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-[10px] font-medium" style={{ color: ann.author_color }}>
                            {ann.author_name}
                          </span>
                          <p className="text-xs text-gray-400">{ann.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Annotation */}
                {isAnnotating ? (
                  <div className="flex gap-2">
                    <Input
                      value={annotationText}
                      onChange={(e) => setAnnotationText(e.target.value)}
                      placeholder="Add a note..."
                      className="text-xs bg-gray-800 border-gray-700 h-8"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddAnnotation(clause.id);
                        if (e.key === "Escape") setAnnotatingClause(null);
                      }}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => handleAddAnnotation(clause.id)}
                      disabled={!annotationText.trim()}
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAnnotatingClause(clause.id)}
                    className="flex items-center gap-1.5 text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
                  >
                    <MessageSquare className="h-3 w-3" />
                    Add note
                    {clauseAnnotations.length > 0 && (
                      <span className="text-gray-600">
                        ({clauseAnnotations.length})
                      </span>
                    )}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}