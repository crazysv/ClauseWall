"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Settings, Volume2, Loader2 } from "lucide-react";
import { AudioWaveform } from "./audio-waveform";
import { TacticAlert } from "./tactic-alert";
import { speakAdvice, stopSpeaking } from "@/lib/negotiate/tts-engine";
import {
  startAudioRecording,
  stopMediaStream,
  createAudioChunker,
  isMediaRecorderSupported,
} from "@/lib/negotiate/audio-processor";
import type {
  NegotiationSession,
  AudioTranscriptionChunk,
  DetectedTactic,
  BluffAnalysis,
} from "@/types";

interface AudioCompanionPanelProps {
  jurisdiction: string;
  documentType: string;
  session: NegotiationSession;
  onSessionUpdate: (session: NegotiationSession) => void;
}

export function AudioCompanionPanel({
  jurisdiction,
  documentType,
  session,
  onSessionUpdate,
}: AudioCompanionPanelProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<AudioTranscriptionChunk[]>([]);
  const [activeTactics, setActiveTactics] = useState<(DetectedTactic & { bluff?: BluffAnalysis | null })[]>([]);
  const [language, setLanguage] = useState("en");
  const [chunkDuration, setChunkDuration] = useState(7000);
  const [autoWhisper, setAutoWhisper] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunkerRef = useRef<ReturnType<typeof createAudioChunker> | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  const handleChunk = useCallback(
    async (blob: Blob) => {
      setIsProcessing(true);

      try {
        const formData = new FormData();
        formData.append("audio", blob, "audio.webm");
        formData.append("language", language);
        formData.append("jurisdiction", jurisdiction);
        formData.append("document_type", documentType);

        const response = await fetch("/api/negotiate/live/transcribe", {
          method: "POST",
          body: formData,
          signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) throw new Error("Transcription failed");

        const data = await response.json();

        if (data.transcription) {
          const chunk: AudioTranscriptionChunk = {
            id: `chunk_${Date.now()}`,
            text: data.transcription,
            timestamp: data.timestamp || Date.now(),
            duration: 0,
            is_final: true,
            detected_tactics: data.detected_tactics || [],
            detected_bluffs: data.bluff_checks || [],
          };

          setTranscript((prev) => [...prev, chunk]);

          const updatedSession = {
            ...session,
            transcript_chunks: [...session.transcript_chunks, chunk],
            bluff_checks: [...session.bluff_checks, ...(data.bluff_checks || [])],
          };
          onSessionUpdate(updatedSession);

          if (data.detected_tactics && data.detected_tactics.length > 0) {
            const tacticsWithBluff = data.detected_tactics.map((t: DetectedTactic, i: number) => ({
              ...t,
              bluff: data.bluff_checks?.[i] || null,
            }));
            setActiveTactics((prev) => [...prev, ...tacticsWithBluff]);

            if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200]);
            }

            if (autoWhisper && data.detected_tactics[0]?.counter_response) {
              speakAdvice(data.detected_tactics[0].counter_response, { urgent: true });
            }
          }
        }
      } catch {
        // Silently handled
      } finally {
        setIsProcessing(false);
      }
    },
    [language, jurisdiction, documentType, session, onSessionUpdate, autoWhisper]
  );

  const startRecording = async () => {
    setError(null);

    if (!isMediaRecorderSupported()) {
      setError("Audio recording is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    try {
      const { stream, recorder } = await startAudioRecording();
      streamRef.current = stream;
      recorderRef.current = recorder;

      const chunker = createAudioChunker(recorder, chunkDuration, handleChunk);
      chunkerRef.current = chunker;

      chunker.start();
      setIsRecording(true);
      setIsPaused(false);
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError("Microphone permission denied. Please allow microphone access in your browser settings.");
      } else if (err.name === "NotFoundError") {
        setError("No microphone found. Please connect a microphone.");
      } else {
        setError(`Failed to start recording: ${err.message}`);
      }
    }
  };

  const stopRecording = () => {
    chunkerRef.current?.stop();
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    recorderRef.current = null;
    chunkerRef.current = null;
    setIsRecording(false);
    setIsPaused(false);
  };

  const togglePause = () => {
    if (isPaused) {
      chunkerRef.current?.resume();
      setIsPaused(false);
    } else {
      chunkerRef.current?.pause();
      setIsPaused(true);
    }
  };

  const dismissTactic = (index: number) => {
    setActiveTactics((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSpeak = (text: string) => {
    speakAdvice(text, { urgent: true });
  };

  return (
    <div className="space-y-5">
      {/* Tactic Alerts */}
      {activeTactics.map((tactic, index) => (
        <TacticAlert
          key={`tactic-${index}-${tactic.tactic_type}`}
          tactic={tactic}
          bluffCheck={tactic.bluff || null}
          onDismiss={() => dismissTactic(index)}
          onSpeak={handleSpeak}
        />
      ))}

      {/* Status & Record Button */}
      <div className="flex flex-col items-center gap-5 py-6 bg-white dark:bg-card border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 rounded-2xl">
        {/* Status text */}
        <div className="text-center">
          {!isRecording && !error && (
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Tap to start analyzing</p>
          )}
          {isRecording && !isPaused && (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
              <p className="text-sm font-bold text-red-600 uppercase tracking-widest">Listening...</p>
              {isProcessing && (
                <Loader2 className="w-4 h-4 text-red-400 animate-spin ml-1" />
              )}
            </div>
          )}
          {isRecording && isPaused && (
            <p className="text-sm font-bold text-orange-600 uppercase tracking-widest">Paused</p>
          )}
          {error && (
            <p className="text-sm font-medium text-red-600 max-w-xs text-center border bg-red-50 border-red-200 p-2 rounded-lg">{error}</p>
          )}
        </div>

        {/* Waveform */}
        {isRecording && (
          <div className="w-full max-w-[200px] border border-slate-100 rounded-xl p-1 bg-slate-50 dark:bg-slate-800 shadow-inner">
             <AudioWaveform
               stream={streamRef.current}
               isRecording={isRecording && !isPaused}
             />
          </div>
        )}

        {/* Record Button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          onContextMenu={(e) => {
            e.preventDefault();
            if (isRecording) togglePause();
          }}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl hover:scale-105 active:scale-95 border-4 ${
            isRecording
              ? isPaused
                ? "bg-orange-50 border-orange-200 text-orange-600"
                : "bg-red-50 border-red-200 text-red-600 animate-[pulse_2s_ease-in-out_infinite]"
              : "bg-indigo-600 border-indigo-200 text-white"
          }`}
          style={{ minWidth: "96px", minHeight: "96px" }}
        >
          {isRecording ? (
             <MicOff className="w-10 h-10" />
          ) : (
            <Mic className="w-10 h-10" />
          )}
        </button>

        {isRecording && (
          <p className="text-xs font-bold text-slate-400">Long press to pause</p>
        )}
      </div>

      {/* Language & Settings */}
      <div className="flex items-center justify-between px-2">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="text-sm font-bold bg-white dark:bg-card border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 rounded-xl px-4 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 min-w-[120px] cursor-pointer"
          style={{ fontSize: "16px" }}
        >
          <option value="en">English (EN)</option>
          <option value="hi">Hindi (HI)</option>
          <option value="ta">Tamil (TA)</option>
          <option value="te">Telugu (TE)</option>
          <option value="kn">Kannada (KN)</option>
          <option value="ml">Malayalam (ML)</option>
          <option value="mr">Marathi (MR)</option>
          <option value="bn">Bengali (BN)</option>
          <option value="gu">Gujarati (GU)</option>
        </select>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-3 bg-white dark:bg-card border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 shadow-md bg-white dark:bg-card p-5 space-y-4 animate-in fade-in duration-200">
           <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-2">Options</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Audio Chunk Buffer</span>
            <select
              value={chunkDuration}
              onChange={(e) => setChunkDuration(Number(e.target.value))}
              className="text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 rounded-lg px-3 py-1.5 text-indigo-700"
              style={{ fontSize: "16px" }}
            >
              <option value={5000}>5 sec (Fast)</option>
              <option value={7000}>7 sec (Balanced)</option>
              <option value={10000}>10 sec (Accurate)</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Auto-speak responses via Audio</span>
            <button
              onClick={() => setAutoWhisper(!autoWhisper)}
              className={`w-12 h-6 rounded-full transition-colors flex items-center shadow-inner ${
                autoWhisper ? "bg-teal-500" : "bg-slate-300"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white dark:bg-card shadow-md transition-transform transform ${ autoWhisper ? "translate-x-6" : "translate-x-1" }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Live Transcript */}
      {transcript.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Live Transcript</p>
          <div className="max-h-[300px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner bg-slate-50 dark:bg-slate-800 p-4 space-y-3 scroll-smooth">
            {transcript.map((chunk) => (
              <div key={chunk.id} className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-card p-3 rounded-lg border border-slate-100 shadow-sm dark:shadow-slate-900/20 leading-relaxed">
                <span className="inline-block text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded mr-2 uppercase">
                  {new Date(chunk.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                {chunk.text}
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm dark:shadow-slate-900/20 flex items-center justify-center gap-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            🔒 Audio is processed entirely locally and never stored.
          </p>
      </div>
    </div>
  );
}
