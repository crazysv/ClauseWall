"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ArrowLeft, Mic, MicOff, Handshake } from "lucide-react";
import Link from "next/link";
import { SessionSetup } from "./session-setup";
import { QuickLookupPanel } from "./quick-lookup-panel";
import { AudioCompanionPanel } from "./audio-companion-panel";
import { CameraScannerPanel } from "./camera-scanner-panel";
import { BluffDetectorPanel } from "./bluff-detector-panel";
import { ProgressTrackerPanel } from "./progress-tracker-panel";
import { FloatingLookupBar } from "./floating-lookup-bar";
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
  activeColor: string;
  borderColor: string;
}[] = [
  { id: "quick_lookup", icon: "📝", label: "Lookup", activeColor: "text-indigo-700 bg-indigo-50", borderColor: "border-indigo-500" },
  { id: "audio_companion", icon: "🎤", label: "Audio", activeColor: "text-teal-700 bg-teal-50", borderColor: "border-teal-500" },
  { id: "camera_scanner", icon: "📷", label: "Camera", activeColor: "text-blue-700 bg-blue-50", borderColor: "border-blue-500" },
  { id: "bluff_detector", icon: "🔍", label: "Bluff", activeColor: "text-red-700 bg-red-50", borderColor: "border-red-500" },
  { id: "progress_tracker", icon: "📊", label: "Progress", activeColor: "text-purple-700 bg-purple-50", borderColor: "border-purple-500" },
];

export function NegotiationCompanion() {
  const [session, setSession] = useState<NegotiationSession | null>(null);
  const [activeMode, setActiveMode] = useState<NegotiationMode>("quick_lookup");
  const [showSetup, setShowSetup] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    const latest = loadLatestSession();
    if (latest) {
      const hoursSince = (Date.now() - new Date(latest.started_at).getTime()) / (1000 * 60 * 60);
      if (hoursSince < 4) {
        setSession(latest);
        setShowSetup(false);
        startTimer(new Date(latest.started_at));
      }
    }
  }, []);

  useEffect(() => {
    if (session && !showSetup) {
      requestWakeLock();
    }
    return () => {
      releaseWakeLock();
    };
  }, [session, showSetup]);

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
      // Ignore
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
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
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
    [session, handleSessionUpdate]
  );

  if (showSetup || !session) {
    return <SessionSetup onSessionStart={handleSessionStart} existingSessions={getAllSessions()} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 flex flex-col font-sans" style={{ paddingBottom: "100px" }}>
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-white dark:bg-card border-b border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-[140px] sm:max-w-none">
                {session.entity_name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                  <span className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold rounded uppercase">
                     {session.document_type}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono font-bold tracking-tight">
                    {formatTime(elapsedTime)}
                  </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleEndSession}
            className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition-colors shadow-sm dark:shadow-slate-900/20"
          >
            End Protocol
          </button>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="sticky top-[61px] z-30 bg-white dark:bg-card border-b border-slate-200 dark:border-slate-700 px-2 pt-3 pb-0 shadow-sm dark:shadow-slate-900/20">
        <div className="flex gap-2 max-w-2xl mx-auto justify-center overflow-x-auto no-scrollbar pb-0">
          {MODE_CONFIG.map((mode) => {
             const isActive = activeMode === mode.id;
             return (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`flex flex-col items-center gap-1.5 px-4 py-2 pt-3 rounded-t-xl transition-all border-b-2 min-w-[70px] ${
                isActive
                  ? `${mode.activeColor} ${mode.borderColor}`
                  : "text-slate-500 hover:bg-slate-50 border-transparent hover:text-slate-700"
              }`}
            >
              <span className="text-lg md:text-xl lg:text-2xl leading-none block">{mode.icon}</span>
              <span
                className={`text-[10px] uppercase tracking-wider font-bold ${
                  isActive ? "opacity-100" : "opacity-60"
                }`}
              >
                {mode.label}
              </span>
            </button>
             )
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
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
