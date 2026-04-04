"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STEPS = [
  "Scanning document structure...",
  "Running OCR & text extraction...",
  "Applying Bhasha Engine NLP...",
  "Checking against legal precedents...",
  "Generating risk profile...",
];

export default function AnalyzePage({ params }: { params: { id: string } }) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  // Mock polling logic as required by the prompt structure
  useEffect(() => {
    const duration = 8000;
    const interval = 100;
    const steps = duration / interval;
    let current = 0;

    const timer = setInterval(() => {
      current++;
      const newProgress = Math.min((current / steps) * 100, 100);
      setProgress(newProgress);

      const stepIndex = Math.min(
        Math.floor((current / steps) * STEPS.length),
        STEPS.length - 1,
      );
      setCurrentStep(stepIndex);

      if (current >= steps) {
        clearInterval(timer);
        // Simulate redirect to results
        setTimeout(() => router.push(`/results/${params.id}`), 500);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [params.id, router]);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="bg-background border-4 border-foreground shadow-[12px_12px_0px_0px_rgba(10,10,10,1)] p-8 md:p-12 max-w-2xl w-full text-center relative overflow-hidden">
        {/* Animated Background Stripes */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 8px)",
          }}
        />

        <div className="relative z-10">
          {/* Document Info */}
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-foreground">
            Analyzing Document
          </h1>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Badge className="bg-muted text-foreground border-2 border-foreground rounded-none shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] font-bold uppercase tracking-wider px-3">
              ID: {params.id.substring(0, 8)}...
            </Badge>
          </div>

          {/* Progress Ring */}
          <div className="relative w-48 h-48 mx-auto mt-12 mb-8 flex items-center justify-center">
            {/* Background SVG Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="96"
                cy="96"
                r={radius}
                className="stroke-muted fill-none"
                strokeWidth="12"
              />
              {/* Progress SVG Ring */}
              <circle
                cx="96"
                cy="96"
                r={radius}
                className="stroke-primary fill-none transition-all duration-300 ease-linear"
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="butt"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black tabular-nums text-foreground tracking-tighter">
                {Math.round(progress)}
                <span className="text-2xl">%</span>
              </span>
            </div>
          </div>

          <div className="text-lg font-black uppercase tracking-wider text-foreground mb-8">
            {STEPS[currentStep]}
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse inline-block ml-2 border border-foreground" />
          </div>

          {/* Step Checklist */}
          <div className="space-y-4 text-left max-w-sm mx-auto bg-muted/30 p-6 border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]">
            {STEPS.map((step, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;

              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="shrink-0 flex items-center justify-center w-6 h-6">
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600 fill-green-100" />
                    ) : isCurrent ? (
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <span
                    className={`text-sm tracking-wider uppercase ${
                      isCompleted
                        ? "font-bold text-foreground"
                        : isCurrent
                          ? "font-black text-foreground underline decoration-primary decoration-2 underline-offset-4"
                          : "font-bold text-muted-foreground"
                    }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-10">
            Estimated time remaining:{" "}
            {Math.max(0, Math.ceil((100 - progress) * 0.08))}s
          </p>
          <p className="text-[10px] font-black uppercase bg-primary text-primary-foreground italic mt-4 max-w-md mx-auto inline-block border-2 border-foreground px-3 py-1 shadow-[2px_2px_0px_0px_rgba(10,10,10,1)]">
            Fun fact: 80% of NDAs contain overly broad jurisdiction clauses.
          </p>
        </div>
      </div>
    </div>
  );
}
