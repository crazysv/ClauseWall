"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { playRiskSound as playSoundEffect } from "./sound-effects";

interface SoundContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playRiskSound: (riskLevel: string) => void;
}

const SoundContext = createContext<SoundContextType>({
  isMuted: false,
  toggleMute: () => {},
  playRiskSound: () => {},
});

const STORAGE_KEY = "clausewall_sound_muted";

export function SoundProvider({ children }: { children: ReactNode }) {
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false);

  // Load preference from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") {
        setIsMuted(true);
        isMutedRef.current = true;
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  // Keep ref in sync
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      isMutedRef.current = next;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // localStorage unavailable
      }
      return next;
    });
  }, []);

  // Uses ref so this function reference never changes
  // and always checks latest mute state
  const playRiskSound = useCallback((riskLevel: string) => {
    if (isMutedRef.current) return;
    playSoundEffect(riskLevel);
  }, []);

  return (
    <SoundContext.Provider value={{ isMuted, toggleMute, playRiskSound }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  return useContext(SoundContext);
}