"use client";

import { useEffect, useRef } from "react";

interface AudioWaveformProps {
  stream: MediaStream | null;
  isRecording: boolean;
}

export default function AudioWaveform({ stream, isRecording }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!stream || !isRecording || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);

    // Create audio context and analyser
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.8;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    contextRef.current = audioContext;
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isRecording) return;

      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      const barCount = 32;
      const barWidth = (width / barCount) * 0.6;
      const gap = (width / barCount) * 0.4;
      const centerY = height / 2;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * bufferLength);
        const value = dataArray[dataIndex] / 255;
        const barHeight = Math.max(value * centerY * 0.9, 2);

        const x = i * (barWidth + gap) + gap / 2;

        // Gradient color based on intensity
        const hue = 120 + value * 120; // green → cyan → blue
        const alpha = 0.3 + value * 0.5;

        ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${alpha})`;
        ctx.beginPath();
        ctx.roundRect(x, centerY - barHeight, barWidth, barHeight * 2, 2);
        ctx.fill();
      }
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (contextRef.current) {
        try { contextRef.current.close(); } catch { }
      }
    };
  }, [stream, isRecording]);

  if (!isRecording) return null;

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-12 rounded-xl"
      style={{ maxWidth: "300px" }}
    />
  );
}
