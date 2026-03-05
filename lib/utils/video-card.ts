// ============================================
// ANIMATED VIDEO CARD GENERATOR
// Uses Canvas API + MediaRecorder
// ============================================

interface VideoCardData {
  score: number;
  riskLabel: string;
  documentType: string;
  jurisdiction: string;
  illegalCount: number;
  dangerousCount: number;
  warningCount: number;
  safeCount: number;
  topRedFlag: string | null;
  verificationRate: number;
}

interface ThemeConfig {
  accent: string;
  bgStart: string;
  bgEnd: string;
}

const THEMES: Record<string, ThemeConfig> = {
  safe: { accent: "#4ade80", bgStart: "#030a06", bgEnd: "#07190c" },
  warning: { accent: "#facc15", bgStart: "#0a0803", bgEnd: "#1a1507" },
  dangerous: { accent: "#f87171", bgStart: "#0a0303", bgEnd: "#1a0808" },
  illegal: { accent: "#c084fc", bgStart: "#06030a", bgEnd: "#0f071a" },
};

function getRiskFromScore(score: number): string {
  if (score <= 30) return "safe";
  if (score <= 60) return "warning";
  if (score <= 80) return "dangerous";
  return "illegal";
}

// Easing function
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeOutBounce(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t;
  if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
  if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
  return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
}

