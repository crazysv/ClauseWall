"use client";

import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Camera, Loader2, X } from "lucide-react";

interface Props {
  onCapture: (photo: Blob) => void;
  disabled?: boolean;
}

export default function CameraCaptureButton({ onCapture, disabled = false }: Props) {
  const [showPreview, setShowPreview] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturing, setCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      setStream(mediaStream);
      setShowPreview(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("[ClauseWall] Camera access denied:", error);
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    setCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCapture(blob);
        }
        stopCamera();
        setCapturing(false);
      },
      "image/jpeg",
      0.85
    );
  }, [onCapture]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setShowPreview(false);
  }, [stream]);

  if (showPreview) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 z-50 bg-black flex flex-col"
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="flex-1 w-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        <div className="absolute bottom-0 left-0 right-0 p-6 flex items-center justify-center gap-8 bg-gradient-to-t from-black/80 to-transparent">
          <button
            onClick={stopCamera}
            className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center"
            aria-label="Close camera"
          >
            <X className="h-5 w-5 text-white" />
          </button>

          <button
            onClick={capturePhoto}
            disabled={capturing}
            className="w-16 h-16 rounded-full bg-white border-4 border-white/30 flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Take photo"
            id="voice-capture-photo"
          >
            {capturing ? (
              <Loader2 className="h-6 w-6 text-black animate-spin" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white" />
            )}
          </button>

          <div className="w-12 h-12" /> {/* Spacer for centering */}
        </div>

        <div className="absolute top-6 left-0 right-0 text-center">
          <p className="text-white text-sm font-medium bg-black/40 inline-block px-4 py-1 rounded-full">
            📸 Contract photo lelo
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={startCamera}
      disabled={disabled}
      className={`w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      aria-label="Take photo of contract"
      id="voice-camera-button"
    >
      <Camera className="h-6 w-6 text-white/70" />
    </motion.button>
  );
}
