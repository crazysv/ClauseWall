"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X, Volume2, VolumeX, Loader2 } from "lucide-react";
import { useVoice } from "@/lib/voice/voice-context";
import { parseCommand } from "@/lib/voice/command-parser";
import { toast } from "sonner";

interface MicButtonProps {
  documentId?: string;
  onCommand?: (intent: string, params: Record<string, any>) => void;
}

export default function MicButton({ documentId, onCommand }: MicButtonProps) {
  const {
    isListening,
    isSpeaking,
    transcript,
    interimTranscript,
    language,
    isSupported,
    error,
    startVoice,
    stopVoice,
    speak,
    stopSpeak,
    clearTranscript,
    clearError,
  } = useVoice();

  const [processing, setProcessing] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isSupported) return null;

  const handleMicClick = () => {
    if (isListening) {
      stopVoice();
    } else {
      clearTranscript();
      clearError();
      setLastAnswer(null);
      startVoice();
      setShowPanel(true);
    }
  };

  // Process transcript when it's final
  const handleProcess = async () => {
    if (!transcript) return;

    const command = parseCommand(transcript);

    if (command.intent !== "QUESTION" && onCommand) {
      onCommand(command.intent, command.params);
      toast.success(`🎤 ${command.intent.replace(/_/g, " ")}`);
      clearTranscript();
      return;
    }

    // It's a question — send to AI
    setProcessing(true);
    try {
      const res = await fetch("/api/voice/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: transcript,
          documentId,
          language: language.code,
        }),
      });
      const data = await res.json();

      if (data.answer) {
        setLastAnswer(data.answer);
        speak(data.answer, data.language === "en" ? "en-IN" : "hi-IN");
      }
    } catch (err) {
      toast.error("Voice response failed");
    } finally {
      setProcessing(false);
    }
  };

  // Auto-process when transcript is set
  if (transcript && !processing && !lastAnswer) {
    handleProcess();
  }

  return (
    <>
      {/* Floating Mic Button */}
      <motion.button
        onClick={handleMicClick}
        whileTap={{ scale: 0.9 }}
        className={`fixed bottom-24 right-6 z-50 w-14 h-14 rounded-none border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center transition-all ${
          isListening
            ? "bg-red-500 animate-pulse hover:shadow-none hover:-translate-y-1"
            : isSpeaking
              ? "bg-blue-500 hover:shadow-none hover:-translate-y-1"
              : "bg-orange-500 hover:shadow-none hover:-translate-y-1"
        }`}
      >
        {isListening ? (
          <Mic className="h-6 w-6 text-black animate-bounce stroke-[3px]" />
        ) : isSpeaking ? (
          <Volume2 className="h-6 w-6 text-black stroke-[3px]" />
        ) : (
          <Mic className="h-6 w-6 text-black stroke-[3px]" />
        )}

        {/* Pulse rings when listening */}
        {isListening && (
          <>
            <span className="absolute w-full h-full rounded-full bg-red-500/30 animate-ping" />
            <span className="absolute w-[120%] h-[120%] rounded-full bg-red-500/10 animate-pulse" />
          </>
        )}
      </motion.button>

      {/* Voice Panel */}
      <AnimatePresence>
        {showPanel &&
          (isListening ||
            interimTranscript ||
            transcript ||
            lastAnswer ||
            processing ||
            error) && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-44 right-6 z-50 w-80 bg-background text-foreground border-4 border-foreground rounded-none p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            >
              {/* Close */}
              <button
                onClick={() => {
                  setShowPanel(false);
                  stopVoice();
                  stopSpeak();
                  clearTranscript();
                  setLastAnswer(null);
                }}
                className="absolute top-2 right-2 p-1 text-gray-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Language badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{language.flag}</span>
                <span className="text-xs text-gray-400">{language.label}</span>
                {isListening && (
                  <span className="flex items-center gap-1 text-xs text-red-400">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Listening...
                  </span>
                )}
              </div>

              {/* Interim transcript */}
              {isListening && interimTranscript && (
                <p className="text-sm text-gray-400 italic mb-2">
                  {interimTranscript}
                </p>
              )}

              {/* Final transcript */}
              {transcript && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">You said:</p>
                  <p className="text-sm text-foreground bg-muted p-2 border-2 border-foreground font-mono font-bold">
                    &quot;{transcript}&quot;
                  </p>
                </div>
              )}

              {/* Processing */}
              {processing && (
                <div className="flex items-center gap-2 text-blue-400 mb-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs">Processing...</span>
                </div>
              )}

              {/* Answer */}
              {lastAnswer && (
                <div className="mb-2">
                  <p className="text-xs text-gray-500 mb-1">ClauseWall:</p>
                  <p className="text-sm text-foreground bg-muted p-2 rounded-none border-2 border-foreground leading-relaxed font-bold font-mono">
                    {lastAnswer}
                  </p>
                </div>
              )}

              {/* Speaking control */}
              {isSpeaking && (
                <button
                  onClick={stopSpeak}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white mt-1"
                >
                  <VolumeX className="h-3.5 w-3.5" />
                  Stop speaking
                </button>
              )}

              {/* Error */}
              {error && <p className="text-xs text-red-400 mt-2">{error}</p>}

              {/* Ask again */}
              {(lastAnswer || error) && !isListening && !isSpeaking && (
                <button
                  onClick={() => {
                    clearTranscript();
                    clearError();
                    setLastAnswer(null);
                    startVoice();
                  }}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-none bg-orange-500 border-2 border-black text-black font-black uppercase tracking-wider text-xs hover:bg-orange-600 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <Mic className="h-3.5 w-3.5" />
                  {error ? "Try again" : "Ask another question"}
                </button>
              )}
            </motion.div>
          )}
      </AnimatePresence>
    </>
  );
}
