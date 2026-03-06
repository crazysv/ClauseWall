// ============================================
// CLAUSEWALL — WEB AUDIO API SOUND EFFECTS
// Zero file downloads, pure synthesized audio
// ============================================

let audioCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  try {
    if (!audioCtx) {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      audioCtx = new AudioCtx();
    }

    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * 🟢 Safe contract (0-30) — Pleasant ascending chime
 * Three ascending notes: C5 → E5 → G5
 */
function playSafeSound(): void {
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + i * 0.12);

    gain.gain.setValueAtTime(0, now + i * 0.12);
    gain.gain.linearRampToValueAtTime(0.25, now + i * 0.12 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.45);

    osc.start(now + i * 0.12);
    osc.stop(now + i * 0.12 + 0.45);
  });
}

/**
 * 🟡 Warning (31-60) — Subtle double ding
 * Two quick triangle wave pings
 */
function playWarningSound(): void {
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  [0, 0.18].forEach((delay) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "triangle";
    osc.frequency.setValueAtTime(880, now + delay);

    gain.gain.setValueAtTime(0, now + delay);
    gain.gain.linearRampToValueAtTime(0.3, now + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.3);

    osc.start(now + delay);
    osc.stop(now + delay + 0.3);
  });
}

/**
 * 🔴 Dangerous (61-85) — Urgent descending alarm
 * Two descending sweeps with filtered sawtooth
 */
function playDangerousSound(): void {
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2000, now);
  filter.connect(ctx.destination);

  [0, 0.45].forEach((delay) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(filter);

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(880, now + delay);
    osc.frequency.exponentialRampToValueAtTime(440, now + delay + 0.35);

    gain.gain.setValueAtTime(0.12, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);

    osc.start(now + delay);
    osc.stop(now + delay + 0.4);
  });
}

/**
 * ⛔ Illegal (86-100) — Dramatic short siren
 * Oscillating frequency siren with filtered sawtooth
 */
function playIllegalSound(): void {
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1800, now);
  filter.connect(ctx.destination);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(filter);

  osc.type = "sawtooth";

  // Siren oscillation: 3 up-down cycles
  for (let i = 0; i < 3; i++) {
    const t = now + i * 0.5;
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.linearRampToValueAtTime(900, t + 0.25);
    osc.frequency.linearRampToValueAtTime(600, t + 0.5);
  }

  gain.gain.setValueAtTime(0.1, now);
  gain.gain.setValueAtTime(0.1, now + 1.3);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

  osc.start(now);
  osc.stop(now + 1.5);
}

/**
 * Play sound based on risk level
 */
export function playRiskSound(riskLevel: string): void {
  switch (riskLevel) {
    case "safe":
      playSafeSound();
      break;
    case "warning":
      playWarningSound();
      break;
    case "dangerous":
      playDangerousSound();
      break;
    case "illegal":
      playIllegalSound();
      break;
  }
}