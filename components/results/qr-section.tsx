"use client";

import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import {
  QrCode,
  Download,
  Copy,
  Check,
  Loader2,
  ShieldCheck,
  Settings2,
  Printer,
  Eye,
  EyeOff,
  FileText,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  getVerificationTier,
  getTierConfig,
  DEFAULT_SHARE_SETTINGS,
} from "@/lib/qr";
import type { ShareSettings } from "@/lib/qr";
import { getStateName, getDocumentTypeLabel } from "@/lib/utils/constants";
import type { Document } from "@/types";

interface QRSectionProps {
  document: Document;
}

export default function QRSection({ document: doc }: QRSectionProps) {
  const [shareId, setShareId] = useState<string | null>(
    doc.public_share_id || null
  );
  const [settings, setSettings] = useState<ShareSettings>(
    doc.share_settings || { ...DEFAULT_SHARE_SETTINGS }
  );
  const [generating, setGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const badgeRef = useRef<HTMLDivElement>(null);

  const tier = getVerificationTier(doc.overall_risk_score);
  const tierConfig = getTierConfig(tier);
  const verifyUrl = shareId
    ? `https://clause-wall.vercel.app/verify/${shareId}`
    : "";

  const formattedDate = new Date(
    doc.qr_generated_at || doc.created_at
  ).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // ── Handlers ──────────────────────────────────────

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/verify/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: doc.id, settings }),
      });

      const data = await res.json();

      if (data.success) {
        setShareId(data.shareId);
        setShowSettings(false);
        toast.success("QR Badge generated!");
      } else {
        toast.error(data.error || "Failed to generate badge");
      }
    } catch {
      toast.error("Failed to generate badge");
    } finally {
      setGenerating(false);
    }
  };

  const downloadPNG = async () => {
    if (!badgeRef.current) return;
    try {
      const dataUrl = await toPng(badgeRef.current, {
        quality: 1.0,
        pixelRatio: 3,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `clausewall-badge-${shareId}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Badge downloaded as PNG");
    } catch {
      toast.error("Failed to download badge");
    }
  };

  const printBadge = async () => {
    if (!badgeRef.current) return;
    try {
      const dataUrl = await toPng(badgeRef.current, {
        quality: 1.0,
        pixelRatio: 3,
        backgroundColor: "#ffffff",
      });

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Pop-up blocked — please allow pop-ups");
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>ClauseWall Badge — Print</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: white;
              }
              img {
                max-width: 380px;
                width: 100%;
                height: auto;
              }
              @media print {
                body { margin: 0; padding: 20px; }
                img { max-width: 300px; }
              }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" alt="ClauseWall Verification Badge" />
            <script>
              window.onload = function() {
                setTimeout(function() { window.print(); }, 300);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      toast.success("Print dialog opened — save as PDF if needed");
    } catch {
      toast.error("Failed to open print dialog");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(verifyUrl);
      setCopied(true);
      toast.success("Verify link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  // ── Settings Toggle ────────────────────────────────

  const SettingsToggle = ({
    label,
    description,
    icon: Icon,
    checked,
    onChange,
  }: {
    label: string;
    description: string;
    icon: typeof Eye;
    checked: boolean;
    onChange: (val: boolean) => void;
  }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-3 w-full p-3 rounded-lg border transition-all text-left ${
        checked
          ? "bg-blue-500/10 border-blue-500/30"
          : "bg-white/[0.02] border-white/5 hover:border-white/10"
      }`}
    >
      <div
        className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
          checked ? "bg-blue-500" : "bg-white/10"
        }`}
      >
        {checked && <Check className="h-3 w-3 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          {label}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </button>
  );

  // ── RENDER: No QR yet ──────────────────────────────

  if (!shareId) {
    return (
      <>
        <Card className="bg-gray-900/50 border-gray-800 mt-8">
          <CardContent className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-14 w-14 rounded-full bg-blue-500/10 flex items-center justify-center">
                <QrCode className="h-7 w-7 text-blue-400" />
              </div>
            </div>
            <h3 className="text-lg font-bold mb-2">Scan Before You Sign</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Generate a QR verification badge for this contract. Share it with
              the other party to build trust before signing.
            </p>
            <Button
              onClick={() => setShowSettings(true)}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <ShieldCheck className="h-4 w-4" />
              Generate QR Badge
            </Button>
          </CardContent>
        </Card>

        {/* Settings Dialog */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="bg-gray-900 border-gray-800 max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-blue-400" />
                Badge Privacy Settings
              </DialogTitle>
              <DialogDescription>
                Choose what information is visible when someone scans the QR
                code.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              <SettingsToggle
                label="Show entity name"
                description="Landlord/company name visible on verify page"
                icon={Eye}
                checked={settings.show_entity}
                onChange={(val) =>
                  setSettings((prev) => ({ ...prev, show_entity: val }))
                }
              />
              <SettingsToggle
                label="Show analysis summary"
                description="Brief summary of findings visible on verify page"
                icon={FileText}
                checked={settings.show_summary}
                onChange={(val) =>
                  setSettings((prev) => ({ ...prev, show_summary: val }))
                }
              />
              <SettingsToggle
                label="Allow full analysis access"
                description="'View Full Analysis' button on verify page links to complete results"
                icon={EyeOff}
                checked={settings.allow_full_analysis}
                onChange={(val) =>
                  setSettings((prev) => ({
                    ...prev,
                    allow_full_analysis: val,
                  }))
                }
              />
            </div>

            <div className="rounded-lg bg-blue-500/5 border border-blue-500/10 p-3">
              <p className="text-xs text-blue-300">
                <strong>Always visible:</strong> Verification badge, risk score,
                clause breakdown counts, document type, jurisdiction, and analysis
                date.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="ghost"
                onClick={() => setShowSettings(false)}
                disabled={generating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Generate Badge
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // ── RENDER: QR Generated ──────────────────────────

  return (
    <>
      <Card className="bg-gray-900/50 border-gray-800 mt-8 overflow-hidden">
        {/* Header stripe */}
        <div
          className="h-1"
          style={{ backgroundColor: tierConfig.color }}
        />

        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <QrCode className="h-5 w-5 text-blue-400" />
              Scan Before You Sign
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="gap-1.5 text-xs text-muted-foreground"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Settings
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left — QR Code */}
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-xl">
                <QRCodeSVG
                  value={verifyUrl}
                  size={160}
                  bgColor="#ffffff"
                  fgColor="#111827"
                  level="M"
                  includeMargin={false}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Scan with any phone camera
              </p>
            </div>

            {/* Right — Badge Info */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{tierConfig.icon}</span>
                <span
                  className="text-lg font-bold"
                  style={{ color: tierConfig.color }}
                >
                  {tierConfig.label}
                </span>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {tierConfig.description}
              </p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>📋</span>
                  <span>{getDocumentTypeLabel(doc.document_type)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>📍</span>
                  <span>{getStateName(doc.jurisdiction)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>📅</span>
                  <span>Verified: {formattedDate}</span>
                </div>
                {doc.share_count > 0 && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>Scanned {doc.share_count} times</span>
                  </div>
                )}
              </div>

              {/* Verify URL */}
              <div className="mt-4 flex items-center gap-2 bg-white/[0.03] rounded-lg px-3 py-2 border border-white/5">
                <code className="text-xs text-blue-400 truncate flex-1">
                  {verifyUrl}
                </code>
                <button
                  onClick={copyLink}
                  className="flex-shrink-0 text-muted-foreground hover:text-white transition-colors"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Download Buttons */}
          <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/5">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadPNG}
              className="gap-2"
            >
              <Download className="h-3.5 w-3.5" />
              Download PNG
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={printBadge}
              className="gap-2"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Save PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={copyLink}
              className="gap-2"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              Copy Link
            </Button>
          </div>

          {/* Privacy indicator */}
          <div className="mt-4 flex flex-wrap gap-2">
            {settings.show_entity && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Entity visible
              </span>
            )}
            {settings.show_summary && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Summary visible
              </span>
            )}
            {settings.allow_full_analysis && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Full analysis accessible
              </span>
            )}
            {!settings.show_entity &&
              !settings.show_summary &&
              !settings.allow_full_analysis && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground border border-white/5">
                  Summary only — maximum privacy
                </span>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Hidden badge for PNG export — white background for printing */}
      <div style={{ position: "fixed", left: "-9999px", top: 0 }}>
        <div
          ref={badgeRef}
          style={{
            width: 400,
            padding: 32,
            background: "#ffffff",
            borderRadius: 16,
            border: `3px solid ${tierConfig.color}`,
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
            textAlign: "center",
          }}
        >
          {/* Tier */}
          <div style={{ fontSize: 32, marginBottom: 4 }}>{tierConfig.icon}</div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: tierConfig.color,
              marginBottom: 20,
            }}
          >
            {tierConfig.label}
          </div>

          {/* Score */}
          <div
            style={{
              fontSize: 52,
              fontWeight: 800,
              color: "#111827",
              lineHeight: 1,
            }}
          >
            {doc.overall_risk_score}
            <span style={{ fontSize: 20, color: "#6b7280", fontWeight: 400 }}>
              {" "}
              / 100
            </span>
          </div>
          <div
            style={{
              fontSize: 13,
              color: tierConfig.color,
              fontWeight: 600,
              marginTop: 6,
              marginBottom: 24,
            }}
          >
            {tierConfig.description}
          </div>

          {/* QR */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 8,
            }}
          >
            <QRCodeSVG
              value={verifyUrl}
              size={140}
              bgColor="#ffffff"
              fgColor="#111827"
              level="M"
              includeMargin
            />
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 20 }}>
            Scan to verify this contract
          </div>

          {/* Divider */}
          <div
            style={{ height: 1, background: "#e5e7eb", margin: "0 0 16px 0" }}
          />

          {/* Details */}
          <div
            style={{
              fontSize: 13,
              color: "#374151",
              textAlign: "left",
              lineHeight: 2,
            }}
          >
            <div>📋 {getDocumentTypeLabel(doc.document_type)}</div>
            <div>📍 {getStateName(doc.jurisdiction)}</div>
            <div>📅 {formattedDate}</div>
          </div>

          {/* Divider */}
          <div
            style={{ height: 1, background: "#e5e7eb", margin: "16px 0" }}
          />

          {/* Clause Breakdown */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              marginBottom: 16,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#22c55e" }}>
                {doc.safe_count}
              </div>
              <div style={{ fontSize: 10, color: "#9ca3af" }}>Safe</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#eab308" }}>
                {doc.warning_count}
              </div>
              <div style={{ fontSize: 10, color: "#9ca3af" }}>Warning</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#ef4444" }}>
                {doc.dangerous_count}
              </div>
              <div style={{ fontSize: 10, color: "#9ca3af" }}>Dangerous</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#a855f7" }}>
                {doc.illegal_count}
              </div>
              <div style={{ fontSize: 10, color: "#9ca3af" }}>Illegal</div>
            </div>
          </div>

          {/* Divider */}
          <div
            style={{ height: 1, background: "#e5e7eb", margin: "0 0 16px 0" }}
          />

          {/* Branding */}
          <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
            🛡️ ClauseWall
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
            India&apos;s AI Contract Analyzer
          </div>
          <div style={{ fontSize: 10, color: "#b0b0b0", marginTop: 4 }}>
            clause-wall.vercel.app
          </div>
        </div>
      </div>

      {/* Settings Update Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-blue-400" />
              Update Badge Settings
            </DialogTitle>
            <DialogDescription>
              Change what information is visible when someone scans the QR code.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <SettingsToggle
              label="Show entity name"
              description="Landlord/company name visible on verify page"
              icon={Eye}
              checked={settings.show_entity}
              onChange={(val) =>
                setSettings((prev) => ({ ...prev, show_entity: val }))
              }
            />
            <SettingsToggle
              label="Show analysis summary"
              description="Brief summary of findings visible on verify page"
              icon={FileText}
              checked={settings.show_summary}
              onChange={(val) =>
                setSettings((prev) => ({ ...prev, show_summary: val }))
              }
            />
            <SettingsToggle
              label="Allow full analysis access"
              description="'View Full Analysis' button links to complete results"
              icon={EyeOff}
              checked={settings.allow_full_analysis}
              onChange={(val) =>
                setSettings((prev) => ({
                  ...prev,
                  allow_full_analysis: val,
                }))
              }
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setShowSettings(false)}
              disabled={generating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Update Settings
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Internal sub-component ────────────────────────

function SettingsToggle({
  label,
  description,
  icon: Icon,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  icon: typeof Eye;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-3 w-full p-3 rounded-lg border transition-all text-left ${
        checked
          ? "bg-blue-500/10 border-blue-500/30"
          : "bg-white/[0.02] border-white/5 hover:border-white/10"
      }`}
    >
      <div
        className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
          checked ? "bg-blue-500" : "bg-white/10"
        }`}
      >
        {checked && <Check className="h-3 w-3 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          {label}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </button>
  );
}