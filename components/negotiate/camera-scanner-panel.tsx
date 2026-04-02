"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, CameraOff, RotateCcw, Loader2, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { startCameraStream, stopCameraStream, captureFrame, isCameraSupported } from "@/lib/negotiate/camera-processor";
import type { CameraClause, RiskLevel } from "@/types";

interface CameraScannerPanelProps {
  jurisdiction: string;
  documentType: string;
}

const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  safe: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  warning: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  dangerous: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  illegal: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
};

const RISK_ICONS: Record<RiskLevel, React.ReactNode> = {
  safe: <CheckCircle2 className="w-5 h-5 text-green-600" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
  dangerous: <XCircle className="w-5 h-5 text-red-600" />,
  illegal: <XCircle className="w-5 h-5 text-indigo-600" />,
};

export function CameraScannerPanel({ jurisdiction, documentType }: CameraScannerPanelProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [clauses, setClauses] = useState<CameraClause[]>([]);
  const [extractedText, setExtractedText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [autoScan, setAutoScan] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const autoScanRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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
        setError("Camera permission denied. Please allow camera access in your browser settings.");
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
        setError(data.message || "No text detected. Try adjusting the angle or lighting.");
      }
    } catch (err) {
      setError("Scan failed. Please try again.");
    } finally {
      setScanning(false);
    }
  }, [scanning, jurisdiction, documentType]);

  return (
    <div className="space-y-4">
      {/* Camera Viewfinder */}
      <div className="relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full aspect-[4/3] object-cover ${cameraActive ? "" : "hidden"}`}
        />

        {/* Camera Off State */}
        {!cameraActive && (
          <div className="w-full aspect-[4/3] flex flex-col items-center justify-center gap-4 p-6 bg-slate-50 dark:bg-slate-800">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center shadow-sm dark:shadow-slate-900/20">
                <Camera className="w-8 h-8 text-slate-500 dark:text-slate-400" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium text-center">
              Point your camera at the contract to scan for risky clauses
            </p>
            <button
              onClick={startCamera}
              className="px-4 md:px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-slate-900 dark:text-slate-100 font-bold transition-all shadow-md flex items-center gap-2"
              style={{ minHeight: "48px" }}
            >
              <Camera className="w-5 h-5" />
              Start Scanner
            </button>
            {error && <p className="text-xs font-semibold text-red-600 text-center mt-2">{error}</p>}
          </div>
        )}

        {/* Camera Controls Overlay */}
        {cameraActive && (
          <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-900/90 to-transparent">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={stopCamera}
                className="p-3 rounded-xl bg-white dark:bg-card/20 hover:bg-white dark:bg-card/30 text-slate-900 dark:text-slate-100 backdrop-blur-md transition-all shadow-sm dark:shadow-slate-900/20"
                style={{ minWidth: "48px", minHeight: "48px" }}
              >
                <CameraOff className="w-5 h-5" />
              </button>

              <button
                onClick={handleScan}
                disabled={scanning}
                className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-slate-900 dark:text-slate-100 font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                style={{ minHeight: "48px" }}
              >
                {scanning ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Scanning...</>
                ) : (
                  <><Camera className="w-5 h-5" /> Tap to Scan</>
                )}
              </button>

              <label className="flex flex-col items-center justify-center gap-1 cursor-pointer bg-white dark:bg-card/20 backdrop-blur-md px-3 rounded-xl shadow-sm dark:shadow-slate-900/20 transition-all hover:bg-white dark:bg-card/30 h-12">
                 <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={autoScan}
                      onChange={(e) => setAutoScan(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-8 h-4 rounded-full transition-colors ${
                        autoScan ? "bg-teal-500" : "bg-slate-400/50"
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 transition-transform ${ autoScan ? "translate-x-[18px]" : "translate-x-0.5" }`}
                        style={{ marginTop: "1px" }}
                      />
                    </div>
                </div>
                <span className="text-[10px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Auto</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && cameraActive && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm dark:shadow-slate-900/20 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm font-medium text-red-800">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Results */}
      {clauses.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
            {clauses.length} clause{clauses.length !== 1 ? "s" : ""} detected
          </p>
          {clauses.map((clause, idx) => {
            const colors = RISK_COLORS[clause.risk_level] || RISK_COLORS.safe;
            const icon = RISK_ICONS[clause.risk_level] || RISK_ICONS.safe;

            return (
              <div
                key={idx}
                className={`rounded-xl border ${colors.border} ${colors.bg} p-5 space-y-3 shadow-sm dark:shadow-slate-900/20`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex-shrink-0">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                       <span className={`text-xs font-bold ${colors.text} uppercase badge rounded-full px-2 py-0.5 border ${colors.border} bg-white dark:bg-slate-900/50`}>
                        {clause.risk_level}
                      </span>
                      {clause.clause_type && (
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-card border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 px-2 py-0.5 rounded-full uppercase">
                          {clause.clause_type.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                      {clause.text}
                    </p>
                    {clause.risk_reason && clause.risk_reason !== "No specific risk identified" && (
                      <div className={`mt-3 p-3 rounded-xl bg-white dark:bg-card/60 border ${colors.border}`}>
                          <p className={`text-xs font-semibold ${colors.text}`}>
                            ⚠️ {clause.risk_reason}
                          </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Privacy Notice */}
      <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm dark:shadow-slate-900/20 flex items-center justify-center gap-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            🔒 Camera frames are processed in real-time and never stored.
          </p>
      </div>
    </div>
  );
}
