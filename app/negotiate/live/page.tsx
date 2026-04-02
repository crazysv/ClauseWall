"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/shared/navbar";
import { AudioWaveform } from "@/components/negotiate/audio-waveform";
import { BluffDetectorPanel } from "@/components/negotiate/bluff-detector-panel";
import { CameraScannerPanel } from "@/components/negotiate/camera-scanner-panel";
import { QuickLookupPanel } from "@/components/negotiate/quick-lookup-panel";
import { ProgressTrackerPanel } from "@/components/negotiate/progress-tracker-panel";
import { TacticAlert } from "@/components/negotiate/tactic-alert";
import { SessionSetup } from "@/components/negotiate/session-setup";
import { FloatingLookupBar } from "@/components/negotiate/floating-lookup-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { 
  Mic, 
  MicOff, 
  Camera, 
  Pause, 
  Play, 
  Clock, 
  Activity, 
  BarChart,
  BrainCircuit,
  Sword,
  ShieldCheck,
  ChevronRight,
  User,
  Bot
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Document, Clause, DetectedTactic, BluffAnalysis, NegotiationSession } from "@/types";

interface TranscriptEntry {
  id: string;
  speaker: "user" | "counterparty" | "unknown";
  text: string;
  timestamp: number;
  highlights?: { text: string; type: "key_phrase" | "dangerous" | "legal_term" }[];
}

interface CounterArgument {
  id: string;
  theirStatement: string;
  suggestedResponse: string;
  confidence: number;
  legalBacking: string;
}

interface BluffAlert {
  id: string;
  claim: string;
  verdict: "bluff" | "factual" | "misleading";
  explanation: string;
  confidence: number;
}

