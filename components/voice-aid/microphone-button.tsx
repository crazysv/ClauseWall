"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, Square, Loader2 } from "lucide-react";

interface Props {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  disabled?: boolean;
}

export default function MicrophoneButton({
  isListening,
  isProcessing,
  isSpeaking,
  onStartListening,
  onStopListening,
  disabled = false,
}: Props) {
  const [amplitude, setAmplitude] = useState(0);
  const animRef = useRef<number | null>(null);

  // Simulate waveform animation when listening
  useEffect(() => {
    if (isListening) {
      const animate = () => {
        setAmplitude(0.3 + Math.random() * 0.7);
        animRef.current = requestAnimationFrame(animate);
      };
      animRef.current = requestAnimationFrame(animate);
      return () => {
        if (animRef.current) cancelAnimationFrame(animRef.current);
      };
    } else {
      setAmplitude(0);
    }
  }, [isListening]);

  const handlePress = useCallback(() => {
    if (disabled || isProcessing || isSpeaking) return;
    if (isListening) {
      onStopListening();
    } else {
      onStartListening();
    }
  }, [
    isListening,
    isProcessing,
    isSpeaking,
    disabled,
    onStartListening,
    onStopListening,
  ]);

  // Determine button state
  const buttonColor = isListening
    ? "bg-red-500 shadow-red-500/40"
    : isProcessing
      ? "bg-amber-500 shadow-amber-500/30"
      : isSpeaking
        ? "bg-blue-500 shadow-blue-500/30"
        : "bg-emerald-500 shadow-emerald-500/30 hover:bg-emerald-400";

  const pulseRings = isListening ? 3 : isSpeaking ? 2 : 0;

  return (
    <div className="relative flex items-center justify-center">
      {/* Pulse rings */}
      {Array.from({ length: pulseRings }).map((_, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full border-2 ${
            isListening ? "border-red-500/30" : "border-blue-500/20"
          }`}
          initial={{ width: 80, height: 80, opacity: 0.6 }}
          animate={{
            width: 80 + (i + 1) * (isListening ? 30 * amplitude : 20),
            height: 80 + (i + 1) * (isListening ? 30 * amplitude : 20),
            opacity: 0.4 - i * 0.1,
          }}
          transition={{
            duration: isListening ? 0.15 : 1,
            repeat: isListening ? 0 : Infinity,
            repeatType: "reverse",
            ease: "easeOut",
          }}
        />
      ))}

      {/* Main button */}
      <motion.button
        onClick={handlePress}
        disabled={disabled}
        whileTap={{ scale: 0.92 }}
        className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${buttonColor} ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer active:scale-95"
        }`}
        aria-label={
          isListening
            ? "Stop listening"
            : isProcessing
              ? "Processing..."
              : isSpeaking
                ? "Speaking..."
                : "Start listening"
        }
        id="voice-mic-button"
      >
        {isProcessing ? (
          <Loader2 className="h-8 w-8 text-white animate-spin" />
        ) : isListening ? (
          <Square className="h-7 w-7 text-white" fill="white" />
        ) : (
          <Mic className="h-8 w-8 text-white" />
        )}
      </motion.button>

      {/* Status label */}
      <div className="absolute -bottom-7 whitespace-nowrap">
        <span className="text-xs font-medium text-white/60">
          {isListening
            ? "🔴 Listening..."
            : isProcessing
              ? "⏳ Processing..."
              : isSpeaking
                ? "🔊 Speaking..."
                : "🎤 Tap to speak"}
        </span>
      </div>
    </div>
  );
}