export async function generateVideoCard(
  data: VideoCardData,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const WIDTH = 1080;
  const HEIGHT = 1350;
  const FPS = 30;
  const DURATION = 4; // seconds
  const TOTAL_FRAMES = FPS * DURATION;

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d")!;

  const risk = getRiskFromScore(data.score);
  const theme = THEMES[risk];

  // Setup MediaRecorder
  const stream = canvas.captureStream(FPS);
  const chunks: Blob[] = [];

  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm";

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 5000000,
  });

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      resolve(blob);
    };

    recorder.onerror = () => reject(new Error("Recording failed"));

    recorder.start();

    let frame = 0;

    function drawFrame() {
      const progress = frame / TOTAL_FRAMES;

      // Clear
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // Background gradient
      const bgAlpha = Math.min(1, progress * 3);
      const grad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
      grad.addColorStop(0, theme.bgStart);
      grad.addColorStop(1, theme.bgEnd);
      ctx.globalAlpha = bgAlpha;
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.globalAlpha = 1;

      // Top glow
      if (progress > 0.1) {
        const glowAlpha = Math.min(0.15, (progress - 0.1) * 0.5);
        const glow = ctx.createRadialGradient(WIDTH / 2, 0, 0, WIDTH / 2, 0, 400);
        glow.addColorStop(0, theme.accent + Math.round(glowAlpha * 255).toString(16).padStart(2, "0"));
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, WIDTH, 400);
      }

      // ── HEADER (0.0s - 0.5s) ──
      if (progress > 0.05) {
        const headerP = Math.min(1, (progress - 0.05) / 0.15);
        const headerEased = easeOutCubic(headerP);
        ctx.globalAlpha = headerEased;

        ctx.font = "800 28px Inter, system-ui, sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText("🛡️ CLAUSEWALL", WIDTH / 2, 80);

        ctx.font = "500 16px Inter, system-ui, sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("CONTRACT SCORE CARD", WIDTH / 2, 108);

        ctx.globalAlpha = 1;
      }

      // ── DIVIDER (0.2s) ──
      if (progress > 0.1) {
        const divP = Math.min(1, (progress - 0.1) / 0.1);
        ctx.strokeStyle = `rgba(255,255,255,${0.08 * divP})`;
        ctx.lineWidth = 1;
        const divWidth = WIDTH * 0.7 * easeOutCubic(divP);
        ctx.beginPath();
        ctx.moveTo((WIDTH - divWidth) / 2, 135);
        ctx.lineTo((WIDTH + divWidth) / 2, 135);
        ctx.stroke();
      }

      // ── DOC INFO (0.3s) ──
      if (progress > 0.15) {
        const infoP = Math.min(1, (progress - 0.15) / 0.12);
        ctx.globalAlpha = easeOutCubic(infoP);
        ctx.font = "500 18px Inter, system-ui, sans-serif";
        ctx.fillStyle = "#e2e8f0";
        ctx.textAlign = "center";
        ctx.fillText(`📄 ${data.documentType}    📍 ${data.jurisdiction}`, WIDTH / 2, 180);
        ctx.globalAlpha = 1;
      }

      // ── SCORE RING (0.25s - 0.65s) ──
      if (progress > 0.2) {
        const ringP = Math.min(1, (progress - 0.2) / 0.35);
        const ringEased = easeOutCubic(ringP);
        const centerX = WIDTH / 2;
        const centerY = 380;
        const radius = 100;

        // Background ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.lineWidth = 14;
        ctx.stroke();

        // Score ring (animated)
        const targetAngle = (data.score / 100) * Math.PI * 2;
        const currentAngle = targetAngle * ringEased;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + currentAngle);
        ctx.strokeStyle = theme.accent;
        ctx.lineWidth = 14;
        ctx.lineCap = "round";
        ctx.shadowColor = theme.accent;
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Score number (counting up)
        const displayScore = Math.round(data.score * ringEased);
        ctx.font = "800 80px Inter, system-ui, sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${displayScore}`, centerX, centerY - 8);

        ctx.font = "500 22px Inter, system-ui, sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("/100", centerX, centerY + 35);
        ctx.textBaseline = "alphabetic";
      }

      // ── RISK LABEL (0.6s) ──
      if (progress > 0.55) {
        const labelP = Math.min(1, (progress - 0.55) / 0.1);
        const labelEased = easeOutBounce(labelP);
        const scale = labelEased;
        const centerX = WIDTH / 2;
        const y = 530;

        ctx.save();
        ctx.translate(centerX, y);
        ctx.scale(scale, scale);

        // Pill background
        const pillWidth = 200;
        const pillHeight = 40;
        ctx.fillStyle = theme.accent + "25";
        ctx.beginPath();
        ctx.roundRect(-pillWidth / 2, -pillHeight / 2, pillWidth, pillHeight, 20);
        ctx.fill();
        ctx.strokeStyle = theme.accent + "50";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = "700 16px Inter, system-ui, sans-serif";
        ctx.fillStyle = theme.accent;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(data.riskLabel, 0, 0);
        ctx.textBaseline = "alphabetic";

        ctx.restore();
      }

      // ── CLAUSE BREAKDOWN (0.65s) ──
      if (progress > 0.6) {
        const clauseP = Math.min(1, (progress - 0.6) / 0.15);
        const items = [
          { count: data.illegalCount, label: "⛔ Illegal", color: "#c084fc" },
          { count: data.dangerousCount, label: "🔴 Dangerous", color: "#f87171" },
          { count: data.warningCount, label: "⚠️ Warning", color: "#facc15" },
          { count: data.safeCount, label: "✅ Safe", color: "#4ade80" },
        ];

        const boxY = 590;
        const boxW = WIDTH - 96;
        const boxH = 90;
        const boxX = 48;

        // Box background
        ctx.globalAlpha = easeOutCubic(clauseP);
        ctx.fillStyle = "rgba(255,255,255,0.04)";
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 16);
        ctx.fill();

        // Items
        const itemWidth = boxW / 4;
        items.forEach((item, i) => {
          const itemP = Math.min(1, (clauseP - i * 0.08) / 0.2);
          if (itemP <= 0) return;
          const eased = easeOutCubic(Math.max(0, itemP));
          const x = boxX + itemWidth * i + itemWidth / 2;

          ctx.globalAlpha = eased;

          ctx.font = "800 30px Inter, system-ui, sans-serif";
          ctx.fillStyle = item.color;
          ctx.textAlign = "center";
          ctx.fillText(`${item.count}`, x, boxY + 40);

          ctx.font = "500 13px Inter, system-ui, sans-serif";
          ctx.fillStyle = "#e2e8f0";
          ctx.fillText(item.label, x, boxY + 65);
        });
        ctx.globalAlpha = 1;
      }

      // ── RED FLAG (0.75s) ──
      if (progress > 0.7 && data.topRedFlag && !false) {
        const flagP = Math.min(1, (progress - 0.7) / 0.12);
        const flagEased = easeOutCubic(flagP);
        const flagY = 710;
        const slideX = -30 * (1 - flagEased);

        ctx.save();
        ctx.translate(slideX, 0);
        ctx.globalAlpha = flagEased;

        // Box
        ctx.fillStyle = `${theme.accent}10`;
        ctx.beginPath();
        ctx.roundRect(48, flagY, WIDTH - 96, 100, 16);
        ctx.fill();

        // Left border
        ctx.fillStyle = theme.accent;
        ctx.fillRect(48, flagY, 4, 100);

        ctx.font = "700 13px Inter, system-ui, sans-serif";
        ctx.fillStyle = theme.accent;
        ctx.textAlign = "left";
        ctx.fillText("🚩 TOP RED FLAG", 72, flagY + 28);

        ctx.font = "400 15px Inter, system-ui, sans-serif";
        ctx.fillStyle = "#e2e8f0";
        const flagText = data.topRedFlag.length > 80 ? data.topRedFlag.substring(0, 77) + "..." : data.topRedFlag;
        wrapText(ctx, flagText, 72, flagY + 52, WIDTH - 168, 20);

        ctx.restore();
        ctx.globalAlpha = 1;
      }

      // ── VERIFICATION (0.8s) ──
      if (progress > 0.78) {
        const verP = Math.min(1, (progress - 0.78) / 0.1);
        ctx.globalAlpha = easeOutCubic(verP);
        ctx.font = "500 15px Inter, system-ui, sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.textAlign = "center";
        ctx.fillText(`⚖️ ${data.verificationRate}% verified against Indian legal database`, WIDTH / 2, 860);
        ctx.globalAlpha = 1;
      }

      // ── FOOTER (0.85s) ──
      if (progress > 0.82) {
        const footP = Math.min(1, (progress - 0.82) / 0.12);
        ctx.globalAlpha = easeOutCubic(footP);

        const footY = HEIGHT - 130;
        ctx.fillStyle = "rgba(255,255,255,0.04)";
        ctx.beginPath();
        ctx.roundRect(48, footY, WIDTH - 96, 90, 16);
        ctx.fill();

        ctx.font = "800 22px Inter, system-ui, sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "right";
        ctx.fillText("🛡️ ClauseWall", WIDTH - 72, footY + 35);

        ctx.font = "500 14px Inter, system-ui, sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("India's AI Contract Analyzer 🇮🇳", WIDTH - 72, footY + 56);

        ctx.font = "600 14px Inter, system-ui, sans-serif";
        ctx.fillStyle = theme.accent;
        ctx.fillText("Scan your contract free →", WIDTH - 72, footY + 76);

        ctx.globalAlpha = 1;
      }

      // Progress callback
      if (onProgress) onProgress(Math.round((frame / TOTAL_FRAMES) * 100));

      frame++;
      if (frame <= TOTAL_FRAMES) {
        requestAnimationFrame(drawFrame);
      } else {
        // Hold last frame briefly
        setTimeout(() => recorder.stop(), 500);
      }
    }

    requestAnimationFrame(drawFrame);
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, currentY);
      line = word + " ";
      currentY += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
}