"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
  const [currentStepText, setCurrentStepText] = useState("Preparing document...");
  const [status, setStatus] = useState("pending");
  const router = useRouter();
  const supabaseRef = useRef(createClient());

  // Realtime progress logic from Supabase
  useEffect(() => {
    const supabase = supabaseRef.current;
    
    // Initial fetch
    const fetchDoc = async () => {
      const { data } = await supabase.from("documents").select("analysis_progress, analysis_step, analysis_status").eq("id", params.id).single();
      if (data) {
        setProgress(data.analysis_progress || 0);
        if (data.analysis_step) setCurrentStepText(data.analysis_step);
        if (data.analysis_status) {
          setStatus(data.analysis_status);
          if (data.analysis_status === "completed" || data.analysis_status === "failed") {
            setTimeout(() => router.push(`/results/${params.id}`), 500);
          }
        }
      }
    };
    fetchDoc();

    // Setup realtime subscription
    const channel = supabase
      .channel(`analyze-${params.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "documents",
          filter: `id=eq.${params.id}`,
        },
        (payload) => {
          const newDoc = payload.new;
          if (newDoc.analysis_progress !== undefined) setProgress(newDoc.analysis_progress);
          if (newDoc.analysis_step) setCurrentStepText(newDoc.analysis_step);
          if (newDoc.analysis_status) {
            setStatus(newDoc.analysis_status);
            if (newDoc.analysis_status === "completed" || newDoc.analysis_status === "failed") {
              setTimeout(() => router.push(`/results/${params.id}`), 500);
            }
          }
        }
      )
      .subscribe();

    // Fallback polling (every 5s) in case realtime fails
    const interval = setInterval(() => {
      if (status !== "completed" && status !== "failed") {
        fetchDoc();
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [params.id, router, status]);

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
            {currentStepText}
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse inline-block ml-2 border border-foreground" />
          </div>

          {/* Step Checklist */}
          <div className="space-y-4 text-left max-w-sm mx-auto bg-muted/30 p-6 border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]">
            {STEPS.map((step, index) => {
              // Determine which checklist step we're on based on percentage (0-100) -> mapping to 5 steps
              const currentStepIndex = Math.min(
                Math.floor((progress / 100) * STEPS.length),
                STEPS.length - 1
              );
              const isCompleted = index < currentStepIndex || status === "completed";
              const isCurrent = index === currentStepIndex && status !== "completed";

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