export default function LiveNegotiationPage() {
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionData, setSessionData] = useState<NegotiationSession | null>(null);
  const [existingSessions, setExistingSessions] = useState<NegotiationSession[]>([]);
  
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Mock audio stream for the visual waveform
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [counterArguments, setCounterArguments] = useState<CounterArgument[]>([]);
  
  const [tacticAlert, setTacticAlert] = useState<{ tactic: DetectedTactic; bluffCheck: BluffAnalysis | null } | null>(null);

  // Auto-scroll transcript ref
  const scrollRef = useRef<HTMLDivElement>(null);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sessionActive && !isPaused) {
      interval = setInterval(() => {
        setSessionDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionActive, isPaused]);

  // Request mic permissions if recording starts
  useEffect(() => {
    async function startMic() {
      if (isRecording && !isPaused) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setAudioStream(stream);

          // Simulate incoming transcript periodically for UI demonstration
          const demoInterval = setInterval(() => {
            const lines = [
              "We cannot change the lock-in period, it is standard practice.",
              "If you want to leave early you have to forfeit the entire deposit.",
              "The painting charges are strictly on the tenant as per state law.",
            ];
            const randomLine = lines[Math.floor(Math.random() * lines.length)];
            
            setTranscript((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                speaker: "counterparty",
                text: randomLine,
                timestamp: Date.now(),
                highlights: [{ text: "forfeit the entire deposit", type: "dangerous" }]
              }
            ]);

            // Randomly trigger counter arguments based on transcripts
            if (Math.random() > 0.6) {
              setCounterArguments((prev) => [
                {
                  id: Date.now().toString(),
                  theirStatement: randomLine,
                  suggestedResponse: "State clearly: 'Security deposits cannot be arbitrarily forfeited under the Rent Control Act unless there are proven damages.'",
                  confidence: 95,
                  legalBacking: "Rent Control Act Sec 12"
                },
                ...prev
              ]);
            }
          }, 8000);

          return () => clearInterval(demoInterval);
        } catch (err) {
          setIsRecording(false);
        }
      } else {
        if (audioStream) {
          audioStream.getTracks().forEach((track) => track.stop());
          setAudioStream(null);
        }
      }
    }
    startMic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording, isPaused]);

  // Auto-scroll to bottom of transcript
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  const handleSessionStart = (session: NegotiationSession) => {
    setSessionData(session);
    setSessionActive(true);
    setIsRecording(true);
    setExistingSessions((prev) => [session, ...prev]);
  };

  const handleSessionUpdate = (session: NegotiationSession) => {
    setSessionData(session);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (!sessionActive) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col">
          <SessionSetup onSessionStart={handleSessionStart} existingSessions={existingSessions} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col font-sans overflow-hidden">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 shrink-0 relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-200 leading-tight">Live Session</h1>
            <p className="text-[10px] text-slate-400 font-medium">{sessionData?.entity_name}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Badge variant="outline" className={cn("bg-slate-900 border-slate-800 text-slate-300 font-bold px-3 py-1 animate-in fade-in transition-colors", isRecording && !isPaused ? "border-red-500/30 text-red-400" : "")}>
            {isRecording && !isPaused && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2" />}
            {formatTime(sessionDuration)}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => setSessionActive(false)} className="text-slate-400 hover:text-white">
            End Session
          </Button>
        </div>
      </header>

      {/* Main 2x2 Grid Workspace */}
      <main role="main" className="flex-1 overflow-auto p-4 flex flex-col relative bg-[#09090b]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 h-full min-h-[600px]">
          
          {/* TOP LEFT: Live Transcription */}
          <Card className="bg-slate-900/50 border-slate-800 flex flex-col overflow-hidden backdrop-blur-sm h-full">
            <CardHeader className="py-3 px-4 border-b border-slate-800/50 bg-slate-900/50 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-300">
                <Mic className="w-4 h-4 text-emerald-400" /> Transcription
              </CardTitle>
              {isRecording && !isPaused && <AudioWaveform stream={audioStream} isRecording={isRecording} />}
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden relative">
              <ScrollArea className="h-[300px] lg:h-full p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {transcript.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 mt-20">
                      <MicOff className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-sm">Listening for counterparty...</p>
                    </div>
                  )}
                  {transcript.map((entry) => (
                    <motion.div 
                      key={entry.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex gap-3 max-w-[85%]", 
                        entry.speaker === "user" ? "ml-auto flex-row-reverse" : ""
                      )}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1",
                        entry.speaker === "user" ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-800 text-slate-400"
                      )}>
                        {entry.speaker === "user" ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                      </div>
                      <div className={cn(
                        "p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                        entry.speaker === "user" ? "bg-indigo-600/20 text-indigo-100 rounded-tr-sm" : "bg-slate-800 text-slate-200 rounded-tl-sm"
                      )}>
                        {entry.text}
                      </div>
                    </motion.div>
                  ))}
                  <div className="h-10" />
                </div>
              </ScrollArea>
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none" />
            </CardContent>
          </Card>

          {/* TOP RIGHT: Quick Lookup */}
          <Card className="bg-slate-900/50 border-slate-800 flex flex-col overflow-hidden backdrop-blur-sm h-full">
            <CardHeader className="py-3 px-4 border-b border-slate-800/50 bg-slate-900/50">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-300">
                <BrainCircuit className="w-4 h-4 text-indigo-400" /> Legal Database Lookup
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-y-auto w-full">
              {sessionData && (
                 <div className="h-[300px] lg:h-full p-4">
                   <QuickLookupPanel jurisdiction={sessionData.jurisdiction} documentType={sessionData.document_type} onResult={() => {}} />
                 </div>
              )}
            </CardContent>
          </Card>

          {/* BOTTOM LEFT: Counter-Arguments */}
          <Card className="bg-slate-900/50 border-slate-800 flex flex-col overflow-hidden backdrop-blur-sm h-full">
            <CardHeader className="py-3 px-4 border-b border-slate-800/50 bg-slate-900/50">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-300">
                <Sword className="w-4 h-4 text-rose-400" /> Counter-Arguments
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-y-auto bg-slate-900/30">
              <ScrollArea className="h-[300px] lg:h-full p-4">
                <div className="space-y-3">
                  <AnimatePresence>
                    {counterArguments.length === 0 && (
                      <div className="flex justify-center items-center h-full text-slate-500 dark:text-slate-400 text-sm mt-20">
                        No pressure tactics or assertions detected yet.
                      </div>
                    )}
                    {counterArguments.map((arg) => (
                      <motion.div
                        key={arg.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 shadow-inner"
                      >
                        <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/20 mb-2 text-[10px] uppercase font-bold tracking-wider">
                          Suggested Response
                        </Badge>
                        <p className="text-sm font-medium text-rose-100 mb-2 leading-relaxed">
                          {arg.suggestedResponse}
                        </p>
                        <div className="flex items-center justify-between mt-3 text-xs border-t border-rose-500/10 pt-2">
                          <span className="text-slate-400 select-none">Based on: <span className="text-rose-300 font-medium">{arg.legalBacking}</span></span>
                          <span className="text-emerald-400/80 font-mono">{arg.confidence}% Match</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* BOTTOM RIGHT: Bluff Detector */}
          <Card className="bg-slate-900/50 border-slate-800 flex flex-col overflow-hidden backdrop-blur-sm h-full">
             <CardHeader className="py-3 px-4 border-b border-slate-800/50 bg-slate-900/50">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-blue-400" /> Claim Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-y-auto">
              {sessionData && (
                <div className="h-[300px] lg:h-full p-4">
                  <BluffDetectorPanel jurisdiction={sessionData.jurisdiction} documentType={sessionData.document_type} />
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Floating Tactic Alert */}
        <AnimatePresence>
          {tacticAlert && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="absolute bottom-24 right-8 w-80 z-50 drop-shadow-2xl"
            >
              <TacticAlert 
                tactic={tacticAlert.tactic} 
                bluffCheck={tacticAlert.bluffCheck} 
                onDismiss={() => setTacticAlert(null)} 
                onSpeak={() => {}} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Bar Dashboard */}
      <footer role="contentinfo" className="h-24 border-t border-slate-800 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center gap-6 px-4 md:px-6 shrink-0 shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.5)] z-30">
        
        {/* Toggle Pause */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsPaused(!isPaused)}
          className="w-12 h-12 rounded-2xl bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 shadow-sm dark:shadow-slate-900/20"
        >
          {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
        </Button>

        {/* Central Record Toggle (Large) */}
        <Button
          onClick={() => setIsRecording(!isRecording)}
          className={cn(
            "w-20 h-20 rounded-[2.5rem] shadow-xl border-[6px] transition-all hover:scale-105 active:scale-95",
            isRecording && !isPaused
              ? "bg-red-500 hover:bg-red-600 border-red-500/30 text-white"
              : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
          )}
        >
          {isRecording && !isPaused ? <Mic className="w-8 h-8" /> : <MicOff className="w-8 h-8" />}
        </Button>

        {/* Camera Scanner Dialog Trigger */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="w-12 h-12 rounded-2xl bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 shadow-sm dark:shadow-slate-900/20"
            >
              <Camera className="w-5 h-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl bg-slate-950 border-slate-800 p-0 overflow-hidden">
            <CameraScannerPanel jurisdiction={sessionData?.jurisdiction || ""} documentType={sessionData?.document_type || ""} />
          </DialogContent>
        </Dialog>

        {/* Progress Tracker Dialog Trigger */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="w-12 h-12 rounded-2xl bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 shadow-sm dark:shadow-slate-900/20 relative"
            >
              <BarChart className="w-5 h-5" />
              {sessionData && sessionData.clauses.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-slate-950">
                  {sessionData.clauses.length}
                </span>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl bg-slate-950 border-slate-800 text-slate-50 p-6">
            {sessionData && <ProgressTrackerPanel session={sessionData} onSessionUpdate={handleSessionUpdate} />}
          </DialogContent>
        </Dialog>

      </footer>

    </div>
  );
}
