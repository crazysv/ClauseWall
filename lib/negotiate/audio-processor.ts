// ============================================
// AUDIO PROCESSOR — CLIENT-SIDE AUDIO CHUNKING
// Handles MediaRecorder + chunk creation
// ============================================

import { detectPressureTactic, detectAllTactics } from "./pressure-tactics";
import type { DetectedTactic, PressureTacticType } from "@/types";

// ============================================
// AUDIO RECORDING
// ============================================

/**
 * Start audio recording — request mic permission and create MediaRecorder
 */
export async function startAudioRecording(): Promise<{
  stream: MediaStream;
  recorder: MediaRecorder;
}> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 16000,
    },
  });

  // Try preferred codecs in order
  const mimeTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];

  let selectedMimeType = "";
  for (const mime of mimeTypes) {
    if (MediaRecorder.isTypeSupported(mime)) {
      selectedMimeType = mime;
      break;
    }
  }

  if (!selectedMimeType) {
    // Fallback — let browser choose
    selectedMimeType = "";
  }

  const recorder = new MediaRecorder(stream, {
    ...(selectedMimeType ? { mimeType: selectedMimeType } : {}),
    audioBitsPerSecond: 32000,
  });

  console.log(`[ClauseWall Audio] Recording with: ${recorder.mimeType}`);

  return { stream, recorder };
}

/**
 * Stop all tracks in a MediaStream
 */
export function stopMediaStream(stream: MediaStream | null): void {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
}

// ============================================
// AUDIO CHUNKING
// ============================================

interface ChunkerControls {
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
}

/**
 * Create an audio chunker that calls onChunk at regular intervals
 */
export function createAudioChunker(
  recorder: MediaRecorder,
  chunkDurationMs: number = 7000,
  onChunk: (blob: Blob) => void
): ChunkerControls {
  let chunks: Blob[] = [];
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let isPaused = false;

  // Collect audio data as it comes
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0 && !isPaused) {
      chunks.push(event.data);
    }
  };

  const flushChunks = () => {
    if (chunks.length === 0 || isPaused) return;

    const blob = new Blob(chunks, { type: recorder.mimeType });
    chunks = [];

    // Only send if blob has meaningful content (> 1KB)
    if (blob.size > 1024) {
      onChunk(blob);
    }
  };

  return {
    start: () => {
      isPaused = false;
      chunks = [];

      // Use timeslice to get data at intervals
      try {
        recorder.start(chunkDurationMs);
      } catch {
        // If timeslice not supported, manual chunking
        recorder.start();
      }

      // Manual interval as backup
      intervalId = setInterval(flushChunks, chunkDurationMs);
    },
    stop: () => {
      isPaused = false;

      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }

      // Flush remaining
      flushChunks();

      if (recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          // Already stopped
        }
      }

      chunks = [];
    },
    pause: () => {
      isPaused = true;

      if (recorder.state === "recording") {
        try {
          recorder.pause();
        } catch {
          // Pause not supported
        }
      }
    },
    resume: () => {
      isPaused = false;

      if (recorder.state === "paused") {
        try {
          recorder.resume();
        } catch {
          // Resume not supported
        }
      }
    },
  };
}

// ============================================
// TRANSCRIPTION PROCESSING
// ============================================

/**
 * Process transcription text for pressure tactics and bluff detection
 */
export function processTranscriptionResult(text: string): {
  detected_tactics: DetectedTactic[];
  detected_bluffs: string[];
} {
  if (!text || text.trim().length < 5) {
    return { detected_tactics: [], detected_bluffs: [] };
  }

  // Detect all tactics in the text
  const detected_tactics = detectAllTactics(text);

  // Extract texts that triggered false_legal_claim (for bluff checking)
  const detected_bluffs: string[] = [];
  for (const tactic of detected_tactics) {
    if (tactic.tactic_type === "false_legal_claim") {
      detected_bluffs.push(text); // Send full text for bluff check
    }
  }

  return { detected_tactics, detected_bluffs };
}

/**
 * Check if MediaRecorder is supported
 */
export function isMediaRecorderSupported(): boolean {
  if (typeof window === "undefined") return false;
  if (!navigator.mediaDevices) return false;
  if (typeof navigator.mediaDevices.getUserMedia !== "function") return false;
  if (typeof window.MediaRecorder === "undefined") return false;
  return true;
}
