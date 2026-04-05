"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ArrowLeft, Mic, MicOff, Handshake } from "lucide-react";
import Link from "next/link";
import SessionSetup from "./session-setup";
import QuickLookupPanel from "./quick-lookup-panel";
import AudioCompanionPanel from "./audio-companion-panel";
import CameraScannerPanel from "./camera-scanner-panel";
import BluffDetectorPanel from "./bluff-detector-panel";
import ProgressTrackerPanel from "./progress-tracker-panel";
import FloatingLookupBar from "./floating-lookup-bar";
import type {
  NegotiationMode,
  NegotiationSession,
  QuickLookupResult,
} from "@/types";
import {
  loadLatestSession,
  saveSession,
  getAllSessions,
} from "@/lib/negotiate/session-manager";

const MODE_CONFIG: {
  id: NegotiationMode;
  icon: string;
  label: string;
  color: string;
}[] = [
  { id: "quick_lookup", icon: "📝", label: "Lookup", color: "#3b82f6" },
  { id: "audio_companion", icon: "🎤", label: "Audio", color: "#22c55e" },
  { id: "camera_scanner", icon: "📷", label: "Camera", color: "#06b6d4" },
  { id: "bluff_detector", icon: "🔍", label: "Bluff", color: "#ef4444" },
  { id: "progress_tracker", icon: "📊", label: "Progress", color: "#6366f1" },
];

export default function NegotiationCompanion() {
  const [session, setSession] = useState<NegotiationSession | null>(null);
  const [activeMode, setActiveMode] = useState<NegotiationMode>("quick_lookup");
  const [showSetup, setShowSetup] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const latest = loadLatestSession();
    if (latest) {
      const hoursSince =
        (Date.now() - new Date(latest.started_at).getTime()) / (1000 * 60 * 60);
      if (hoursSince < 4) {
        setSession(latest);
        setShowSetup(false);
        startTimer(new Date(latest.started_at));
      }
    }
  }, []);

  // Wake Lock to keep screen on during session
  useEffect(() => {
    if (session && !showSetup) {
      requestWakeLock();
    }
    return () => {
      releaseWakeLock();
    };
  }, [session, showSetup]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const requestWakeLock = async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch {
      // Wake Lock not supported or permission denied
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  const startTimer = (startedAt: Date) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startedAt.getTime()) / 1000));
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0)
      return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const handleSessionStart = useCallback((newSession: NegotiationSession) => {
    setSession(newSession);
    setShowSetup(false);
    startTimer(new Date(newSession.started_at));
  }, []);

  const handleSessionUpdate = useCallback((updated: NegotiationSession) => {
    setSession(updated);
    saveSession(updated);
  }, []);

  const handleEndSession = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    releaseWakeLock();
    setShowSetup(true);
    setSession(null);
    setElapsedTime(0);
  }, []);

  const handleLookupResult = useCallback(
    (result: QuickLookupResult) => {
      if (!session) return;
      const updated = {
        ...session,
        lookups: [...session.lookups, result],
      };
      handleSessionUpdate(updated);
    },
    [session, handleSessionUpdate],
  );

  // Show setup if no active session
  if (showSetup || !session) {
    return (
      <div className="min-h-screen bg-background">
        <SessionSetup
          onSessionStart={handleSessionStart}
          existingSessions={getAllSessions()}
        />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      style={{ paddingBottom: "80px" }}
    >
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-white border-b-2 border-black px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 -ml-2 text-muted-foreground hover:text-black transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <p className="text-sm font-black uppercase tracking-tight text-black truncate max-w-[140px] sm:max-w-none">
                {session.entity_name}
              </p>
              <p className="text-[10px] text-foreground font-black uppercase tracking-wider">
                {formatTime(elapsedTime)}
              </p>
            </div>
          </div>
          <button
            onClick={handleEndSession}
            className="text-xs font-bold uppercase tracking-wider text-black bg-red-400 hover:bg-red-500 px-3 py-1.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors"
          >
            End Session
          </button>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="sticky top-[61px] z-30 bg-gray-50 border-b-2 border-black px-2 py-2">
        <div className="flex gap-2 max-w-2xl mx-auto justify-center overflow-x-auto pb-1">
          {MODE_CONFIG.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 transition-all min-w-[56px] border-2 ${
                activeMode === mode.id
                  ? "bg-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-transparent border-transparent hover:border-black/20"
              }`}
            >
              <span className="text-lg leading-none">{mode.icon}</span>
              <span
                className={`text-[10px] font-black uppercase tracking-wider ${
                  activeMode === mode.id
                    ? "text-black"
                    : "text-muted-foreground"
                }`}
              >
                {mode.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-4">
        {activeMode === "quick_lookup" && (
          <QuickLookupPanel
            jurisdiction={session.jurisdiction}
            documentType={session.document_type}
            onResult={handleLookupResult}
          />
        )}
        {activeMode === "audio_companion" && (
          <AudioCompanionPanel
            jurisdiction={session.jurisdiction}
            documentType={session.document_type}
            session={session}
            onSessionUpdate={handleSessionUpdate}
          />
        )}
        {activeMode === "camera_scanner" && (
          <CameraScannerPanel
            jurisdiction={session.jurisdiction}
            documentType={session.document_type}
          />
        )}
        {activeMode === "bluff_detector" && (
          <BluffDetectorPanel
            jurisdiction={session.jurisdiction}
            documentType={session.document_type}
          />
        )}
        {activeMode === "progress_tracker" && (
          <ProgressTrackerPanel
            session={session}
            onSessionUpdate={handleSessionUpdate}
          />
        )}
      </div>

      {/* Floating Lookup Bar */}
      {activeMode !== "quick_lookup" && (
        <FloatingLookupBar
          jurisdiction={session.jurisdiction}
          documentType={session.document_type}
          onResult={handleLookupResult}
        />
      )}
    </div>
  );
}
