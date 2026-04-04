"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Settings, Volume2, Loader2 } from "lucide-react";
import AudioWaveform from "./audio-waveform";
import TacticAlert from "./tactic-alert";
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

export default function AudioCompanionPanel({
  jurisdiction,
  documentType,
  session,
  onSessionUpdate,
}: AudioCompanionPanelProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<AudioTranscriptionChunk[]>([]);
  const [activeTactics, setActiveTactics] = useState<
    (DetectedTactic & { bluff?: BluffAnalysis | null })[]
  >([]);
  const [language, setLanguage] = useState("en");
  const [chunkDuration, setChunkDuration] = useState(7000);
  const [autoWhisper, setAutoWhisper] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunkerRef = useRef<ReturnType<typeof createAudioChunker> | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Cleanup on unmount
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

          // Update session with new chunk
          const updatedSession = {
            ...session,
            transcript_chunks: [...session.transcript_chunks, chunk],
            bluff_checks: [
              ...session.bluff_checks,
              ...(data.bluff_checks || []),
            ],
          };
          onSessionUpdate(updatedSession);

          // Handle detected tactics
          if (data.detected_tactics && data.detected_tactics.length > 0) {
            const tacticsWithBluff = data.detected_tactics.map(
              (t: DetectedTactic, i: number) => ({
                ...t,
                bluff: data.bluff_checks?.[i] || null,
              }),
            );
            setActiveTactics((prev) => [...prev, ...tacticsWithBluff]);

            // Vibrate on tactic detection
            if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200]);
            }

            // Auto-whisper if enabled
            if (autoWhisper && data.detected_tactics[0]?.counter_response) {
              speakAdvice(data.detected_tactics[0].counter_response, {
                urgent: true,
              });
            }
          }
        }
      } catch (err) {
        console.error("Chunk processing error:", err);
      } finally {
        setIsProcessing(false);
      }
    },
    [
      language,
      jurisdiction,
      documentType,
      session,
      onSessionUpdate,
      autoWhisper,
    ],
  );

  const startRecording = async () => {
    setError(null);

    if (!isMediaRecorderSupported()) {
      setError(
        "Audio recording is not supported in this browser. Please use Chrome or Edge.",
      );
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
        setError(
          "Microphone permission denied. Please allow microphone access in your browser settings.",
        );
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
    <div className="space-y-4">
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
      <div className="flex flex-col items-center gap-4 py-4">
        {/* Status text */}
        <div className="text-center">
          {!isRecording && !error && (
            <p className="text-sm text-foreground">Tap to start listening</p>
          )}
          {isRecording && !isPaused && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <p className="text-sm text-red-400">Listening...</p>
              {isProcessing && (
                <Loader2 className="w-3 h-3 text-foreground animate-spin" />
              )}
            </div>
          )}
          {isRecording && isPaused && (
            <p className="text-sm text-orange-400">Paused</p>
          )}
          {error && (
            <p className="text-sm text-red-400 max-w-xs text-center">{error}</p>
          )}
        </div>

        {/* Waveform */}
        {isRecording && (
          <AudioWaveform
            stream={streamRef.current}
            isRecording={isRecording && !isPaused}
          />
        )}

        {/* Record Button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          onContextMenu={(e) => {
            e.preventDefault();
            if (isRecording) togglePause();
          }}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none ${isRecording ? (isPaused ? "bg-orange-500/20 border-2 border-orange-500/40 text-orange-400" : "bg-red-500/20 border-2 border-red-500/40 text-red-400 animate-pulse") : "bg-green-500/10 border-2 border-green-500/30 text-green-400 hover:bg-green-500/20"}`}
          style={{ minWidth: "80px", minHeight: "80px" }}
        >
          {isRecording ? (
            <MicOff className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </button>

        {isRecording && (
          <p className="text-[10px] text-foreground">Long press to pause</p>
        )}
      </div>

      {/* Language & Settings */}
      <div className="flex items-center justify-between px-2">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="text-xs bg-white/[0.03] border border-foreground border-2 rounded-none px-2 py-1.5 text-foreground focus:outline-none"
          style={{ fontSize: "16px" }}
        >
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="ta">Tamil</option>
          <option value="te">Telugu</option>
          <option value="kn">Kannada</option>
          <option value="ml">Malayalam</option>
          <option value="mr">Marathi</option>
          <option value="bn">Bengali</option>
          <option value="gu">Gujarati</option>
        </select>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-none text-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="rounded-none border border-foreground border-2 bg-white/[0.02] p-4 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground">Chunk Duration</span>
            <select
              value={chunkDuration}
              onChange={(e) => setChunkDuration(Number(e.target.value))}
              className="text-xs bg-white/[0.03] border border-foreground border-2 rounded px-2 py-1 text-foreground"
              style={{ fontSize: "16px" }}
            >
              <option value={5000}>5 seconds</option>
              <option value={7000}>7 seconds</option>
              <option value={10000}>10 seconds</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground">
              Auto-whisper counters
            </span>
            <button
              onClick={() => setAutoWhisper(!autoWhisper)}
              className={`w-10 h-5 rounded-full transition-colors ${autoWhisper ? "bg-green-500" : "bg-muted"}`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${autoWhisper ? "translate-x-5" : "translate-x-0.5"}`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Live Transcript */}
      {transcript.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-foreground font-medium px-1">Transcript</p>
          <div className="max-h-60 overflow-y-auto rounded-none border border-foreground border-2 bg-white/[0.01] p-3 space-y-2 scroll-smooth">
            {transcript.map((chunk) => (
              <div key={chunk.id} className="text-sm text-foreground">
                <span className="text-[10px] text-foreground font-mono mr-2">
                  {new Date(chunk.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {chunk.text}
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <p className="text-[10px] text-foreground text-center px-4">
        🔒 Audio is transcribed in real-time and never stored on our servers
      </p>
    </div>
  );
}
