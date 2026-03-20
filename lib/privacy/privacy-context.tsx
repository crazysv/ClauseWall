"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { PrivacyLevel, PrivacyState, ProcessingStep } from "./types";

const PrivacyContext = createContext<PrivacyState | null>(null);

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [level, setLevelState] = useState<PrivacyLevel>("balanced");

  useEffect(() => {
    const saved = localStorage.getItem("clausewall_privacy") as PrivacyLevel;
    if (saved) {
      setLevelState(saved);
    }
  }, []);

  const [processingSteps, setSteps] = useState<ProcessingStep[]>([]);
  const [bytesSent, setBytesSent] = useState(0);

  const setLevel = useCallback((newLevel: PrivacyLevel) => {
    setLevelState(newLevel);
    if (typeof window !== "undefined") {
      localStorage.setItem("clausewall_privacy", newLevel);
    }
  }, []);

  const addStep = useCallback((step: ProcessingStep) => {
    setSteps((prev) => {
      const exists = prev.findIndex((s) => s.id === step.id);
      if (exists >= 0) {
        const updated = [...prev];
        updated[exists] = step;
        return updated;
      }
      return [...prev, step];
    });
  }, []);

  const clearSteps = useCallback(() => {
    setSteps([]);
    setBytesSent(0);
  }, []);

  return (
    <PrivacyContext.Provider
      value={{
        level,
        setLevel,
        processingSteps,
        addStep,
        clearSteps,
        bytesSent,
        setBytesSent,
      }}
    >
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy(): PrivacyState {
  const ctx = useContext(PrivacyContext);
  if (!ctx) {
    throw new Error("usePrivacy must be used within PrivacyProvider");
  }
  return ctx;
}