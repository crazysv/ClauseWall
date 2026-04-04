"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  CameraOff,
  RotateCcw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  startCameraStream,
  stopCameraStream,
  captureFrame,
  isCameraSupported,
} from "@/lib/negotiate/camera-processor";
import type { CameraClause, RiskLevel } from "@/types";

interface CameraScannerPanelProps {
  jurisdiction: string;
  documentType: string;
}

const RISK_COLORS: Record<
  RiskLevel,
  { bg: string; text: string; border: string }
> = {
  safe: {
    bg: "bg-green-500/5",
    text: "text-green-400",
    border: "border-green-500/20",
  },
  warning: {
    bg: "bg-yellow-500/5",
    text: "text-yellow-400",
    border: "border-yellow-500/20",
  },
  dangerous: {
    bg: "bg-red-500/5",
    text: "text-red-400",
    border: "border-red-500/20",
  },
  illegal: {
    bg: "bg-purple-500/5",
    text: "text-purple-400",
    border: "border-purple-500/20",
  },
};

const RISK_ICONS: Record<RiskLevel, React.ReactNode> = {
  safe: <CheckCircle2 className="w-4 h-4 text-green-400" />,
  warning: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
  dangerous: <XCircle className="w-4 h-4 text-red-400" />,
  illegal: <XCircle className="w-4 h-4 text-purple-400" />,
};

export default function CameraScannerPanel({
  jurisdiction,
  documentType,
}: CameraScannerPanelProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [clauses, setClauses] = useState<CameraClause[]>([]);
  const [extractedText, setExtractedText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [autoScan, setAutoScan] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const autoScanRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Auto-scan interval
  useEffect(() => {
    if (autoScan && cameraActive) {
      autoScanRef.current = setInterval(handleScan, 4000);
    } else {
      if (autoScanRef.current) {
        clearInterval(autoScanRef.current);
        autoScanRef.current = null;
      }
    }
    return () => {
      if (autoScanRef.current) clearInterval(autoScanRef.current);
    };
  }, [autoScan, cameraActive]);

  const startCamera = async () => {
    setError(null);

    if (!isCameraSupported()) {
      setError("Camera is not supported in this browser.");
      return;
    }

    try {
      if (!videoRef.current) return;
      const stream = await startCameraStream(videoRef.current);
      streamRef.current = stream;
      setCameraActive(true);
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError(
          "Camera permission denied. Please allow camera access in your browser settings.",
        );
      } else if (err.name === "NotFoundError") {
        setError("No camera found on this device.");
      } else {
        setError(`Failed to start camera: ${err.message}`);
      }
    }
  };

  const stopCamera = () => {
    stopCameraStream(streamRef.current);
    streamRef.current = null;
    setCameraActive(false);
    setAutoScan(false);
    if (autoScanRef.current) {
      clearInterval(autoScanRef.current);
      autoScanRef.current = null;
    }
  };

  const handleScan = useCallback(async () => {
    if (!videoRef.current || scanning) return;

    setScanning(true);
    setError(null);

    try {
      const base64 = captureFrame(videoRef.current);

      // Convert base64 to blob for FormData
      const byteCharacters = atob(base64);
      const byteArrays = [];
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        byteArrays.push(new Uint8Array(byteNumbers));
      }
      const blob = new Blob(byteArrays, { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("image", blob, "scan.jpg");
      formData.append("jurisdiction", jurisdiction);
      formData.append("document_type", documentType);

      const response = await fetch("/api/negotiate/live/camera-ocr", {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(20000),
      });

      if (!response.ok) throw new Error("Scan failed");

      const data = await response.json();

      if (data.extracted_text) {
        setExtractedText(data.extracted_text);
        setClauses(data.clauses || []);
      } else {
        setError(
          data.message ||
            "No text detected. Try adjusting the angle or lighting.",
        );
      }
    } catch (err) {
      console.error("Scan error:", err);
      setError("Scan failed. Please try again.");
    } finally {
      setScanning(false);
    }
  }, [scanning, jurisdiction, documentType]);

  return (
    <div className="space-y-4">
      {/* Camera Viewfinder */}
      <div className="relative rounded-2xl overflow-hidden bg-black/50 border border-white/10">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full aspect-[4/3] object-cover ${cameraActive ? "" : "hidden"}`}
        />

        {/* Camera Off State */}
        {!cameraActive && (
          <div className="w-full aspect-[4/3] flex flex-col items-center justify-center gap-3 p-6">
            <Camera className="w-12 h-12 text-white/10" />
            <p className="text-sm text-white/30 text-center">
              Point your camera at the contract to scan for risky clauses
            </p>
            <button
              onClick={startCamera}
              className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-medium transition-colors flex items-center gap-2"
              style={{ minHeight: "48px" }}
            >
              <Camera className="w-5 h-5" />
              Start Camera
            </button>
            {error && (
              <p className="text-xs text-red-400 text-center mt-2">{error}</p>
            )}
          </div>
        )}

        {/* Camera Controls Overlay */}
        {cameraActive && (
          <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={stopCamera}
                className="p-2.5 rounded-xl bg-white/10 text-white/60 hover:text-white transition-colors"
                style={{ minWidth: "44px", minHeight: "44px" }}
              >
                <CameraOff className="w-5 h-5" />
              </button>

              <button
                onClick={handleScan}
                disabled={scanning}
                className="flex-1 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ minHeight: "48px" }}
              >
                {scanning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Scanning...
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" /> Scan
                  </>
                )}
              </button>

              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoScan}
                  onChange={(e) => setAutoScan(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-8 h-4 rounded-full transition-colors ${
                    autoScan ? "bg-cyan-500" : "bg-white/10"
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${
                      autoScan ? "translate-x-[18px]" : "translate-x-0.5"
                    }`}
                    style={{ marginTop: "1px" }}
                  />
                </div>
                <span className="text-[10px] text-white/40">Auto</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && cameraActive && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400/50 hover:text-red-400"
          >
            ×
          </button>
        </div>
      )}

      {/* Results */}
      {clauses.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-white/30 font-medium px-1">
            {clauses.length} clause{clauses.length !== 1 ? "s" : ""} detected
          </p>
          {clauses.map((clause, idx) => {
            const colors = RISK_COLORS[clause.risk_level] || RISK_COLORS.safe;
            const icon = RISK_ICONS[clause.risk_level] || RISK_ICONS.safe;

            return (
              <div
                key={idx}
                className={`rounded-xl border ${colors.border} ${colors.bg} p-4 space-y-2`}
              >
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex-shrink-0">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-medium ${colors.text} uppercase`}
                      >
                        {clause.risk_level}
                      </span>
                      {clause.clause_type && (
                        <span className="text-[10px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded">
                          {clause.clause_type.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed line-clamp-3">
                      {clause.text}
                    </p>
                    {clause.risk_reason &&
                      clause.risk_reason !== "No specific risk identified" && (
                        <p
                          className={`text-xs ${colors.text} mt-1.5 opacity-80`}
                        >
                          ⚠️ {clause.risk_reason}
                        </p>
                      )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Privacy Notice */}
      <p className="text-[10px] text-white/15 text-center px-4">
        🔒 Camera frames are processed in real-time and never stored
      </p>
    </div>
  );
}
